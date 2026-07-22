import { useState, useRef, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyOtp, requestOtp } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';

const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  inputBorder: '#E2E8F0',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  surfaceContainerLow: '#EFF4FF',
};

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5) {
      const code = newOtp.join('');
      if (code.length === 6) handleVerify(code);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6 || !phone) return;
    setLoading(true);
    try {
      const result = await verifyOtp(phone, otpCode);
      await setAuth(result);
      if (result.isNewUser) {
        router.replace('/(auth)/society-search');
      } else if (result.user?.status === 'PENDING_APPROVAL') {
        router.replace('/(auth)/pending');
      } else {
        router.replace('/(main)/home');
      }
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Invalid OTP. Please try again.';
      Alert.alert('Verification Failed', message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !phone) return;
    try {
      await requestOtp(phone);
      setResendTimer(30);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone.');
    } catch {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneHighlight}>+91 {phone}</Text>
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Dev hint */}
        <View style={styles.devHint}>
          <Ionicons name="flask" size={14} color={Colors.warningText} />
          <Text style={styles.devHintText}>Dev mode: use 123456</Text>
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.button, otp.join('').length < 6 && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={otp.join('').length < 6 || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendTimer > 0}
          style={styles.resendButton}
        >
          <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0
              ? `Resend OTP in ${resendTimer}s`
              : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
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
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    lineHeight: 24,
    marginBottom: 40,
  },
  phoneHighlight: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  devHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  devHintText: {
    color: Colors.warningText,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
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
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  resendDisabled: {
    color: Colors.textTertiary,
  },
});
