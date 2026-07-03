import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const greeting = getGreeting();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.userName}>{user?.name || 'Resident'} 👋</Text>
        </View>
        <View style={styles.unitBadge}>
          <Text style={styles.unitText}>{user?.unit?.identifier || '—'}</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <QuickAction icon="👤" label="Add Visitor" color="#6366F1" />
        <QuickAction icon="💳" label="Pay Bill" color="#10B981" />
        <QuickAction icon="📝" label="Complaint" color="#F59E0B" />
        <QuickAction icon="📢" label="Notices" color="#EC4899" />
      </View>

      {/* Dashboard cards — Sprint 5 will populate these */}
      <DashboardCard
        icon="🔔"
        title="Pending Approvals"
        subtitle="No pending visitor requests"
        accent="#6366F1"
      />

      <DashboardCard
        icon="💰"
        title="Maintenance Due"
        subtitle="Next bill will appear here"
        accent="#10B981"
      />

      <DashboardCard
        icon="🔧"
        title="Open Complaints"
        subtitle="No active complaints"
        accent="#F59E0B"
      />

      <DashboardCard
        icon="📋"
        title="Latest Notice"
        subtitle="No recent notices"
        accent="#EC4899"
      />
    </ScrollView>
  );
}

function QuickAction({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <TouchableOpacity style={styles.quickActionItem} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.quickActionEmoji}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function DashboardCard({
  icon,
  title,
  subtitle,
  accent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <View style={styles.dashCard}>
      <View style={[styles.dashCardAccent, { backgroundColor: accent }]} />
      <View style={styles.dashCardContent}>
        <Text style={styles.dashCardIcon}>{icon}</Text>
        <View style={styles.dashCardText}>
          <Text style={styles.dashCardTitle}>{title}</Text>
          <Text style={styles.dashCardSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 15,
    color: '#94A3B8',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  unitBadge: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#312E81',
  },
  unitText: {
    color: '#A5B4FC',
    fontSize: 15,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  dashCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dashCardAccent: {
    width: 4,
  },
  dashCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  dashCardIcon: {
    fontSize: 28,
  },
  dashCardText: {
    flex: 1,
  },
  dashCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  dashCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
});
