import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Bill } from '../services/billing';

interface BillCardProps {
  bill: Bill;
  onPress: (bill: Bill) => void;
}

const Colors = {
  surface: '#FFFFFF',
  primary: '#2563EB',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  successBg: '#DCFCE7',
  successText: '#166534',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
};

const STATUS_CONFIG = {
  PAID: { label: 'Paid', bg: Colors.successBg, text: Colors.successText },
  PENDING: { label: 'Pending', bg: Colors.warningBg, text: Colors.warningText },
  OVERDUE: { label: 'Overdue', bg: Colors.dangerBg, text: Colors.dangerText },
} as const;

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getRelativeTime(dueDate: string, status: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (status === 'PAID') return 'Paid';
  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} days`;
}

function getMonthYear(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function BillCard({ bill, onPress }: BillCardProps) {
  const statusConfig = STATUS_CONFIG[bill.status];
  const relativeTime = getRelativeTime(bill.dueDate, bill.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(bill)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <View style={styles.monthBlock}>
          <Text style={styles.monthText}>{getMonthYear(bill.dueDate)}</Text>
          <Text style={styles.unitText}>{bill.unit?.identifier}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.amount}>{formatCurrency(bill.amountDue)}</Text>
        <View style={styles.dueRow}>
          {bill.status === 'OVERDUE' && (
            <Ionicons name="warning" size={13} color={Colors.dangerText} />
          )}
          {bill.status === 'PAID' && (
            <Ionicons name="checkmark-circle" size={13} color={Colors.successText} />
          )}
          <Text style={[
            styles.dueText,
            bill.status === 'OVERDUE' && styles.dueTextOverdue,
            bill.status === 'PAID' && styles.dueTextPaid,
          ]}>
            {relativeTime}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthBlock: {
    flex: 1,
  },
  monthText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  unitText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  dueTextOverdue: {
    color: Colors.dangerText,
  },
  dueTextPaid: {
    color: Colors.successText,
  },
});
