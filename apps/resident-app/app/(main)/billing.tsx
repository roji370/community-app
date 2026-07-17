import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getBills, getBillingSummary } from '../../src/services/billing';
import type { Bill, BillingSummary } from '../../src/services/billing';
import { useAuthStore } from '../../src/store/authStore';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  onPrimary: '#FFFFFF',
  textPrimary: '#0B1C30',
  textSecondary: '#434655',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  successBg: '#DCFCE7',
  successText: '#166534',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  surfaceContainerLow: '#EFF4FF',
  surfaceContainerHigh: '#DCE9FF',
};

const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
};

// ─── Service Bill Icons ──────────────────────────────────────────
const BILL_TYPE_CONFIG: Record<string, {
  icon: string;
  iconName: string;
  iconFamily: 'ionicons' | 'material';
  color: string;
  bg: string;
}> = {
  Electricity: { icon: '⚡', iconName: 'flash', iconFamily: 'ionicons', color: '#F59E0B', bg: '#FEF3C7' },
  Water: { icon: '💧', iconName: 'water', iconFamily: 'ionicons', color: '#3B82F6', bg: '#DBEAFE' },
  Maintenance: { icon: '🏠', iconName: 'home', iconFamily: 'ionicons', color: '#8B5CF6', bg: '#EDE9FE' },
  Gas: { icon: '🔥', iconName: 'flame', iconFamily: 'ionicons', color: '#EF4444', bg: '#FEE2E2' },
};

function getServiceConfig(label: string) {
  // Try to match by partial label
  for (const key of Object.keys(BILL_TYPE_CONFIG)) {
    if (label.toLowerCase().includes(key.toLowerCase())) {
      return BILL_TYPE_CONFIG[key];
    }
  }
  return BILL_TYPE_CONFIG.Maintenance; // default
}

// ─── Helpers ─────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

// ─── Service Bill Item ───────────────────────────────────────────
function ServiceBillItem({ label, amount, dueDate, isPaid }: {
  label: string;
  amount: number;
  dueDate?: string;
  isPaid?: boolean;
}) {
  const config = getServiceConfig(label)!;

  return (
    <View style={styles.serviceBillItem}>
      <View style={styles.serviceBillLeft}>
        <View style={[styles.serviceBillIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.iconName as any} size={18} color={config.color} />
        </View>
        <View>
          <Text style={styles.serviceBillLabel}>{label}</Text>
          <Text style={styles.serviceBillAmount}>{formatCurrency(amount)}</Text>
        </View>
      </View>
      {isPaid ? (
        <Text style={styles.serviceBillPaid}>Paid</Text>
      ) : dueDate ? (
        <Text style={styles.serviceBillDue}>Due {formatDate(dueDate)}</Text>
      ) : null}
    </View>
  );
}

// ─── Recent Activity Item ────────────────────────────────────────
function RecentActivityItem({ bill }: { bill: Bill }) {
  const isRefund = bill.amountPaid < 0; // hypothetical
  const isPaid = bill.status === 'PAID';

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityLeft}>
        <View style={[styles.activityIcon, isPaid ? styles.activityIconPaid : styles.activityIconPending]}>
          {isPaid ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.successText} />
          ) : (
            <Ionicons name="time" size={20} color={Colors.warningText} />
          )}
        </View>
        <View style={styles.activityTextBlock}>
          <Text style={styles.activityTitle}>{bill.unit?.identifier || 'Maintenance'} Bill</Text>
          <Text style={styles.activityMeta}>
            {formatFullDate(bill.createdAt)}
            {bill.paidAt ? ' • Paid' : ''}
          </Text>
        </View>
      </View>
      <Text style={[styles.activityAmount, isPaid && styles.activityAmountPaid]}>
        {isPaid ? '-' : ''}{formatCurrency(bill.amountDue)}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function BillingScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const greeting = getGreeting();
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [billsResponse, summaryResponse] = await Promise.all([
        getBills({ page: 1, limit: 20 }),
        getBillingSummary(),
      ]);
      setBills(billsResponse.bills);
      setSummary(summaryResponse);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [fetchData]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleBillPress = (bill: Bill) => {
    router.push(`/bill-detail/${bill.id}` as any);
  };

  // Split bills into pending/paid for display
  const pendingBills = bills.filter((b) => b.status !== 'PAID');
  const paidBills = bills.filter((b) => b.status === 'PAID');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.greetingText}>
            {greeting}{' '}
            <Text style={styles.greetingName}>{user?.name || 'Resident'}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Total Amount Due Hero Card ─────────────────── */}
      {summary && (
        <View style={[styles.card, styles.heroCard]}>
          <Text style={styles.heroLabel}>Total Amount Due</Text>
          <Text style={styles.heroAmount}>
            {summary.totalDue > 0 ? formatCurrency(summary.totalDue) : '₹0'}
          </Text>
          {summary.nextDueDate && summary.totalDue > 0 && (
            <View style={styles.heroDueBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.dangerText} />
              <Text style={styles.heroDueText}>
                Due by {formatDate(summary.nextDueDate)}
              </Text>
            </View>
          )}
          {summary.totalDue > 0 && (
            <TouchableOpacity style={styles.payNowBtn} activeOpacity={0.8}>
              <Text style={styles.payNowBtnText}>Pay Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Service Bills ──────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Service Bills</Text>
        </View>
      </View>

      <View style={styles.card}>
        {bills.length > 0 ? (
          bills.slice(0, 4).map((bill, index) => {
            // Use breakdown items or bill title
            const label = bill.breakdown?.[0]?.label || 'Maintenance';
            return (
              <React.Fragment key={bill.id}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleBillPress(bill)}>
                  <ServiceBillItem
                    label={label}
                    amount={bill.amountDue}
                    dueDate={bill.dueDate}
                    isPaid={bill.status === 'PAID'}
                  />
                </TouchableOpacity>
                {index < Math.min(bills.length, 4) - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineText}>No bills yet</Text>
          </View>
        )}
      </View>

      {/* ── Recent Activity ────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {bills.length > 0 ? (
          bills.slice(0, 4).map((bill, index) => (
            <React.Fragment key={bill.id}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleBillPress(bill)}>
                <RecentActivityItem bill={bill} />
              </TouchableOpacity>
              {index < Math.min(bills.length, 4) - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))
        ) : (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineText}>No recent transactions</Text>
          </View>
        )}
      </View>

      {/* Bottom spacer for floating tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  greetingName: {
    fontWeight: '700',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Card base ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    ...Shadow.card,
  },

  // ── Hero Card ──
  heroCard: {
    marginBottom: 28,
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 18,
  },
  heroDueText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.dangerText,
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  payNowBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.primary,
  },

  // ── Service Bill Item ──
  serviceBillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  serviceBillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  serviceBillIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceBillLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  serviceBillAmount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  serviceBillDue: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.dangerText,
  },
  serviceBillPaid: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
  },

  // ── Recent Activity Item ──
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIconPaid: {
    backgroundColor: Colors.successBg,
  },
  activityIconPending: {
    backgroundColor: Colors.warningBg,
  },
  activityTextBlock: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  activityMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  activityAmountPaid: {
    color: Colors.textTertiary,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },

  // ── Empty inline ──
  emptyInline: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyInlineText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
