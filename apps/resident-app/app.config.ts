import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Community Resident',
  slug: 'community-resident',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'community-resident',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    backgroundColor: '#0F172A',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.community.resident',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0F172A',
    },
    package: 'com.community.resident',
  },
  plugins: ['expo-router', 'expo-secure-store'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  },
});
