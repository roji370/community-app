import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SlaTimerProps {
  slaDueAt: string;
  status: string;
  resolvedAt?: string | null;
  compact?: boolean;
}

const Colors = {
  textTertiary: '#737686',
  successBg: '#DCFCE7',
  successText: '#166534',
  warningBg: '#FEF3C7',
  warningText: '#B45309',
  dangerBg: '#FEE2E2',
  dangerText: '#DC2626',
};

export function SlaTimer({ slaDueAt, status, resolvedAt, compact = false }: SlaTimerProps) {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isResolved = status === 'RESOLVED';
  const dueTime = new Date(slaDueAt).getTime();

  useEffect(() => {
    if (isResolved) return;
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isResolved]);

  const referenceTime = isResolved && resolvedAt ? new Date(resolvedAt).getTime() : now;
  const remainingMs = dueTime - referenceTime;
  const isBreached = remainingMs < 0;

  if (isResolved) {
    const resolvedWithinSla = resolvedAt ? new Date(resolvedAt).getTime() <= dueTime : true;
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={[styles.badge, resolvedWithinSla ? styles.badgeGreen : styles.badgeAmber]}>
          <Ionicons
            name={resolvedWithinSla ? 'checkmark-circle' : 'warning'}
            size={compact ? 12 : 14}
            color={resolvedWithinSla ? Colors.successText : Colors.warningText}
          />
          <Text style={[
            styles.badgeText,
            compact && styles.badgeTextCompact,
            { color: resolvedWithinSla ? Colors.successText : Colors.warningText },
          ]}>
            {resolvedWithinSla ? 'Within SLA' : 'After SLA'}
          </Text>
        </View>
      </View>
    );
  }

  const absMs = Math.abs(remainingMs);
  const totalHours = absMs / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeStr: string;
  if (days > 0) {
    timeStr = `${days}d ${hours}h`;
  } else if (hours > 0) {
    timeStr = `${hours}h ${minutes}m`;
  } else {
    timeStr = `${minutes}m`;
  }

  let colorStyle: object;
  let textColor: string;
  let iconName: string;
  if (isBreached) {
    colorStyle = styles.badgeRed;
    textColor = Colors.dangerText;
    iconName = 'alert-circle';
  } else if (remainingMs < 3600000) {
    colorStyle = styles.badgeRed;
    textColor = Colors.dangerText;
    iconName = 'alert-circle';
  } else if (remainingMs < 12 * 3600000) {
    colorStyle = styles.badgeAmber;
    textColor = Colors.warningText;
    iconName = 'time';
  } else {
    colorStyle = styles.badgeGreen;
    textColor = Colors.successText;
    iconName = 'checkmark-circle';
  }

  const label = isBreached ? `${timeStr} overdue` : `${timeStr} left`;

  if (compact) {
    return (
      <View style={[styles.badge, colorStyle, styles.badgeCompact]}>
        <Ionicons name={iconName as any} size={12} color={textColor} />
        <Text style={[styles.badgeText, styles.badgeTextCompact, { color: textColor }]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SLA {isBreached ? 'Breached' : 'Deadline'}</Text>
      <View style={[styles.badge, colorStyle]}>
        <Ionicons name={iconName as any} size={14} color={textColor} />
        <Text style={[styles.badgeText, { color: textColor }]}>
          {isBreached ? `${timeStr} overdue` : `${timeStr} remaining`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  containerCompact: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: Colors.successBg,
  },
  badgeAmber: {
    backgroundColor: Colors.warningBg,
  },
  badgeRed: {
    backgroundColor: Colors.dangerBg,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  badgeTextCompact: {
    fontSize: 11,
  },
});
