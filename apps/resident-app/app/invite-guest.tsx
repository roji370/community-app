import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Share, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

const Colors = {
  background: '#F8F9FF', surface: '#FFFFFF', primary: '#2563EB',
  primaryDark: '#004AC6', onPrimary: '#FFFFFF', textPrimary: '#0B1C30',
  textSecondary: '#434655', textTertiary: '#737686', cardBorder: '#F1F5F9',
  successBg: '#DCFCE7', successText: '#166534', surfaceContainerLow: '#EFF4FF',
};

const PURPOSES = [
  { key: 'GUEST', label: 'Guest', icon: '👤' },
  { key: 'DELIVERY', label: 'Delivery', icon: '📦' },
  { key: 'CAB', label: 'Cab', icon: '🚗' },
  { key: 'COURIER', label: 'Courier', icon: '📬' },
  { key: 'DOMESTIC_HELP', label: 'Domestic Help', icon: '🏠' },
  { key: 'MAINTENANCE', label: 'Service', icon: '🔧' },
];

interface PassResult {
  code: string;
  shareableLink: string;
  name: string;
  purpose: string;
}

export default function InviteGuestScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('GUEST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PassResult | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Enter visitor name.'); return; }
    setIsSubmitting(true);
    try {
      const res = await api.post('/visitors/pre-approve', {
        name: name.trim(),
        purpose,
        phone: phone.trim() || undefined,
        entryType: 'ONE_TIME',
      });
      const data = res.data.data ?? res.data;
      setResult(data);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create pass.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `Hi! I've pre-approved your visit. Show this code at the gate: ${result.code}\n\nOr use this link: ${result.shareableLink}`,
        title: 'Visitor Pass',
      });
    } catch {}
  };

  if (result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.successText} />
          </View>
          <Text style={styles.successTitle}>Pass Created!</Text>
          <Text style={styles.successSubtitle}>
            Share this with {result.name} to skip gate wait
          </Text>

          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>PASS CODE</Text>
            <Text style={styles.codeText}>{result.code}</Text>
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={20} color={Colors.onPrimary} />
            <Text style={styles.shareBtnText}>Share Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Invite Guest</Text>
      <Text style={styles.pageSubtitle}>
        Pre-approve a visitor so they can skip the gate wait
      </Text>

      {/* Name */}
      <View style={styles.field}>
        <Text style={styles.label}>VISITOR NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {/* Phone */}
      <View style={styles.field}>
        <Text style={styles.label}>PHONE (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 9876543210"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="phone-pad"
        />
      </View>

      {/* Purpose */}
      <View style={styles.field}>
        <Text style={styles.label}>PURPOSE</Text>
        <View style={styles.purposeGrid}>
          {PURPOSES.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.purposeChip, purpose === p.key && styles.purposeChipActive]}
              onPress={() => setPurpose(p.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.purposeIcon}>{p.icon}</Text>
              <Text style={[
                styles.purposeText,
                purpose === p.key && styles.purposeTextActive,
              ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !name.trim() && styles.submitBtnDisabled]}
        onPress={handleCreate}
        disabled={!name.trim() || isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Colors.onPrimary} />
        ) : (
          <>
            <Ionicons name="qr-code-outline" size={20} color={Colors.onPrimary} />
            <Text style={styles.submitBtnText}>Generate Pass</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 15, fontFamily: 'Inter_400Regular', fontWeight: '400',
    color: Colors.textTertiary, marginBottom: 28, lineHeight: 22,
  },
  field: { marginBottom: 22 },
  label: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.textTertiary, letterSpacing: 1, marginBottom: 8, marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 18,
    paddingVertical: 16, fontSize: 16, fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  purposeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  purposeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.surface,
  },
  purposeChipActive: {
    backgroundColor: Colors.primary + '12', borderColor: Colors.primary,
  },
  purposeIcon: { fontSize: 16 },
  purposeText: {
    fontSize: 14, fontFamily: 'Inter_500Medium', fontWeight: '500',
    color: Colors.textSecondary,
  },
  purposeTextActive: { color: Colors.primary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.onPrimary,
  },
  // Success state
  successCard: {
    backgroundColor: Colors.surface, borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder, marginTop: 20,
  },
  successIconCircle: { marginBottom: 16 },
  successTitle: {
    fontSize: 24, fontFamily: 'Inter_700Bold', fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 15, fontFamily: 'Inter_400Regular', fontWeight: '400',
    color: Colors.textTertiary, textAlign: 'center', marginBottom: 24,
  },
  codeBox: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: 16,
    paddingHorizontal: 40, paddingVertical: 20, alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: Colors.primary + '30', borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.textTertiary, letterSpacing: 1.5, marginBottom: 6,
  },
  codeText: {
    fontSize: 36, fontFamily: 'Inter_700Bold', fontWeight: '700',
    color: Colors.primary, letterSpacing: 6,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 16, width: '100%', marginBottom: 12,
  },
  shareBtnText: {
    fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.onPrimary,
  },
  doneBtn: {
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16,
    width: '100%', alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16, fontFamily: 'Inter_500Medium', fontWeight: '500',
    color: Colors.textTertiary,
  },
});
