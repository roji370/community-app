import { Redirect } from 'expo-router';
import { useGuardStore } from '../src/store/guardStore';

export default function Index() {
  const { isAuthenticated, isLoading } = useGuardStore();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href="/(main)/entry" />;
  return <Redirect href="/(auth)/login" />;
}
