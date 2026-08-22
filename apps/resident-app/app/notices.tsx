import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getNotices, acknowledgeNotice } from '../src/services/notices';
import type { Notice } from '../src/services/notices';

const Colors = {
  background: '#F8F9FF', surface: '#FFFFFF', primary: '#2563EB',
  primaryDark: '#004AC6', onPrimary: '#FFFFFF', textPrimary: '#0B1C30',
  textSecondary: '#434655', textTertiary: '#737686', cardBorder: '#F1F5F9',
  surfaceContainerLow: '#EFF4FF', warningBg: '#FEF3C7', warningText: '#B45309',
  successBg: '#DCFCE7', successText: '#166534',
};

export default function NoticesScreen() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNotices = useCallback(async (p = 1, reset = false) => {
    try {
      const data = await getNotices(p, 20);
      setNotices((prev) => (reset ? data.notices : [...prev, ...data.notices]));
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotices(1, true); }, [fetchNotices]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotices(1, true);
  };

  const handleAcknowledge = async (noticeId: string) => {
    try {
      await acknowledgeNotice(noticeId);
      // Refresh to show updated state
      fetchNotices(1, true);
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
      }
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Notices</Text>
      <Text style={styles.pageSubtitle}>{total} notice{total !== 1 ? 's' : ''} from your society</Text>

      {notices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="megaphone-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Notices Yet</Text>
          <Text style={styles.emptySubtitle}>Notices from your society committee will appear here.</Text>
        </View>
      ) : (
        notices.map((notice) => (
          <View key={notice.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="megaphone" size={18} color={Colors.warningText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeMeta}>
                  {formatDate(notice.createdAt)} • {notice.createdByUser.name}
                </Text>
              </View>
            </View>
            <Text style={styles.noticeBody}>{notice.body}</Text>
            {notice.requiresAcknowledgment && (
              <TouchableOpacity
                style={styles.ackBtn}
                onPress={() => handleAcknowledge(notice.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.successText} />
                <Text style={styles.ackBtnText}>Acknowledge</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingTop: 60, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14, fontFamily: 'Inter_400Regular', fontWeight: '400',
    color: Colors.textTertiary, marginBottom: 24,
  },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textTertiary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconCircle: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.warningBg,
    justifyContent: 'center', alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.textPrimary, marginBottom: 2,
  },
  noticeMeta: {
    fontSize: 12, fontFamily: 'Inter_400Regular', fontWeight: '400',
    color: Colors.textTertiary,
  },
  noticeBody: {
    fontSize: 15, fontFamily: 'Inter_400Regular', fontWeight: '400',
    color: Colors.textSecondary, lineHeight: 22,
  },
  ackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.successBg,
  },
  ackBtnText: {
    fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600',
    color: Colors.successText,
  },
});
