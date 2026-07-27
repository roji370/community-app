import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SlaTimer } from '../../src/components/SlaTimer';
import { getComplaintDetail, reopenComplaint } from '../../src/services/complaints';
import type { Complaint } from '../../src/services/complaints';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  textPrimary: '#0B1C30',
  textSecondary: '#434655',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  successBg: '#DCFCE7',
  successText: '#166534',
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

const PRIORITY_LABELS: Record<string, string> = {
  HIGH: 'High Priority',
  MEDIUM: 'Medium Priority',
  LOW: 'Low Priority',
};

const TIMELINE_STEPS = [
  { key: 'OPEN', label: 'Opened', iconName: 'radio-button-on' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged', iconName: 'checkmark-circle' },
  { key: 'IN_PROGRESS', label: 'In Progress', iconName: 'construct' },
  { key: 'RESOLVED', label: 'Resolved', iconName: 'checkmark-done-circle' },
];

const DEFAULT_CATEGORY = { iconName: 'document-text', color: '#64748B', bg: '#F1F5F9', label: 'Other' };
const DEFAULT_STATUS = { label: 'Open', bg: '#DBEAFE', text: '#2563EB' };

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReopening, setIsReopening] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setIsLoading(true);
      getComplaintDetail(id)
        .then(setComplaint)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, [id]),
  );

  const handleReopen = async () => {
    if (!complaint) return;
    Alert.alert(
      'Reopen Complaint',
      'Are you sure you want to reopen this complaint? The SLA timer will restart.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          style: 'destructive',
          onPress: async () => {
            setIsReopening(true);
            try {
              const updated = await reopenComplaint(complaint.id);
              setComplaint(updated);
            } catch {
              Alert.alert('Error', 'Failed to reopen complaint. Please try again.');
            } finally {
              setIsReopening(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.errorIconCircle}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.dangerText} />
        </View>
        <Text style={styles.errorText}>Complaint not found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = CATEGORY_CONFIG[complaint.category] ?? DEFAULT_CATEGORY;
  const statusCfg = STATUS_CONFIG[complaint.status] ?? DEFAULT_STATUS;
  const priorityColor = PRIORITY_COLORS[complaint.priority] || '#F59E0B';

  const statusOrder = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];
  const currentStatus = complaint.status === 'REOPENED' ? 'OPEN' : complaint.status;
  const activeStepIndex = statusOrder.indexOf(currentStatus);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category + Status Card */}
      <View style={[styles.card, styles.headerCard]}>
        <View style={styles.headerTop}>
          <View style={styles.categoryRow}>
            <View style={[styles.categoryIcon, { backgroundColor: category.bg }]}>
              <Ionicons name={category.iconName as any} size={20} color={category.color} />
            </View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.priorityRow}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {PRIORITY_LABELS[complaint.priority] || 'Medium Priority'}
          </Text>
        </View>

        {complaint.reopenCount > 0 && (
          <View style={styles.reopenBadge}>
            <Ionicons name="refresh" size={13} color={Colors.dangerText} />
            <Text style={styles.reopenText}>
              Reopened {complaint.reopenCount} time{complaint.reopenCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* SLA Timer */}
      <View style={[styles.card]}>
        <SlaTimer
          slaDueAt={complaint.slaDueAt}
          status={complaint.status}
          resolvedAt={complaint.resolvedAt}
        />
      </View>

      {/* Description */}
      <View style={[styles.card]}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{complaint.description}</Text>
      </View>

      {/* Photos */}
      {complaint.photoUrls && complaint.photoUrls.length > 0 && (
        <View style={[styles.card]}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {complaint.photoUrls.map((url, index) => (
              <View key={index} style={styles.photoPlaceholder}>
                <Ionicons name="image-outline" size={24} color={Colors.textTertiary} />
                <Text style={styles.photoText}>Photo {index + 1}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Status Timeline */}
      <View style={[styles.card]}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        <View style={styles.timeline}>
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index <= activeStepIndex;
            const isCurrent = index === activeStepIndex;

            let timestamp: string | null = null;
            if (step.key === 'OPEN') timestamp = complaint.createdAt;
            else if (step.key === 'ACKNOWLEDGED') timestamp = complaint.acknowledgedAt;
            else if (step.key === 'RESOLVED') timestamp = complaint.resolvedAt;

            return (
              <View key={step.key} style={styles.timelineStep}>
                {/* Connector line */}
                {index > 0 && (
                  <View
                    style={[
                      styles.timelineConnector,
                      isCompleted && styles.timelineConnectorActive,
                    ]}
                  />
                )}

                {/* Dot */}
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotActive,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {isCompleted && (
                    <Ionicons
                      name={isCurrent ? 'radio-button-on' : 'checkmark'}
                      size={12}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                {/* Label */}
                <View style={styles.timelineLabel}>
                  <Text
                    style={[
                      styles.timelineText,
                      isCompleted && styles.timelineTextActive,
                      isCurrent && styles.timelineTextCurrent,
                    ]}
                  >
                    {step.label}
                  </Text>
                  {timestamp && isCompleted && (
                    <Text style={styles.timelineDate}>
                      {new Date(timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Details */}
      <View style={[styles.card]}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailRow label="Created" value={
          new Date(complaint.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        } />
        <DetailRow label="Unit" value={complaint.unit?.identifier || '—'} />
        <DetailRow label="Raised by" value={complaint.createdByUser?.name || '—'} />
        <DetailRow label="Complaint ID" value={complaint.id} mono />
      </View>

      {/* Reopen */}
      {complaint.status === 'RESOLVED' && (
        <TouchableOpacity
          style={styles.reopenButton}
          activeOpacity={0.7}
          onPress={handleReopen}
          disabled={isReopening}
        >
          {isReopening ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.reopenButtonText}>Reopen Complaint</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, mono && styles.detailValueMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  backLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLow,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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

  // ── Header Card ──
  headerCard: {
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  reopenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reopenText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.dangerText,
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  photoPlaceholder: {
    width: 120,
    height: 90,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  photoText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },

  // ── Timeline ──
  timeline: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 9,
    top: -22,
    width: 2,
    height: 22,
    backgroundColor: Colors.cardBorder,
  },
  timelineConnectorActive: {
    backgroundColor: Colors.primary,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.cardBorder,
    marginRight: 14,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotActive: {
    backgroundColor: Colors.primary,
  },
  timelineDotCurrent: {
    borderWidth: 3,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary,
  },
  timelineLabel: {
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  timelineTextActive: {
    color: Colors.textPrimary,
  },
  timelineTextCurrent: {
    color: Colors.primary,
    fontWeight: '700',
  },
  timelineDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // ── Details ──
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailValueMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textTertiary,
  },

  // ── Reopen ──
  reopenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerText,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  reopenButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
