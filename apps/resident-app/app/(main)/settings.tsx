import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profilePhone}>+91 {user?.phone}</Text>
          <Text style={styles.profileUnit}>
            {user?.unit?.identifier} • {user?.unit?.society?.name}
          </Text>
        </View>
      </View>

      {/* Menu items */}
      <MenuItem icon="🔔" label="Notification Preferences" subtitle="Sprint 5" />
      <MenuItem icon="👥" label="Household Members" subtitle="Sprint 5" />
      <MenuItem icon="🔒" label="Privacy Policy" subtitle="No ads. No data selling." />
      <MenuItem icon="📱" label="App Version" subtitle="0.1.0 (Sprint 1)" />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ icon, label, subtitle }: { icon: string; label: string; subtitle: string }) {
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuContent}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#A5B4FC',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  profilePhone: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  profileUnit: {
    fontSize: 13,
    color: '#818CF8',
    marginTop: 2,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  menuChevron: {
    fontSize: 22,
    color: '#475569',
    fontWeight: '300',
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  logoutText: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '600',
  },
});
