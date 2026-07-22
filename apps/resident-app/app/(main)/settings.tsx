import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

// ─── Design Tokens ───────────────────────────────────────────────
const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  onPrimary: '#FFFFFF',
  textPrimary: '#0B1C30',
  textSecondary: '#434655',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
  surfaceContainerLow: '#EFF4FF',
};

const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
};

// ─── Menu Item ───────────────────────────────────────────────────
function MenuItem({ iconName, label, subtitle, onPress }: {
  iconName: string;
  label: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuIconCircle}>
        <Ionicons name={iconName as any} size={20} color={Colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Profile Card ───────────────────────────────── */}
      <View style={[styles.card, styles.profileCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name || 'Resident'}</Text>
          <Text style={styles.profilePhone}>+91 {user?.phone}</Text>
          <View style={styles.profileUnitRow}>
            <Ionicons name="home-outline" size={13} color={Colors.primary} />
            <Text style={styles.profileUnit}>
              {user?.unit?.identifier} • {user?.unit?.society?.name}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Menu Items ─────────────────────────────────── */}
      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <View style={styles.card}>
        <MenuItem
          iconName="notifications-outline"
          label="Notification Preferences"
          subtitle="Manage alert channels"
        />
        <View style={styles.divider} />
        <MenuItem
          iconName="people-outline"
          label="Household Members"
          subtitle="Add or manage family"
        />
        <View style={styles.divider} />
        <MenuItem
          iconName="language-outline"
          label="Language"
          subtitle="English"
        />
      </View>

      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.card}>
        <MenuItem
          iconName="shield-checkmark-outline"
          label="Privacy Policy"
          subtitle="No ads. No data selling."
        />
        <View style={styles.divider} />
        <MenuItem
          iconName="document-text-outline"
          label="Terms of Service"
          subtitle="User agreement"
        />
        <View style={styles.divider} />
        <MenuItem
          iconName="information-circle-outline"
          label="App Version"
          subtitle="0.1.0 (Beta)"
        />
      </View>

      {/* ── Logout ─────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={Colors.dangerText} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Bottom spacer for floating tab bar */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    ...Shadow.card,
  },

  // ── Profile Card ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profilePhone: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  profileUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  profileUnit: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.primary,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Menu Item ──
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
  },

  // ── Logout ──
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: Colors.dangerBg,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: Colors.dangerText,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
