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
    // Redirect to dashboard for all users, including admins.
    // Specific admin dashboard redirection can be handled here if needed in future.
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await serverLogoutUser(); 
    } catch (error) {
      console.error("Server logout failed:", error);
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    // Redirect to general login page after logout.
    // If on an admin-specific page, this ensures they are out.
    router.push('/login');
  }, [router]);

  // Redirect logic
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
      const isProtectedRoute = pathname.startsWith('/dashboard'); // This covers all dashboard/* routes

      if (isAuthRoute && currentUser) {
        // If user is on any auth page (login, register, admin/login) and already logged in,
        // redirect them to the main dashboard.
        router.replace('/dashboard');
      } else if (isProtectedRoute && !currentUser) {
        // If user tries to access a protected dashboard route and is not logged in,
        // redirect them to the main login page.
        // Admin-specific protected routes could redirect to /admin/login here if desired.
        router.replace('/login');
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
