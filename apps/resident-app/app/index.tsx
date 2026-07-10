import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isLoading, isAuthenticated, isOnboarding, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!isAuthenticated && !isOnboarding) {
    return <Redirect href="/(auth)/phone" />;
  }

  if (isOnboarding) {
    return <Redirect href="/(auth)/society-search" />;
  }

  if (isAuthenticated && user?.status === 'PENDING_APPROVAL') {
    return <Redirect href="/(auth)/pending" />;
  }

  if (isAuthenticated && user?.status === 'ACTIVE') {
    return <Redirect href="/(main)/home" />;
  }

  // Fallback
  return <Redirect href="/(auth)/phone" />;
}
