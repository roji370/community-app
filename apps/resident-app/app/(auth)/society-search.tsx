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
import { searchSocieties } from '../../src/services/auth';
import type { Society } from '@community/shared-types';

export default function SocietySearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Society[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  // Debounced search
  const searchTimeoutRef = { current: null as NodeJS.Timeout | null };

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Find your society</Text>
      <Text style={styles.subtitle}>
        Search by society name or pincode
      </Text>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="e.g. Sunrise Heights or 560034"
          placeholderTextColor="#475569"
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
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searched ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏘️</Text>
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
                <Text style={styles.societyIconText}>🏢</Text>
              </View>
              <View style={styles.societyInfo}>
                <Text style={styles.societyName}>{item.name}</Text>
                <Text style={styles.societyAddress}>{item.address}</Text>
                <Text style={styles.societyMeta}>
                  {item.city} • {item.pincode} • {item.totalUnits} units
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
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
    color: '#94A3B8',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
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
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  societyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  societyIconText: {
    fontSize: 22,
  },
  societyInfo: {
    flex: 1,
  },
  societyName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  societyAddress: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  societyMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  chevron: {
    fontSize: 24,
    color: '#475569',
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
});
