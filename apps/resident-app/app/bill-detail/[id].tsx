import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBillDetail } from '../../src/services/billing';
import { PaymentSheet } from '../../src/components/PaymentSheet';
import type { Bill } from '../../src/services/billing';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  textPrimary: '#0B1C30',
  textSecondary: '#434655',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  successBg: '#DCFCE7',
  successText: '#166534',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  surfaceContainerLow: '#EFF4FF',
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

const STATUS_CONFIG = {
  PAID: { label: 'Paid', bg: Colors.successBg, text: Colors.successText, iconName: 'checkmark-circle' },
  PENDING: { label: 'Pending', bg: Colors.warningBg, text: Colors.warningText, iconName: 'time' },
  OVERDUE: { label: 'Overdue', bg: Colors.dangerBg, text: Colors.dangerText, iconName: 'warning' },
} as const;

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getDaysInfo(dueDate: string, status: string): { text: string; color: string } {
  if (status === 'PAID') return { text: 'Paid', color: Colors.successText };

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, color: Colors.dangerText };
  if (diffDays === 0) return { text: 'Due today', color: Colors.warningText };
  if (diffDays === 1) return { text: 'Due tomorrow', color: Colors.warningText };
  return { text: `Due in ${diffDays} days`, color: Colors.textTertiary };
}

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchBill = async () => {
      try {
        setIsLoading(true);
        const data = await getBillDetail(id);
        setBill(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load bill');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBill();
  }, [id]);

  const handlePaymentComplete = (updatedBill: Bill) => {
    setBill(updatedBill);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !bill) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconCircle}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.dangerText} />
        </View>
        <Text style={styles.errorText}>{error || 'Bill not found'}</Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => router.back()}>
          <Text style={styles.errorBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[bill.status];
  const daysInfo = getDaysInfo(bill.dueDate, bill.status);
  const breakdown = bill.breakdown as Array<{ label: string; amount: number }>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bill Header Card */}
        <View style={[styles.card, styles.billHeader]}>
          <View style={[styles.statusBadgeLarge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.iconName} size={16} color={statusConfig.text} />
            <Text style={[styles.statusLabel, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>

          <Text style={styles.billMonth}>
            {new Date(bill.dueDate).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>

          <Text style={styles.billAmount}>{formatCurrency(bill.amountDue)}</Text>

          <Text style={[styles.daysText, { color: daysInfo.color }]}>
            {daysInfo.text}
          </Text>

          {bill.unit && (
            <View style={styles.unitRow}>
              <Ionicons name="home-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.unitInfo}>
                Unit {bill.unit.identifier} • {bill.society?.name}
              </Text>
            </View>
          )}
        </View>

        {/* Breakdown */}
        <View style={[styles.card]}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          {breakdown.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.breakdownRow,
                index < breakdown.length - 1 && styles.breakdownRowBorder,
              ]}
            >
              <Text style={styles.breakdownLabel}>{item.label}</Text>
              <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
          <View style={styles.breakdownTotal}>
            <Text style={styles.breakdownTotalLabel}>Total</Text>
            <Text style={styles.breakdownTotalAmount}>{formatCurrency(bill.amountDue)}</Text>
          </View>
        </View>

        {/* Due Date Info */}
        <View style={[styles.card]}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>
              {new Date(bill.dueDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bill Generated</Text>
            <Text style={styles.infoValue}>
              {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
          </View>
          {bill.amountPaid > 0 && bill.amountPaid < bill.amountDue && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount Paid</Text>
              <Text style={[styles.infoValue, { color: Colors.successText }]}>
                {formatCurrency(bill.amountPaid)}
              </Text>
            </View>
          )}
        </View>

        {/* Payment Section */}
        <View style={[styles.card]}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <PaymentSheet bill={bill} onPaymentComplete={handlePaymentComplete} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  errorBackBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
  },
  errorBackText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 14,
    ...Shadow.card,
  },

  // ── Bill Header ──
  billHeader: {
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  billMonth: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    marginBottom: 6,
  },
  billAmount: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  daysText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 12,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  unitInfo: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },

  // ── Sections ──
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },

  // ── Breakdown ──
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  breakdownLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  breakdownAmount: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 2,
    borderTopColor: Colors.primary + '20',
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  breakdownTotalAmount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },

  // ── Info Rows ──
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
