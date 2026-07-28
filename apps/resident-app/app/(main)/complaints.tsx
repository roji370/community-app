import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ComplaintCard } from '../../src/components/ComplaintCard';
import { getComplaints, getComplaintsSummary } from '../../src/services/complaints';
import type { Complaint, ComplaintsSummary } from '../../src/services/complaints';

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
  tealBg: '#F0FDFA',
  tealText: '#0F766E',
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

// ─── Notice Card ─────────────────────────────────────────────────
function NoticeCard({ title, description, timeAgo }: {
  title: string;
  description: string;
  timeAgo: string;
}) {
  return (
    <View style={[styles.card, styles.noticeCard]}>
      <View style={styles.noticeHeader}>
        <View style={styles.noticeIconCircle}>
          <Ionicons name="water" size={20} color={Colors.tealText} />
        </View>
        <View style={styles.noticeHeaderRight}>
          <Text style={styles.noticeCategoryLabel}>MAINTENANCE NOTICE</Text>
          <Text style={styles.noticeTimeAgo}>{timeAgo}</Text>
        </View>
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeDescription} numberOfLines={4}>{description}</Text>
    </View>
  );
}

// ─── Event Card ──────────────────────────────────────────────────
function EventCard({ title, datetime, location, category }: {
  title: string;
  datetime: string;
  location: string;
  category: string;
}) {
  return (
    <View style={[styles.card, styles.eventCard]}>
      {/* Image placeholder with gradient overlay */}
      <View style={styles.eventImageContainer}>
        <View style={styles.eventImagePlaceholder}>
          <Ionicons name="image" size={40} color={Colors.surfaceContainerHigh} />
        </View>
        <View style={styles.eventOverlay}>
          <View style={styles.eventCategoryBadge}>
            <Text style={styles.eventCategoryText}>{category}</Text>
          </View>
          <View style={styles.eventInfoOverlay}>
            <View style={styles.eventDateRow}>
              <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.eventDateText}>{datetime}</Text>
            </View>
            <Text style={styles.eventTitle}>{title}</Text>
            <Text style={styles.eventLocation} numberOfLines={2}>
              Join instructor Sarah for a rejuvenating morning flow at the {location}. All...
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.eventActions}>
        <TouchableOpacity style={styles.rsvpBtn} activeOpacity={0.8}>
          <Text style={styles.rsvpBtnText}>RSVP Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Community Vote Card ─────────────────────────────────────────
function VoteCard() {
  const [selected, setSelected] = useState<number | null>(null);
  const options = ['Artisan Tacos', 'Wood-fired Pizza', 'Vegan/Healthy Bowls'];

  return (
    <View style={[styles.card]}>
      <View style={styles.voteHeader}>
        <View style={styles.voteIconCircle}>
          <Ionicons name="thumbs-up" size={18} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.voteHeaderTitle}>Community Vote</Text>
          <Text style={styles.voteHeaderMeta}>Closes in 3 days</Text>
        </View>
      </View>
      <Text style={styles.voteQuestion}>
        What type of food trucks would you like to see at next month's gathering?
      </Text>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.voteOption, selected === index && styles.voteOptionSelected]}
          activeOpacity={0.7}
          onPress={() => setSelected(index)}
        >
          <Text style={[styles.voteOptionText, selected === index && styles.voteOptionTextSelected]}>
            {option}
          </Text>
          <View style={[styles.voteRadio, selected === index && styles.voteRadioSelected]}>
            {selected === index && <View style={styles.voteRadioDot} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Complaint Feed Item (Light theme) ───────────────────────────
function ComplaintFeedItem({ complaint }: { complaint: Complaint }) {
  const router = useRouter();

  const CATEGORY_ICONS: Record<string, { name: string; color: string; bg: string }> = {
    PLUMBING: { name: 'build', color: '#6366F1', bg: '#EEF2FF' },
    ELECTRICAL: { name: 'flash', color: '#F59E0B', bg: '#FEF3C7' },
    SECURITY: { name: 'shield-checkmark', color: '#EF4444', bg: '#FEE2E2' },
    COMMON_AREA: { name: 'business', color: '#8B5CF6', bg: '#EDE9FE' },
    OTHER: { name: 'document-text', color: '#64748B', bg: '#F1F5F9' },
  };

  const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    OPEN: { label: 'Open', color: '#2563EB', bg: '#DBEAFE' },
    ACKNOWLEDGED: { label: 'Acknowledged', color: '#B45309', bg: '#FEF3C7' },
    IN_PROGRESS: { label: 'In Progress', color: '#7C3AED', bg: '#EDE9FE' },
    RESOLVED: { label: 'Resolved', color: '#166534', bg: '#DCFCE7' },
    REOPENED: { label: 'Reopened', color: '#DC2626', bg: '#FEE2E2' },
  };

  const catCfg = (CATEGORY_ICONS[complaint.category] || CATEGORY_ICONS.OTHER)!;
  const statusCfg = (STATUS_LABELS[complaint.status] || STATUS_LABELS.OPEN)!;

  const createdDate = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity
      style={[styles.card, { marginBottom: 12 }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/complaint-detail/${complaint.id}` as any)}
    >
      <View style={styles.complaintTop}>
        <View style={styles.complaintCatRow}>
          <View style={[styles.complaintCatIcon, { backgroundColor: catCfg.bg }]}>
            <Ionicons name={catCfg.name as any} size={16} color={catCfg.color} />
          </View>
          <Text style={styles.complaintCatLabel}>
            {complaint.category.replace('_', ' ')}
          </Text>
        </View>
        <View style={[styles.complaintStatusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.complaintStatusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>
      <Text style={styles.complaintDesc} numberOfLines={2}>{complaint.description}</Text>
      <View style={styles.complaintBottom}>
        <Text style={styles.complaintDate}>{createdDate}</Text>
        {complaint.sla?.isBreached && (
          <View style={styles.slaBreach}>
            <Ionicons name="warning" size={12} color={Colors.dangerText} />
            <Text style={styles.slaBreachText}>SLA Breached</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Filter Pill ─────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: undefined, label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
] as const;

// ─── Main Screen ─────────────────────────────────────────────────
export default function ComplaintsScreen() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<ComplaintsSummary | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchComplaints = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const [complaintsRes, summaryRes] = await Promise.all([
          getComplaints({ page: pageNum, limit: 20, status: activeFilter }),
          pageNum === 1 ? getComplaintsSummary() : Promise.resolve(null),
        ]);

        if (append) {
          setComplaints((prev) => [...prev, ...complaintsRes.complaints]);
        } else {
          setComplaints(complaintsRes.complaints);
        }
        setTotal(complaintsRes.total);
        setPage(pageNum);
        if (summaryRes) setSummary(summaryRes);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [activeFilter],
  );

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchComplaints(1);
    }, [fetchComplaints]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchComplaints(1);
  };

  const handleLoadMore = () => {
    if (isLoadingMore || complaints.length >= total) return;
    setIsLoadingMore(true);
    fetchComplaints(page + 1, true);
  };

  const handleFilterChange = (filter: string | undefined) => {
    setActiveFilter(filter);
    setIsLoading(true);
  };

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
          <Text style={styles.headerBrand}>Haven</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Community Feed Title ───────────────────────── */}
      <Text style={styles.pageTitle}>Community Feed</Text>
      <Text style={styles.pageSubtitle}>Stay updated with your neighborhood.</Text>

      {/* ── Static Community Content ───────────────────── */}
      <NoticeCard
        title="Scheduled Water Maintenance"
        description="Please be advised that water services will be temporarily interrupted tomorrow from 10:00 AM to 2:00 PM for necessary system upgrades in Building B."
        timeAgo="2 hrs ago"
      />

      <EventCard
        title="Morning Vinyasa Flow"
        datetime="Sat, Oct 28 • 9:00 AM"
        location="Clubhouse"
        category="Wellness"
      />

      <VoteCard />

      {/* ── Complaints Section ─────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Complaints</Text>
        <TouchableOpacity
          style={styles.newComplaintBtn}
          activeOpacity={0.7}
          onPress={() => router.push('/new-complaint' as any)}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newComplaintBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterPill, activeFilter === f.key && styles.filterPillActive]}
            activeOpacity={0.7}
            onPress={() => handleFilterChange(f.key)}
          >
            <Text
              style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Stats */}
      {summary && (
        <View style={[styles.card, styles.summaryCard]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{summary.openCount}</Text>
            <Text style={styles.summaryLabel}>Open</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, summary.breachedCount > 0 && styles.summaryDanger]}>
              {summary.breachedCount}
            </Text>
            <Text style={styles.summaryLabel}>Breached</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, styles.summarySuccess]}>
              {summary.resolvedThisMonth}
            </Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
        </View>
      )}

      {/* Complaints List */}
      {isLoading ? (
        <View style={styles.loadingInline}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : complaints.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="document-text-outline" size={28} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No complaints found</Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter ? 'Try a different filter' : 'Tap "+ New" to raise a complaint'}
          </Text>
        </View>
      ) : (
        complaints.map((complaint) => (
          <ComplaintFeedItem key={complaint.id} complaint={complaint} />
        ))
      )}

      {isLoadingMore && (
        <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 16 }} />
      )}

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
  headerBrand: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Page Title ──
  pageTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginBottom: 24,
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

  // ── Notice Card ──
  noticeCard: {},
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  noticeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.tealBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeCategoryLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.tealText,
    letterSpacing: 0.8,
  },
  noticeTimeAgo: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  noticeTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  noticeDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 22,
  },

  // ── Event Card ──
  eventCard: {
    padding: 0,
    overflow: 'hidden',
  },
  eventImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
    padding: 16,
  },
  eventCategoryBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventCategoryText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventInfoOverlay: {
    gap: 4,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eventDateText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventLocation: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  eventActions: {
    padding: 16,
  },
  rsvpBtn: {
    backgroundColor: Colors.successText,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  rsvpBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Vote Card ──
  voteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  voteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteHeaderTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  voteHeaderMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  voteQuestion: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
  },
  voteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    marginBottom: 8,
  },
  voteOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  voteOptionText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  voteOptionTextSelected: {
    fontWeight: '500',
    color: Colors.primary,
  },
  voteRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteRadioSelected: {
    borderColor: Colors.primary,
  },
  voteRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  newComplaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newComplaintBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── Filters ──
  filterScroll: {
    marginBottom: 14,
  },
  filterRow: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // ── Summary Stats ──
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.cardBorder,
  },
  summaryNumber: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  summaryDanger: {
    color: Colors.dangerText,
  },
  summarySuccess: {
    color: Colors.successText,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Complaint Feed Item ──
  complaintTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  complaintCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complaintCatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  complaintCatLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  complaintStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  complaintStatusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  complaintDesc: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 20,
    marginBottom: 10,
  },
  complaintBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  complaintDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  slaBreach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slaBreachText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.dangerText,
  },

  // ── Empty / Loading ──
  loadingInline: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
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
  },
});
