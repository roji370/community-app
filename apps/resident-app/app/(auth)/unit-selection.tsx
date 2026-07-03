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
import { getUnitsForSociety, onboardUser } from '../../src/services/auth';
import { useAuthStore } from '../../src/store/authStore';

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
    if (societyId) {
      loadUnits();
    }
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

  // Group units by block
  const groupedByBlock: Record<string, UnitItem[]> = {};
  units.forEach((unit) => {
    const block = unit.block || 'Units';
    if (!groupedByBlock[block]) groupedByBlock[block] = [];
    groupedByBlock[block]!.push(unit);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
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
          placeholderTextColor="#475569"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
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
                      <Text style={styles.occupiedDot}>
                        {unit.residentCount} 👤
                      </Text>
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
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#818CF8',
    paddingHorizontal: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  nameSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  nameLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 8,
    fontWeight: '500',
  },
  nameInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    minWidth: 80,
    alignItems: 'center',
  },
  unitChipSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#1E1B4B',
  },
  unitChipText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  unitChipTextSelected: {
    color: '#A5B4FC',
  },
  occupiedDot: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#334155',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
