import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { requestOtp } from '../../src/services/auth';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Animate on mount
  useState(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  });

  const isValid = /^[6-9]\d{9}$/.test(phone);

  const handleRequestOtp = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const result = await requestOtp(phone);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone, message: result.message },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏠</Text>
          </View>
          <Text style={styles.appName}>Community</Text>
          <Text style={styles.tagline}>Your society, simplified</Text>
        </View>

        {/* Phone input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Enter your mobile number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          </View>
          {phone.length > 0 && !isValid && phone.length === 10 && (
            <Text style={styles.errorText}>Please enter a valid Indian mobile number</Text>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleRequestOtp}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending OTP...' : 'Get OTP'}
          </Text>
        </TouchableOpacity>

        {/* Privacy note */}
        <Text style={styles.privacyNote}>
          By continuing, you agree to our{' '}
          <Text style={styles.privacyLink}>Privacy Policy</Text>
          {'\n'}No ads. No data selling. Ever.
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoText: {
    fontSize: 36,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    color: '#CBD5E1',
    marginBottom: 12,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCode: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  countryCodeText: {
    color: '#E2E8F0',
    fontSize: 17,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: '#F8FAFC',
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: '#334155',
    fontWeight: '500',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  privacyNote: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  privacyLink: {
    color: '#818CF8',
    textDecorationLine: 'underline',
  },
});
