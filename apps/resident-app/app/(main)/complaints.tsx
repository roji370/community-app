import { View, Text, StyleSheet } from 'react-native';

export default function ComplaintsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complaints</Text>
      <Text style={styles.subtitle}>Sprint 4 — Ticketing, SLA timers & status tracking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
