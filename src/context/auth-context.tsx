'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { CurrentUser } from '@/types';
import { logoutUser as serverLogoutUser } from '@/lib/actions/auth.actions'; // Server action for any server-side cleanup

interface AuthContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  login: (userData: CurrentUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'currentUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((userData: CurrentUser) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    setCurrentUser(userData);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await serverLogoutUser(); // Call server action for any backend cleanup
    } catch (error) {
      console.error("Server logout failed:", error);
      // Continue with client-side logout regardless
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    router.push('/login');
  }, [router]);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname === '/login' || pathname === '/register';
      const isProtectedRoute = pathname.startsWith('/dashboard');

      if (isAuthRoute && currentUser) {
        router.push('/dashboard');
      } else if (isProtectedRoute && !currentUser) {
        router.push('/login');
      }
    }
  }, [currentUser, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}