import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { checkApprovalStatus } from '../../src/services/auth';

const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  surfaceContainerLow: '#EFF4FF',
};

export default function PendingScreen() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { status } = await checkApprovalStatus();
        if (status === 'ACTIVE') {
          const { getProfile } = await import('../../src/services/auth');
          const profile = await getProfile();
          setUser(profile);
          router.replace('/(main)/home');
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const unitName = user?.unit?.identifier || 'your unit';
  const societyName = user?.unit?.society?.name || 'your society';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated icon */}
        <Animated.View style={[styles.iconContainer, { opacity: pulseAnim }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="time" size={48} color={Colors.primary} />
          </Animated.View>
        </Animated.View>

        <Text style={styles.title}>Approval Pending</Text>
        <Text style={styles.message}>
          Your request to join{'\n'}
          <Text style={styles.highlight}>{societyName}</Text>
          {' — '}
          <Text style={styles.highlight}>{unitName}</Text>
          {'\n'}has been submitted.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.infoText}>
            Your society's committee admin will review and approve your request.
            You'll receive a notification once approved.
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusLabel}>Checking for approval...</Text>
        </View>

        {/* Logout option */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Wrong society?{' '}
            <Text style={styles.footerLink} onPress={logout}>
              Start over
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  highlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
  infoIconCircle: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
