import { useEffect, useState, useCallback } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { GateApprovalModal } from '../src/components/GateApprovalModal';
import { useWebSocket, PendingVisitor } from '../src/hooks/useWebSocket';
import { useFirebasePush } from '../src/hooks/useFirebasePush';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

function GateLayer() {
  const [pendingVisitor, setPendingVisitor] = useState<PendingVisitor | null>(null);
  const { isAuthenticated, user } = useAuthStore();

  const handleVisitorPending = (visitor: PendingVisitor) => {
    setPendingVisitor(visitor);
  };

  const handleVisitorExpired = () => {
    setPendingVisitor((current) => {
      if (current) return { ...current }; // keeps modal visible showing expired state
      return null;
    });
  };

  // WebSocket: real-time while app is open
  useWebSocket(
    isAuthenticated && user?.status === 'ACTIVE'
      ? { onVisitorPending: handleVisitorPending, onVisitorExpired: handleVisitorExpired }
      : {},
  );

  // Firebase push: when app is backgrounded
  useFirebasePush(
    isAuthenticated && user?.status === 'ACTIVE' ? handleVisitorPending : undefined,
  );

  return (
    <>
      <Slot />
      <GateApprovalModal
        visitor={pendingVisitor}
        onDismiss={() => setPendingVisitor(null)}
      />
    </>
  );
}

export default function RootLayout() {
  const { isLoading, restoreSession } = useAuthStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    restoreSession();
  }, []);

  // Hide splash screen once fonts are loaded and auth check is done
  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded && !isLoading) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  useEffect(() => {
    onLayoutReady();
  }, [onLayoutReady]);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FF' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <GateLayer />
    </>
  );
}
