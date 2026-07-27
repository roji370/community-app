import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SlaTimer } from './SlaTimer';
import type { Complaint } from '../services/complaints';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  surface: '#FFFFFF',
  primary: '#2563EB',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  dangerText: '#DC2626',
};

const CATEGORY_CONFIG: Record<string, { iconName: string; color: string; bg: string; label: string }> = {
  PLUMBING: { iconName: 'build', color: '#6366F1', bg: '#EEF2FF', label: 'Plumbing' },
  ELECTRICAL: { iconName: 'flash', color: '#F59E0B', bg: '#FEF3C7', label: 'Electrical' },
  SECURITY: { iconName: 'shield-checkmark', color: '#EF4444', bg: '#FEE2E2', label: 'Security' },
  COMMON_AREA: { iconName: 'business', color: '#8B5CF6', bg: '#EDE9FE', label: 'Common Area' },
  OTHER: { iconName: 'document-text', color: '#64748B', bg: '#F1F5F9', label: 'Other' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  OPEN: { label: 'Open', bg: '#DBEAFE', text: '#2563EB' },
  ACKNOWLEDGED: { label: 'Acknowledged', bg: '#FEF3C7', text: '#B45309' },
  IN_PROGRESS: { label: 'In Progress', bg: '#EDE9FE', text: '#7C3AED' },
  RESOLVED: { label: 'Resolved', bg: '#DCFCE7', text: '#166534' },
  REOPENED: { label: 'Reopened', bg: '#FEE2E2', text: '#DC2626' },
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#22C55E',
};

interface ComplaintCardProps {
  complaint: Complaint;
}

export function ComplaintCard({ complaint }: ComplaintCardProps) {
  const router = useRouter();
  const category = (CATEGORY_CONFIG[complaint.category] || CATEGORY_CONFIG.OTHER)!;
  const statusCfg = (STATUS_CONFIG[complaint.status] || STATUS_CONFIG.OPEN)!;
  const priorityColor = PRIORITY_COLORS[complaint.priority] || PRIORITY_COLORS.MEDIUM;

  const createdDate = new Date(complaint.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/complaint-detail/${complaint.id}` as any)}
    >
      {/* Top row: category icon + title + priority dot */}
      <View style={styles.topRow}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryIcon, { backgroundColor: category.bg }]}>
            <Ionicons name={category.iconName as any} size={16} color={category.color} />
          </View>
          <Text style={styles.categoryLabel}>{category.label}</Text>
        </View>
        <View style={styles.priorityRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {complaint.priority}
          </Text>
        </View>
      </View>

      {/* Description preview */}
      <Text style={styles.description} numberOfLines={2}>
        {complaint.description}
      </Text>

      {/* Bottom row: status badge + SLA timer + date */}
      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
          <SlaTimer
            slaDueAt={complaint.slaDueAt}
            status={complaint.status}
            resolvedAt={complaint.resolvedAt}
            compact
          />
        </View>
        <Text style={styles.date}>{createdDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
});
