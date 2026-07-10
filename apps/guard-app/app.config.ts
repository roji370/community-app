import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Community Guard',
  slug: 'community-guard',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'community-guard',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    backgroundColor: '#0A0F1E',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.community.guard',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0A0F1E',
    },
    package: 'com.community.guard',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
});
