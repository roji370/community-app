import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import type { PendingVisitor } from '../hooks/useWebSocket';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  successText: '#166534',
  dangerText: '#DC2626',
  dangerBg: '#FEE2E2',
  surfaceContainerLow: '#EFF4FF',
};

interface GateApprovalModalProps {
  visitor: PendingVisitor | null;
  onDismiss: () => void;
}

const PURPOSE_LABELS: Record<string, { label: string; iconName: string }> = {
  GUEST: { label: 'Guest', iconName: 'person' },
  DELIVERY: { label: 'Delivery', iconName: 'cube' },
  CAB: { label: 'Cab', iconName: 'car' },
  COURIER: { label: 'Courier', iconName: 'mail' },
  DOMESTIC_HELP: { label: 'Domestic Help', iconName: 'home' },
  MAINTENANCE: { label: 'Maintenance', iconName: 'build' },
  OTHER: { label: 'Other', iconName: 'people' },
};

const DEFAULT_PURPOSE = { label: 'Visitor', iconName: 'person' };

export function GateApprovalModal({ visitor, onDismiss }: GateApprovalModalProps) {
  const slideAnim = useRef(new Animated.Value(800)).current;
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isExpired = visitor
    ? new Date(visitor.expiresAt) < new Date()
    : false;

  useEffect(() => {
    if (visitor) {
      setWaitSeconds(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();

      intervalRef.current = setInterval(() => {
        setWaitSeconds((s) => s + 1);
      }, 1000);
    } else {
      Animated.timing(slideAnim, {
        toValue: 800,
        duration: 300,
        useNativeDriver: true,
      }).start();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visitor]);

  const handleAction = async (action: 'APPROVED' | 'DENIED') => {
    if (!visitor || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/visitors/${visitor.visitorId}`, { action });
      onDismiss();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message ?? 'Failed to respond. Try again.');
      setIsSubmitting(false);
    }
  };

  const formatWait = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const purpose = PURPOSE_LABELS[visitor?.purpose ?? ''] ?? DEFAULT_PURPOSE;

  return (
    <Modal
      visible={!!visitor}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      {/* @ts-expect-error — BlurView type mismatch with React 19 */}
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />

      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.securityBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.securityBadgeText}>SECURITY ALERT</Text>
            </View>
            <Text style={styles.guardText}>
              via {visitor?.guardName ?? 'Security Guard'}
            </Text>
          </View>

          {/* Visitor photo */}
          <View style={styles.photoContainer}>
            {visitor?.photoUrl ? (
              <Image source={{ uri: visitor.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.textTertiary} />
              </View>
            )}
          </View>

          {/* Visitor info */}
          <Text style={styles.visitorName}>{visitor?.name}</Text>
          <View style={styles.purposeRow}>
            <Ionicons name={purpose.iconName as any} size={16} color={Colors.primary} />
            <Text style={styles.purposeLabel}>{purpose.label}</Text>
          </View>

          {/* Wait timer */}
          <View style={styles.timerRow}>
            <View style={styles.timerDot} />
            <Text style={styles.timerText}>
              {isExpired ? 'Request expired' : `Waiting ${formatWait(waitSeconds)}`}
            </Text>
          </View>

          {isExpired ? (
            <View style={styles.expiredContainer}>
              <Text style={styles.expiredText}>
                This visitor request has expired.
              </Text>
              <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              {/* APPROVE */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleAction('APPROVED')}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>ALLOW ENTRY</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* DENY */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.denyBtn]}
                onPress={() => handleAction('DENIED')}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle" size={20} color={Colors.dangerText} />
                <Text style={[styles.actionBtnText, styles.denyBtnText]}>DENY</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dangerText,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 8,
  },
  securityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 1,
  },
  guardText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.cardBorder,
  },
  visitorName: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  purposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  purposeLabel: {
    color: Colors.textTertiary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 6,
  },
  timerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  timerText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
  },
  actions: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  approveBtn: {
    backgroundColor: '#16A34A',
  },
  denyBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.dangerText,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 1,
  },
  denyBtnText: {
    color: Colors.dangerText,
  },
  expiredContainer: {
    alignItems: 'center',
    gap: 16,
  },
  expiredText: {
    color: Colors.textTertiary,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
  },
  dismissBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
  },
  dismissBtnText: {
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 15,
  },
});
