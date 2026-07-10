import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

type ResultStatus = 'APPROVED' | 'DENIED' | 'EXPIRED';

const RESULT_CONFIG: Record<ResultStatus, {
  icon: string; title: string; subtitle: string;
  color: string; bg: string;
}> = {
  APPROVED: {
    icon: '✅',
    title: 'ENTRY APPROVED',
    subtitle: 'Resident has approved this visitor.',
    color: '#22C55E',
    bg: '#14532D',
  },
  DENIED: {
    icon: '🚫',
    title: 'ENTRY DENIED',
    subtitle: 'Resident has denied this visitor.',
    color: '#EF4444',
    bg: '#7F1D1D',
  },
  EXPIRED: {
    icon: '⌛',
    title: 'REQUEST EXPIRED',
    subtitle: 'No response received. Visitor is not permitted.',
    color: '#F59E0B',
    bg: '#451A03',
  },
};

export default function ResultScreen() {
  const router = useRouter();
  const { status, residentName } = useLocalSearchParams<{
    status: ResultStatus;
    residentName: string;
    visitorId: string;
  }>();

  const cfg = RESULT_CONFIG[status ?? 'EXPIRED'];
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0A0F1E' }]}>
      <View style={styles.inner}>
        <Animated.View style={[styles.resultCard, { transform: [{ scale: scaleAnim }] }]}>
          {/* Status ring */}
          <View style={[styles.iconRing, { borderColor: cfg.color, backgroundColor: cfg.bg + '60' }]}>
            <Text style={styles.resultIcon}>{cfg.icon}</Text>
          </View>

          <Text style={[styles.resultTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.resultSubtitle}>{cfg.subtitle}</Text>

          {residentName && status === 'APPROVED' && (
            <View style={styles.residentRow}>
              <Text style={styles.residentLabel}>Approved by</Text>
              <Text style={styles.residentName}>{residentName}</Text>
            </View>
          )}
        </Animated.View>

        {/* Log next visitor button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.replace('/(main)/entry')}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Log Next Visitor</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 32,
  },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  resultIcon: { fontSize: 48 },
  resultTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  resultSubtitle: {
    color: '#94A3B8', fontSize: 16, textAlign: 'center', lineHeight: 24,
  },
  residentRow: {
    alignItems: 'center', marginTop: 8, gap: 4,
  },
  residentLabel: { color: '#64748B', fontSize: 13 },
  residentName: { color: '#F1F5F9', fontSize: 18, fontWeight: '700' },
  nextBtn: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16, paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  nextBtnText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
});
