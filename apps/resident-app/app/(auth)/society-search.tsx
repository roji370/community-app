import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchSocieties } from '../../src/services/auth';
import type { Society } from '@community/shared-types';

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

export default function SocietySearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Society[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const searchTimeoutRef = { current: null as NodeJS.Timeout | null };

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchSocieties(text);
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const handleSelectSociety = (society: Society) => {
    router.push({
      pathname: '/(auth)/unit-selection',
      params: {
        societyId: society.id,
        societyName: society.name,
        societyAddress: society.address,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Find your society</Text>
      <Text style={styles.subtitle}>Search by society name or pincode</Text>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="e.g. Sunrise Heights or 560034"
          placeholderTextColor={Colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="business-outline" size={28} color={Colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No societies found</Text>
                <Text style={styles.emptySubtitle}>
                  Try a different name or pincode.{'\n'}
                  Contact your society admin if your society isn't listed yet.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.societyCard}
              onPress={() => handleSelectSociety(item)}
              activeOpacity={0.7}
            >
              <View style={styles.societyIcon}>
                <Ionicons name="business" size={22} color={Colors.primary} />
              </View>
              <View style={styles.societyInfo}>
                <Text style={styles.societyName}>{item.name}</Text>
                <Text style={styles.societyAddress}>{item.address}</Text>
                <Text style={styles.societyMeta}>
                  {item.city} • {item.pincode} • {item.totalUnits} units
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        />
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
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  societyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadow.card,
  },
  societyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  societyInfo: {
    flex: 1,
  },
  societyName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  societyAddress: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  societyMeta: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
