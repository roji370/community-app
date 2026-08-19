import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import guardApi from '../../src/services/guardApi';

const Colors = {
  background: '#0F172A', surface: '#1E293B', surfaceHigh: '#334155',
  primary: '#3B82F6', primaryDark: '#2563EB', onPrimary: '#FFFFFF',
  textPrimary: '#F1F5F9', textSecondary: '#94A3B8', textTertiary: '#64748B',
  cardBorder: '#334155', successBg: '#065F4620', successText: '#34D399',
  warningBg: '#78350F20', warningText: '#FBBF24', dangerText: '#F87171',
};

const STAFF_TYPES = [
  { key: 'DOMESTIC_HELP', label: 'Maid', icon: '🏠' },
  { key: 'DRIVER', label: 'Driver', icon: '🚗' },
  { key: 'COOK', label: 'Cook', icon: '👨‍🍳' },
  { key: 'GARDENER', label: 'Gardener', icon: '🌿' },
  { key: 'PLUMBER', label: 'Plumber', icon: '🔧' },
  { key: 'ELECTRICIAN', label: 'Electrician', icon: '⚡' },
  { key: 'OTHER', label: 'Other', icon: '📋' },
];

interface AttendanceRecord {
  id: string;
  staffName: string;
  staffType: string;
  checkIn: string;
  checkOut: string | null;
  unit?: { identifier: string } | null;
  guard?: { name: string } | null;
}

export default function AttendanceScreen() {
  const [staffName, setStaffName] = useState('');
  const [staffType, setStaffType] = useState('DOMESTIC_HELP');
  const [unitId, setUnitId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const res = await guardApi.get('/staff-attendance/today');
      const data = res.data.data ?? res.data;
      setRecords(data.records || []);
      setActiveCount(data.activeCount || 0);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleCheckIn = async () => {
    if (!staffName.trim()) {
      Alert.alert('Required', 'Enter staff name');
      return;
    }
    setIsSubmitting(true);
    try {
      await guardApi.post('/staff-attendance/check-in', {
        staffName: staffName.trim(),
        staffType,
        unitId: unitId.trim() || undefined,
      });
      setStaffName('');
      setUnitId('');
      fetchToday();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to check in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async (recordId: string) => {
    try {
      await guardApi.patch(`/staff-attendance/${recordId}/check-out`);
      fetchToday();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to check out');
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStaffIcon = (type: string) => {
    return STAFF_TYPES.find((t) => t.key === type)?.icon || '📋';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchToday(); }} tintColor={Colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Attendance</Text>
        <View style={styles.activeCountBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeCountText}>{activeCount} Active</Text>
        </View>
      </View>

      {/* Check-In Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Check In</Text>

        <TextInput
          style={styles.input}
          value={staffName}
          onChangeText={setStaffName}
          placeholder="Staff name"
          placeholderTextColor={Colors.textTertiary}
        />

        <View style={styles.typeGrid}>
          {STAFF_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, staffType === t.key && styles.typeChipActive]}
              onPress={() => setStaffType(t.key)}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, staffType === t.key && styles.typeLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.checkInBtn, !staffName.trim() && styles.checkInBtnDisabled]}
          onPress={handleCheckIn}
          disabled={!staffName.trim() || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color={Colors.onPrimary} />
              <Text style={styles.checkInBtnText}>Check In</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Today's Log */}
      <Text style={styles.sectionTitle}>Today's Log</Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : records.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No staff checked in today</Text>
        </View>
      ) : (
        records.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <Text style={styles.recordIcon}>{getStaffIcon(record.staffType)}</Text>
              <View>
                <Text style={styles.recordName}>{record.staffName}</Text>
                <Text style={styles.recordMeta}>
                  In: {formatTime(record.checkIn)}
                  {record.checkOut ? ` → Out: ${formatTime(record.checkOut)}` : ''}
                  {record.unit ? ` • ${record.unit.identifier}` : ''}
                </Text>
              </View>
            </View>
            {!record.checkOut ? (
              <TouchableOpacity
                style={styles.checkOutBtn}
                onPress={() => handleCheckOut(record.id)}
              >
                <Ionicons name="log-out-outline" size={16} color={Colors.dangerText} />
                <Text style={styles.checkOutBtnText}>Out</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.doneBadge}>
                <Text style={styles.doneText}>Done</Text>
              </View>
            )}
          </View>
        ))
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingTop: 60, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26, fontFamily: 'Inter_700Bold', fontWeight: '700',
    color: Colors.textPrimary,
  },
  activeCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successBg, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.successText,
  },
  activeCountText: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.successText,
  },
  formCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 28,
  },
  formTitle: {
    fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.textPrimary, marginBottom: 14,
  },
  input: {
    backgroundColor: Colors.surfaceHigh, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 16, fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary, marginBottom: 14,
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  typeChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  typeIcon: { fontSize: 14 },
  typeLabel: {
    fontSize: 13, fontFamily: 'Inter_500Medium', fontWeight: '500',
    color: Colors.textSecondary,
  },
  typeLabelActive: { color: Colors.primary },
  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14,
  },
  checkInBtnDisabled: { opacity: 0.4 },
  checkInBtnText: {
    fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.onPrimary,
  },
  sectionTitle: {
    fontSize: 18, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.textPrimary, marginBottom: 14,
  },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, color: Colors.textTertiary, fontFamily: 'Inter_400Regular' },
  recordCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10,
  },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  recordIcon: { fontSize: 24 },
  recordName: {
    fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.textPrimary,
  },
  recordMeta: {
    fontSize: 12, fontFamily: 'Inter_400Regular', fontWeight: '400',
    color: Colors.textSecondary, marginTop: 2,
  },
  checkOutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.dangerText + '40',
  },
  checkOutBtnText: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.dangerText,
  },
  doneBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: Colors.successBg,
  },
  doneText: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.successText,
  },
});
