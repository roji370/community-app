import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { getBillingSummary } from '../../src/services/billing';
import type { BillingSummary } from '../../src/services/billing';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  primaryContainer: '#2563EB',
  onPrimary: '#FFFFFF',
  textPrimary: '#0B1C30',
  textSecondary: '#434655',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  successBg: '#DCFCE7',
  successText: '#166534',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  surfaceContainerLow: '#EFF4FF',
  surfaceContainerHigh: '#DCE9FF',
  divider: '#E5EEFF',
};

const Radius = {
  card: 24,
  button: 16,
  badge: 999,
  icon: 999,
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

// ─── Main Screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const greeting = getGreeting();
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [complaintsSummary, setComplaintsSummary] = useState<ComplaintsSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchSummary = async () => {
        try {
          const [billing, complaints] = await Promise.all([
            getBillingSummary(),
            getComplaintsSummary(),
          ]);
          setBillingSummary(billing);
          setComplaintsSummary(complaints);
        } catch {
          // Silently fail — dashboard cards show placeholder
        }
      };
      fetchSummary();
    }, []),
  );

  function formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  const maintenanceAmount = billingSummary
    ? billingSummary.totalDue > 0
      ? formatCurrency(billingSummary.totalDue)
      : '₹0'
    : '₹—';

  const isAllClear =
    billingSummary?.totalDue === 0 &&
    complaintsSummary?.openCount === 0;

  const statusText = isAllClear
    ? 'Everything looks good today.'
    : billingSummary?.totalDue
      ? 'You have pending payments.'
      : complaintsSummary?.openCount
        ? `${complaintsSummary.openCount} open complaint${complaintsSummary.openCount > 1 ? 's' : ''}.`
        : 'Loading your dashboard...';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
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

      {/* ── Apartment Card ─────────────────────────────── */}
      <View style={[styles.card, styles.apartmentCard]}>
        <View style={styles.apartmentHeader}>
          <View>
            <Text style={styles.apartmentLabel}>Apartment</Text>
            <Text style={styles.apartmentUnit}>{user?.unit?.identifier || 'A-504'}</Text>
          </View>
          <View style={[styles.statusBadge, isAllClear ? styles.statusClear : styles.statusWarning]}>
            <Ionicons
              name={isAllClear ? 'checkmark-circle' : 'alert-circle'}
              size={14}
              color={isAllClear ? Colors.successText : Colors.warningText}
            />
            <Text style={[styles.statusText, isAllClear ? styles.statusTextClear : styles.statusTextWarning]}>
              {isAllClear ? 'All Clear' : 'Attention'}
            </Text>
          </View>
        </View>
        <Text style={styles.apartmentSubtext}>{statusText}</Text>
      </View>

      {/* ── Today's Activity ───────────────────────────── */}
      <Text style={styles.sectionTitle}>Today's Activity</Text>

      {/* Visitors Card */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/(main)/visitors')}
      >
        <View style={[styles.card, styles.visitorsCard]}>
          <View style={styles.cardRowTop}>
            <View style={styles.cardIconRow}>
              <View style={[styles.iconCircle, styles.iconCirclePrimary]}>
                <Ionicons name="people-outline" size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Visitors</Text>
                <Text style={styles.cardSubtitle}>2 Pending</Text>
              </View>
            </View>
          </View>
          <View style={styles.visitorAction}>
            <View style={styles.visitorInfo}>
              <View style={styles.visitorAvatar}>
                <Ionicons name="person" size={14} color={Colors.textTertiary} />
              </View>
              <Text style={styles.visitorName}>Rahul Sharma</Text>
            </View>
            <TouchableOpacity style={styles.approveBtn} activeOpacity={0.8}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Deliveries Card */}
      <View style={[styles.card, styles.deliveriesCard]}>
        <View style={styles.cardIconRow}>
          <View style={[styles.iconCircle, styles.iconCircleNeutral]}>
            <MaterialCommunityIcons name="package-variant" size={20} color={Colors.textSecondary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Deliveries</Text>
            <View style={styles.deliveryStatus}>
              <View style={styles.deliveryDot} />
              <Text style={styles.cardSubtitle}>1 Arrived</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Maintenance Due Card */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/(main)/billing')}
      >
        <View style={[styles.card, styles.paymentCard]}>
          <View>
            <Text style={styles.paymentLabel}>Maintenance Due</Text>
            <Text style={styles.paymentAmount}>{maintenanceAmount}</Text>
          </View>
          <TouchableOpacity style={styles.payNowBtn} activeOpacity={0.8}>
            <Text style={styles.payNowBtnText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ── Community Updates ──────────────────────────── */}
      <Text style={styles.sectionTitle}>Community Updates</Text>

      {/* Notice Card */}
      <View style={[styles.card, styles.noticeCard]}>
        <View style={styles.noticeContent}>
          <View style={[styles.noticeIcon]}>
            <MaterialCommunityIcons name="bullhorn" size={22} color={Colors.warningText} />
          </View>
          <View style={styles.noticeTextBlock}>
            <Text style={styles.noticeLabel}>GENERAL NOTICE</Text>
            <Text style={styles.noticeTitle}>Water supply interruption</Text>
            <Text style={styles.noticeDesc} numberOfLines={2}>
              Scheduled maintenance for block A from 2 PM to 5 PM tomorrow.
            </Text>
          </View>
        </View>
      </View>

      {/* Event Card */}
      <View style={[styles.card, styles.eventCard]}>
        <View style={styles.eventContent}>
          <View style={styles.eventTextBlock}>
            <Text style={styles.eventLabel}>UPCOMING EVENT</Text>
            <Text style={styles.eventTitle}>Yoga Session</Text>
            <View style={styles.eventMeta}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.eventMetaText}>Sat, 7:00 AM • Clubhouse</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom spacer for floating tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
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
  avatar: {
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

  // ── Cards base ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
    ...Shadow.card,
  },

  // ── Apartment Card ──
  apartmentCard: {
    marginBottom: 28,
  },
  apartmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  apartmentLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  apartmentUnit: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.badge,
  },
  statusClear: {
    backgroundColor: Colors.successBg,
  },
  statusWarning: {
    backgroundColor: Colors.warningBg,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusTextClear: {
    color: Colors.successText,
  },
  statusTextWarning: {
    color: Colors.warningText,
  },
  apartmentSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 16,
    lineHeight: 20,
  },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },

  // ── Visitors Card ──
  visitorsCard: {},
  cardRowTop: {
    marginBottom: 14,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCirclePrimary: {
    backgroundColor: `${Colors.primary}10`,
  },
  iconCircleNeutral: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  visitorAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  visitorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  visitorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitorName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  approveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  approveBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.onPrimary,
  },

  // ── Deliveries Card ──
  deliveriesCard: {
    paddingVertical: 18,
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  deliveryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primaryContainer,
  },

  // ── Payment Card ──
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  payNowBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: Radius.button,
  },
  payNowBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.onPrimary,
  },

  // ── Notice Card ──
  noticeCard: {},
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  noticeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeTextBlock: {
    flex: 1,
  },
  noticeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  noticeTitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  noticeDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 20,
  },

  // ── Event Card ──
  eventCard: {},
  eventContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTextBlock: {
    flex: 1,
  },
  eventLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventMetaText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
