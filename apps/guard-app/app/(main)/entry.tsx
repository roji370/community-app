import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import guardApi from '../../src/services/api';
import { useGuardStore } from '../../src/store/guardStore';
import { useGuardSocket, VisitorResult } from '../../src/hooks/useGuardSocket';

const PURPOSES = [
  { key: 'GUEST', label: '👤 Guest' },
  { key: 'DELIVERY', label: '📦 Delivery' },
  { key: 'COURIER', label: '🚚 Courier' },
  { key: 'CAB', label: '🚕 Cab' },
  { key: 'DOMESTIC_HELP', label: '🧹 Help' },
  { key: 'MAINTENANCE', label: '🔧 Maint.' },
];

interface Unit {
  id: string;
  identifier: string;
  block: string | null;
  floor: number | null;
  residentCount: number;
}

export default function EntryScreen() {
  const router = useRouter();
  const { guard } = useGuardStore();
  const [name, setName] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('GUEST');
  const [unitSearch, setUnitSearch] = useState('');
  const [unitResults, setUnitResults] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentVisitorId, setCurrentVisitorId] = useState<string | null>(null);
  const [waitTimer, setWaitTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleVisitorResult = useCallback((result: VisitorResult) => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push({
      pathname: '/(main)/result',
      params: {
        status: result.status,
        residentName: result.residentName ?? '',
        visitorId: result.visitorId,
      },
    });
    // Reset form
    setIsSubmitting(false);
    setCurrentVisitorId(null);
    setWaitTimer(0);
    setName('');
    setSelectedUnit(null);
    setUnitSearch('');
  }, [router]);

  const { isConnected } = useGuardSocket({ onVisitorResult: handleVisitorResult });

  const searchUnits = async (q: string) => {
    setUnitSearch(q);
    setSelectedUnit(null);
    if (q.length < 1) { setUnitResults([]); return; }
    try {
      const res = await guardApi.get(
        `/users/societies/${guard?.society.id}/units`
      );
      const allUnits: Unit[] = res.data.data;
      setUnitResults(
        allUnits.filter((u) =>
          u.identifier.toLowerCase().includes(q.toLowerCase()),
        ).slice(0, 8),
      );
    } catch { setUnitResults([]); }
  };

  const notifyResident = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Enter visitor name.'); return; }
    if (!selectedUnit) { Alert.alert('Required', 'Select a unit.'); return; }
    if (!isConnected) {
      Alert.alert('No Connection', 'Not connected to server. Check your network.');
      return;
    }

    setIsSubmitting(true);
    setWaitTimer(0);
    timerRef.current = setInterval(() => setWaitTimer((t) => t + 1), 1000);

    try {
      const res = await guardApi.post('/visitors', {
        name: name.trim(),
        purpose: selectedPurpose,
        unitId: selectedUnit.id,
      });
      setCurrentVisitorId(res.data.data.id);
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsSubmitting(false);
      Alert.alert('Error', err?.response?.data?.error?.message ?? 'Failed to notify resident.');
    }
  };

  const formatWait = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `0:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Visitor Entry</Text>
            <Text style={styles.guardName}>{guard?.name} · {guard?.society.name}</Text>
          </View>
          <View style={[styles.connDot, { backgroundColor: isConnected ? '#22C55E' : '#EF4444' }]} />
        </View>

        {/* WAITING STATE */}
        {isSubmitting && (
          <View style={styles.waitingCard}>
            <ActivityIndicator color="#F59E0B" size="large" />
            <Text style={styles.waitingText}>Notifying resident...</Text>
            <Text style={styles.waitingTimer}>{formatWait(waitTimer)}</Text>
            <Text style={styles.waitingSubtext}>Waiting for response</Text>
          </View>
        )}

        {!isSubmitting && (
          <>
            {/* Visitor Name */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>VISITOR NAME</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor="#475569"
                returnKeyType="next"
              />
            </View>

            {/* Purpose */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PURPOSE</Text>
              <View style={styles.purposeGrid}>
                {PURPOSES.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.purposeChip,
                      selectedPurpose === p.key && styles.purposeChipSelected,
                    ]}
                    onPress={() => setSelectedPurpose(p.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.purposeChipText,
                      selectedPurpose === p.key && styles.purposeChipTextSelected,
                    ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Unit Search */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>UNIT / FLAT</Text>
              {selectedUnit ? (
                <TouchableOpacity
                  style={styles.selectedUnit}
                  onPress={() => { setSelectedUnit(null); setUnitSearch(''); }}
                >
                  <Text style={styles.selectedUnitText}>{selectedUnit.identifier}</Text>
                  <Text style={styles.selectedUnitChange}>Change ✕</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    style={styles.textInput}
                    value={unitSearch}
                    onChangeText={searchUnits}
                    placeholder="Type flat number (e.g. A-101)"
                    placeholderTextColor="#475569"
                    autoCapitalize="characters"
                  />
                  {unitResults.length > 0 && (
                    <View style={styles.unitDropdown}>
                      {unitResults.map((u) => (
                        <TouchableOpacity
                          key={u.id}
                          style={styles.unitRow}
                          onPress={() => {
                            setSelectedUnit(u);
                            setUnitResults([]);
                            setUnitSearch(u.identifier);
                          }}
                        >
                          <Text style={styles.unitRowIdentifier}>{u.identifier}</Text>
                          <Text style={styles.unitRowResidents}>
                            {u.residentCount} resident{u.residentCount !== 1 ? 's' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Notify Button */}
            <TouchableOpacity
              style={[
                styles.notifyBtn,
                (!name.trim() || !selectedUnit) && styles.notifyBtnDisabled,
              ]}
              onPress={notifyResident}
              disabled={!name.trim() || !selectedUnit}
              activeOpacity={0.85}
            >
              <Text style={styles.notifyBtnText}>🔔  NOTIFY RESIDENT</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {},
  headerTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: '700' },
  guardName: { color: '#64748B', fontSize: 13, marginTop: 2 },
  connDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },

  waitingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1, borderColor: '#F59E0B30',
    marginBottom: 20,
  },
  waitingText: { color: '#CBD5E1', fontSize: 17, fontWeight: '600' },
  waitingTimer: { color: '#F59E0B', fontSize: 40, fontWeight: '700', fontVariant: ['tabular-nums'] },
  waitingSubtext: { color: '#64748B', fontSize: 14 },

  section: { marginBottom: 24 },
  sectionLabel: {
    color: '#64748B', fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    borderWidth: 1, borderColor: '#334155',
  },
  purposeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  purposeChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    borderColor: '#334155', backgroundColor: '#1E293B',
  },
  purposeChipSelected: {
    backgroundColor: '#F59E0B20', borderColor: '#F59E0B',
  },
  purposeChipText: { color: '#94A3B8', fontSize: 14 },
  purposeChipTextSelected: { color: '#F59E0B', fontWeight: '600' },
  selectedUnit: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1E3A5F', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: '#3B82F6',
  },
  selectedUnitText: { color: '#60A5FA', fontSize: 18, fontWeight: '700' },
  selectedUnitChange: { color: '#64748B', fontSize: 13 },
  unitDropdown: {
    backgroundColor: '#1E293B', borderRadius: 12,
    borderWidth: 1, borderColor: '#334155',
    marginTop: 4, overflow: 'hidden',
  },
  unitRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  unitRowIdentifier: { color: '#F1F5F9', fontSize: 16, fontWeight: '600' },
  unitRowResidents: { color: '#64748B', fontSize: 13 },
  notifyBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16, paddingVertical: 20,
    alignItems: 'center', marginTop: 8,
  },
  notifyBtnDisabled: { opacity: 0.4 },
  notifyBtnText: {
    color: '#000', fontSize: 17, fontWeight: '800', letterSpacing: 0.5,
  },
});
