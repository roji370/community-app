import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createComplaint } from '../src/services/complaints';

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
  surfaceContainerLow: '#EFF4FF',
  inputBg: '#F8F9FF',
  inputBorder: '#E2E8F0',
  inputFocusBorder: '#2563EB',
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

type Category = 'PLUMBING' | 'ELECTRICAL' | 'SECURITY' | 'COMMON_AREA' | 'OTHER';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

const CATEGORIES: { key: Category; iconName: string; color: string; bg: string; label: string }[] = [
  { key: 'PLUMBING', iconName: 'build', color: '#6366F1', bg: '#EEF2FF', label: 'Plumbing' },
  { key: 'ELECTRICAL', iconName: 'flash', color: '#F59E0B', bg: '#FEF3C7', label: 'Electrical' },
  { key: 'SECURITY', iconName: 'shield-checkmark', color: '#EF4444', bg: '#FEE2E2', label: 'Security' },
  { key: 'COMMON_AREA', iconName: 'business', color: '#8B5CF6', bg: '#EDE9FE', label: 'Common Area' },
  { key: 'OTHER', iconName: 'document-text', color: '#64748B', bg: '#F1F5F9', label: 'Other' },
];

const PRIORITIES: { key: Priority; label: string; sla: string; color: string; bg: string }[] = [
  { key: 'HIGH', label: 'High', sla: 'Resolved within 24 hours', color: '#EF4444', bg: '#FEE2E2' },
  { key: 'MEDIUM', label: 'Medium', sla: 'Resolved within 72 hours', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'LOW', label: 'Low', sla: 'Resolved within 7 days', color: '#22C55E', bg: '#DCFCE7' },
];

export default function NewComplaintScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = category !== null && description.trim().length >= 10;

  const handleSubmit = async () => {
    if (!isValid || !category) return;

    setIsSubmitting(true);
    try {
      const complaint = await createComplaint({
        category,
        description: description.trim(),
        priority,
      });
      router.replace(`/complaint-detail/${complaint.id}` as any);
    } catch {
      Alert.alert('Error', 'Failed to create complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Complaint</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.subtitle}>
          Describe your issue and we'll get it resolved within the SLA timeframe.
        </Text>

        {/* Category picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.categoryItem,
                  category === c.key && styles.categoryItemActive,
                ]}
                activeOpacity={0.7}
                onPress={() => setCategory(c.key)}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.iconName as any} size={20} color={c.color} />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === c.key && styles.categoryLabelActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={5}
              placeholder="Describe the issue in detail (minimum 10 characters)..."
              placeholderTextColor={Colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>
            {description.length}/500
            {description.length > 0 && description.length < 10 && (
              <Text style={styles.charCountWarn}> — min 10 characters</Text>
            )}
          </Text>
        </View>

        {/* Priority selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.priorityItem,
                priority === p.key && styles.priorityItemActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setPriority(p.key)}
            >
              <View style={styles.priorityLeft}>
                <View
                  style={[
                    styles.priorityRadio,
                    { borderColor: p.color },
                    priority === p.key && styles.priorityRadioActive,
                  ]}
                >
                  {priority === p.key && (
                    <View style={[styles.priorityRadioDot, { backgroundColor: p.color }]} />
                  )}
                </View>
                <View>
                  <View style={styles.priorityLabelRow}>
                    <View style={[styles.priorityColorDot, { backgroundColor: p.color }]} />
                    <Text style={styles.priorityLabel}>{p.label}</Text>
                  </View>
                  <Text style={styles.prioritySla}>{p.sla}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          activeOpacity={0.7}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 20,
    marginBottom: 28,
    textAlign: 'center',
  },

  // ── Section ──
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // ── Category Grid ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    gap: 8,
    width: '30%',
    flexGrow: 1,
    ...Shadow.card,
  },
  categoryItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Text Area ──
  textAreaContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    overflow: 'hidden',
  },
  textArea: {
    padding: 16,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textPrimary,
    minHeight: 130,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
  charCountWarn: {
    color: '#F59E0B',
  },

  // ── Priority ──
  priorityItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.card,
  },
  priorityItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '06',
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  priorityRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityRadioActive: {
    borderWidth: 2,
  },
  priorityRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  prioritySla: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // ── Submit ──
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
    ...Shadow.card,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
