import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import guardApi from '../../src/services/api';
import { useGuardStore } from '../../src/store/guardStore';

export default function LoginScreen() {
  const [staffId, setStaffId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useGuardStore();

  const handleLogin = async () => {
    if (!staffId.trim() || !pin.trim()) {
      Alert.alert('Required', 'Enter your Staff ID and PIN.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await guardApi.post('/guard/auth/login', { staffId: staffId.trim(), pin });
      const { accessToken, guard } = res.data.data;
      await login(guard, accessToken);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {/* Logo / header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🛡</Text>
          </View>
          <Text style={styles.appName}>Guard Console</Text>
          <Text style={styles.subtitle}>Sunrise Heights Security</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>STAFF ID</Text>
          <TextInput
            style={styles.input}
            value={staffId}
            onChangeText={setStaffId}
            placeholder="e.g. GUARD001"
            placeholderTextColor="#475569"
            autoCapitalize="characters"
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>PIN</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="6-digit PIN"
            placeholderTextColor="#475569"
            secureTextEntry
            keyboardType="numeric"
            maxLength={8}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginBtnText}>LOG IN</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Community · Guard Console v0.1
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  header: { alignItems: 'center', marginBottom: 48 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1A2540',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2, borderColor: '#F59E0B40',
  },
  iconText: { fontSize: 36 },
  appName: {
    color: '#F8FAFC', fontSize: 28, fontWeight: '700', letterSpacing: -0.5,
  },
  subtitle: { color: '#64748B', fontSize: 15, marginTop: 4 },
  form: {},
  label: {
    color: '#64748B', fontSize: 12, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    borderWidth: 1, borderColor: '#334155',
  },
  loginBtn: {
    marginTop: 32,
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 1.5,
  },
  footer: { color: '#334155', textAlign: 'center', marginTop: 40, fontSize: 13 },
});
