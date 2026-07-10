import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

// ─── Design Tokens (shared with home.tsx) ────────────────────────
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

// ─── Types ───────────────────────────────────────────────────────
interface Visitor {
  id: string;
  name: string;
  purpose: string;
  photoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  createdAt: string;
  guard: { name: string } | null;
  respondedByUser: { name: string } | null;
}

const PURPOSE_CONFIG: Record<string, { label: string; icon: string; iconName: string }> = {
  GUEST: { label: 'Personal Guest', icon: '👤', iconName: 'person' },
  DELIVERY: { label: 'Delivery', icon: '📦', iconName: 'cube' },
  CAB: { label: 'Cab', icon: '🚗', iconName: 'car' },
  COURIER: { label: 'Courier', icon: '📬', iconName: 'mail' },
  DOMESTIC_HELP: { label: 'Domestic Help', icon: '🏠', iconName: 'home' },
  MAINTENANCE: { label: 'Service Provider', icon: '🔧', iconName: 'build' },
  OTHER: { label: 'Other', icon: '👥', iconName: 'people' },
};

const DEFAULT_PURPOSE = { label: 'Other', icon: '👥', iconName: 'people' };

const STATUS_CONFIG = {
  APPROVED: { label: 'Approved', color: Colors.successText, bg: Colors.successBg },
  DENIED: { label: 'Denied', color: Colors.dangerText, bg: Colors.dangerBg },
  PENDING: { label: 'Waiting at Gate', color: Colors.dangerText, bg: Colors.dangerBg },
  EXPIRED: { label: 'Expired', color: Colors.textTertiary, bg: Colors.surfaceContainerLow },
};

// ─── Action Required Card ────────────────────────────────────────
function ActionRequiredCard({ visitor, onApprove, onReject }: {
  visitor: Visitor;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const purpose = PURPOSE_CONFIG[visitor.purpose] ?? DEFAULT_PURPOSE;

  return (
    <View style={[styles.card, styles.actionCard]}>
      {/* Visitor Photo / Placeholder */}
      <View style={styles.actionImageContainer}>
        {visitor.photoUrl ? (
          <Image source={{ uri: visitor.photoUrl }} style={styles.actionImage} />
        ) : (
          <View style={styles.actionImagePlaceholder}>
            <Ionicons name="person" size={48} color={Colors.textTertiary} />
          </View>
        )}
        {/* Overlay: Name + Purpose */}
        <View style={styles.actionOverlay}>
          <View style={styles.actionNameBlock}>
            <Text style={styles.actionName}>{visitor.name}</Text>
            <View style={styles.actionPurposeRow}>
              <MaterialCommunityIcons name="truck-delivery" size={14} color="#FFFFFF" />
              <Text style={styles.actionPurpose}>{purpose.label}</Text>
            </View>
          </View>
          <View style={styles.actionStatusBadge}>
            <View style={styles.actionStatusDot} />
            <Text style={styles.actionStatusText}>Waiting at Gate</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectBtn}
          activeOpacity={0.7}
          onPress={() => onReject(visitor.id)}
        >
          <Ionicons name="close" size={18} color={Colors.dangerText} />
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          activeOpacity={0.7}
          onPress={() => onApprove(visitor.id)}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.approveBtnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Expected Today Item ─────────────────────────────────────────
function ExpectedTodayItem({ visitor }: { visitor: Visitor }) {
  const purpose = PURPOSE_CONFIG[visitor.purpose] ?? DEFAULT_PURPOSE;
  const time = new Date(visitor.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={styles.expectedItem}>
      <View style={styles.expectedLeft}>
        {visitor.photoUrl ? (
          <Image source={{ uri: visitor.photoUrl }} style={styles.expectedAvatar} />
        ) : (
          <View style={styles.expectedAvatarPlaceholder}>
            <Ionicons name={purpose.iconName as any} size={18} color={Colors.textTertiary} />
          </View>
        )}
        <View>
          <Text style={styles.expectedName}>{visitor.name}</Text>
          <Text style={styles.expectedPurpose}>{purpose.label}</Text>
        </View>
      </View>
      <View style={styles.expectedRight}>
        <Text style={styles.expectedTime}>{time}</Text>
        <View style={styles.scheduledBadge}>
          <Text style={styles.scheduledText}>SCHEDULED</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Past Visitor Item ───────────────────────────────────────────
function PastVisitorItem({ visitor }: { visitor: Visitor }) {
  const purpose = PURPOSE_CONFIG[visitor.purpose] ?? DEFAULT_PURPOSE;
  const cfg = STATUS_CONFIG[visitor.status];
  const date = new Date(visitor.createdAt);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <View style={styles.pastItem}>
      <View style={styles.pastLeft}>
        {visitor.photoUrl ? (
          <Image source={{ uri: visitor.photoUrl }} style={styles.pastAvatar} />
        ) : (
          <View style={styles.pastAvatarPlaceholder}>
            <Ionicons name={purpose.iconName as any} size={16} color={Colors.textTertiary} />
          </View>
        )}
        <View>
          <Text style={styles.pastName}>{visitor.name}</Text>
          <Text style={styles.pastMeta}>{dateStr}, {timeStr}</Text>
        </View>
      </View>
      <View style={[styles.pastBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.pastBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function VisitorsScreen() {
  const { user } = useAuthStore();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const greeting = getGreeting();

  const fetchVisitors = useCallback(async (pageNum = 1, reset = false) => {
    try {
      const res = await api.get(`/visitors/history?page=${pageNum}&limit=20`);
      const { visitors: data, total: t } = res.data.data;
      setTotal(t);
      setVisitors((prev) => (reset ? data : [...prev, ...data]));
      setHasMore(pageNum * 20 < t);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchVisitors(1, true);
  }, [fetchVisitors]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    void fetchVisitors(1, true);
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/visitors/${id}/respond`, { action: 'APPROVE' });
      void fetchVisitors(1, true);
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/visitors/${id}/respond`, { action: 'DENY' });
      void fetchVisitors(1, true);
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  // Separate pending (action required) from others
  const pendingVisitors = visitors.filter((v) => v.status === 'PENDING');
  const pastVisitors = visitors.filter((v) => v.status !== 'PENDING');

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
          <Text style={styles.headerTitle}>Visitors</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Action Required ────────────────────────────── */}
      {pendingVisitors.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Action Required</Text>
          {pendingVisitors.map((visitor) => (
            <ActionRequiredCard
              key={visitor.id}
              visitor={visitor}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </>
      )}

      {/* ── Expected Today ─────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Expected Today</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All {'>'}</Text>
        </TouchableOpacity>
      </View>

      {pendingVisitors.length === 0 && pastVisitors.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Visitors Yet</Text>
          <Text style={styles.emptySubtitle}>
            When a visitor arrives at the gate,{'\n'}you'll see them here.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          {(pendingVisitors.length > 0 ? pendingVisitors : pastVisitors.slice(0, 3)).map((visitor, index, arr) => (
            <React.Fragment key={visitor.id}>
              <ExpectedTodayItem visitor={visitor} />
              {index < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* ── Invite Guest CTA ───────────────────────────── */}
      <TouchableOpacity style={styles.inviteBtn} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.inviteBtnText}>Invite Guest</Text>
      </TouchableOpacity>

      {/* ── Past Visitors ──────────────────────────────── */}
      {pastVisitors.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Visitors</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {pastVisitors.slice(0, 5).map((visitor, index, arr) => (
              <React.Fragment key={visitor.id}>
                <PastVisitorItem visitor={visitor} />
                {index < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}

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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.primary,
  },

  // ── Card base ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    ...Shadow.card,
  },

  // ── Action Required Card ──
  actionCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 20,
  },
  actionImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: Colors.surfaceContainerLow,
  },
  actionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  actionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 40,
    // gradient simulation via shadow
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  actionNameBlock: {},
  actionName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionPurposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionPurpose: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  actionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  actionStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  actionStatusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.dangerBg,
    backgroundColor: Colors.surface,
  },
  rejectBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.dangerText,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.successText,
  },
  approveBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Expected Today ──
  expectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  expectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  expectedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  expectedAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expectedName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  expectedPurpose: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  expectedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expectedTime: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scheduledBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduledText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  // ── Past Visitors ──
  pastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  pastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pastAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  pastAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pastName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  pastMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  pastBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pastBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  // ── Invite Guest CTA ──
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    ...Shadow.card,
  },
  inviteBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },

  // ── Empty State ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
