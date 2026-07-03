import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

export default function RootLayout() {
  const { isLoading, isAuthenticated, isOnboarding, user, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Restore session on app launch
  useEffect(() => {
    restoreSession();
  }, []);

  // Route guard — redirect based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inMainGroup = segments[0] === '(main)';

    if (!isAuthenticated && !isOnboarding && !inAuthGroup) {
      // Not logged in — go to phone entry
      router.replace('/(auth)/phone');
    } else if (isOnboarding && !inAuthGroup) {
      // In onboarding flow — stay in auth group
      router.replace('/(auth)/society-search');
    } else if (isAuthenticated && user?.status === 'PENDING_APPROVAL' && !inAuthGroup) {
      // Approved but pending — go to pending screen
      router.replace('/(auth)/pending');
    } else if (isAuthenticated && user?.status === 'ACTIVE' && inAuthGroup) {
      // Fully authenticated — go to home
      router.replace('/(main)/home');
    }
  }, [isLoading, isAuthenticated, isOnboarding, user?.status, segments]);

  // Show loading spinner while restoring session
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
