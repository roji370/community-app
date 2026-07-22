import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUnitsForSociety, onboardUser } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';

const Colors = {
  background: '#F8F9FF',
  surface: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#004AC6',
  textPrimary: '#0B1C30',
  textTertiary: '#737686',
  cardBorder: '#F1F5F9',
  inputBorder: '#E2E8F0',
  surfaceContainerLow: '#EFF4FF',
};

const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 1,
  },
};

interface UnitItem {
  id: string;
  identifier: string;
  block: string | null;
  floor: number | null;
  residentCount: number;
}

export default function UnitSelectionScreen() {
  const { societyId, societyName } = useLocalSearchParams<{
    societyId: string;
    societyName: string;
  }>();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (societyId) loadUnits();
  }, [societyId]);

  const loadUnits = async () => {
    try {
      const data = await getUnitsForSociety(societyId!);
      setUnits(data);
    } catch {
      Alert.alert('Error', 'Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUnit || !name.trim() || !societyId) return;
    setSubmitting(true);
    try {
      const user = await onboardUser({
        name: name.trim(),
        societyId,
        unitId: selectedUnit,
      });
      setUser(user);
      router.replace('/(auth)/pending');
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || 'Failed to register. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const groupedByBlock: Record<string, UnitItem[]> = {};
  units.forEach((unit) => {
    const block = unit.block || 'Units';
    if (!groupedByBlock[block]) groupedByBlock[block] = [];
    groupedByBlock[block]!.push(unit);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Select your unit</Text>
      <Text style={styles.subtitle}>{societyName}</Text>

      {/* Name input */}
      <View style={styles.nameSection}>
        <Text style={styles.nameLabel}>Your name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedByBlock)}
          keyExtractor={([block]) => block}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: [block, blockUnits] }) => (
            <View style={styles.blockSection}>
              <Text style={styles.blockHeader}>Block {block}</Text>
              <View style={styles.unitGrid}>
                {blockUnits.map((unit) => (
                  <TouchableOpacity
                    key={unit.id}
                    style={[
                      styles.unitChip,
                      selectedUnit === unit.id && styles.unitChipSelected,
                    ]}
                    onPress={() => setSelectedUnit(unit.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        selectedUnit === unit.id && styles.unitChipTextSelected,
                      ]}
                    >
                      {unit.identifier}
                    </Text>
                    {unit.residentCount > 0 && (
                      <View style={styles.occupiedRow}>
                        <Ionicons name="person" size={10} color={Colors.textTertiary} />
                        <Text style={styles.occupiedText}>{unit.residentCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
      )}

      {/* Submit button — fixed at bottom */}
      {selectedUnit && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitButton, (!name.trim() || submitting) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim() || submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Requesting access...' : 'Request Access'}
            </Text>
            {!submitting && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.primary,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  nameSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  nameLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  blockSection: {
    marginBottom: 20,
  },
  blockHeader: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    minWidth: 80,
    alignItems: 'center',
    ...Shadow.card,
  },
  unitChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  unitChipText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  unitChipTextSelected: {
    color: Colors.primary,
  },
  occupiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  occupiedText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
  },
  submitDisabled: {
    backgroundColor: Colors.inputBorder,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});
