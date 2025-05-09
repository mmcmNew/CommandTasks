'use client';

import LoginForm from '@/components/auth/login-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // If admin is already logged in, redirect to dashboard
      // Or to a specific admin dashboard if it exists in the future
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || (!isLoading && currentUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading Admin Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <LoginForm 
        title="Administrator Login"
        description="Enter your administrator credentials to access the TaskFlow Admin Panel."
        showRegisterLink={false} // Admins are pre-defined, no public registration
      />
    </div>
  );
}
