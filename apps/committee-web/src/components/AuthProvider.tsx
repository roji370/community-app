'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getStoredToken, getStoredUser } from '@/services/auth';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  societyId: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getStoredToken();
    const stored = getStoredUser();

    if (!token || !stored) {
      if (pathname !== '/login') {
        router.replace('/login');
      }
      setIsLoading(false);
      return;
    }

    // Verify role is OWNER
    if (stored.role !== 'OWNER') {
      localStorage.removeItem('committee_token');
      localStorage.removeItem('committee_user');
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    setUser(stored);
    setIsLoading(false);

    // If on login page with valid token, redirect to dashboard
    if (pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
