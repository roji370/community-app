import { View, Text, StyleSheet } from 'react-native';

export default function BillingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Billing</Text>
      <Text style={styles.subtitle}>Sprint 3 — Bill display, payment & receipts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center' },
});
