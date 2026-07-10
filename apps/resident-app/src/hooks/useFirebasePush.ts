import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import api from '../services/api';

export interface VisitorPushData {
  visitorId: string;
  visitorName: string;
  purpose: string;
  guardName: string;
  photoUrl?: string;
  unitId: string;
  expiresAt: string;
}

type PushCallback = (data: VisitorPushData) => void;

export function useFirebasePush(onVisitorPush?: PushCallback) {
  const callbackRef = useRef(onVisitorPush);
  useEffect(() => { callbackRef.current = onVisitorPush; }, [onVisitorPush]);

  useEffect(() => {
    let unsubscribeForeground: (() => void) | null = null;

    async function setup() {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('[FCM] Push notifications not authorized');
        return;
      }

      // Get and register token
      const token = await messaging().getToken();
      if (token) {
        await registerToken(token);
      }

      // Handle token refresh
      messaging().onTokenRefresh(async (newToken) => {
        await registerToken(newToken);
      });

      // Foreground messages — show in-app modal instead of system notification
      unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        const data = remoteMessage.data;
        if (data?.type === 'VISITOR_PENDING' && callbackRef.current) {
          callbackRef.current({
            visitorId: data.visitorId as string,
            visitorName: data.visitorName as string,
            purpose: data.purpose as string,
            guardName: data.guardName as string,
            photoUrl: data.photoUrl as string | undefined,
            unitId: data.unitId as string,
            expiresAt: data.expiresAt as string,
          });
        }
      });
    }

    void setup();

    return () => {
      unsubscribeForeground?.();
    };
  }, []);
}

async function registerToken(token: string) {
  try {
    await api.post('/users/fcm-token', {
      token,
      platform: Platform.OS,
    });
    console.log('[FCM] Token registered');
  } catch (err) {
    console.warn('[FCM] Failed to register token:', err);
  }
}

// Handle notification tap when app was in background/quit
export function setupBackgroundNotificationHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[FCM] Background message:', remoteMessage.data?.type);
  });
}
