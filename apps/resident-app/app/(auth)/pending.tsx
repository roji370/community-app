import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { checkApprovalStatus } from '../../src/services/auth';

/**
 * Pending Approval Screen
 *
 * DESIGN DECISION (from execution plan §2.1):
 * This is a FIRST-CLASS SCREEN, not a loading spinner.
 * Users will sit in this state for hours/days in real usage.
 * It must feel intentional and reassuring, not like something is broken.
 */
export default function PendingScreen() {
  const { user, setUser, logout } = useAuthStore();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Gentle pulse animation on the icon
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

  // Slow rotation on the hourglass
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

  // Poll for approval status every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { status } = await checkApprovalStatus();
        if (status === 'ACTIVE') {
          // User has been approved!
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
          <Animated.Text
            style={[styles.icon, { transform: [{ rotate }] }]}
          >
            ⏳
          </Animated.Text>
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
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Your society's committee admin will review and approve your request.
            You'll receive a notification once approved.
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, styles.statusDotActive]} />
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
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#334155',
  },
  icon: {
    fontSize: 52,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
  },
  highlight: {
    color: '#A5B4FC',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#CBD5E1',
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
  },
  statusDotActive: {
    backgroundColor: '#22C55E',
  },
  statusLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    color: '#818CF8',
    fontWeight: '500',
  },
});
