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
import { Ionicons } from '@expo/vector-icons';
import { requestOtp } from '../../src/services/auth';

const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  inputBorder: '#E2E8F0',
  dangerText: '#DC2626',
  surfaceContainerLow: '#EFF4FF',
};

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
            <Ionicons name="home" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Haven</Text>
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
              placeholderTextColor={Colors.textTertiary}
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
          {!loading && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
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
    backgroundColor: Colors.background,
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
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCode: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  countryCodeText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.dangerText,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: Colors.inputBorder,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  privacyNote: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    lineHeight: 20,
  },
  privacyLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
