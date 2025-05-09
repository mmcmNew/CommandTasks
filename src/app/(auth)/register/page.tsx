
'use client';

import RegisterForm from '@/components/auth/register-form';
import { fetchUserRolesAction } from '@/lib/actions/auth.actions';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserRoleObject } from '@/types';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRoleObject[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const result = await fetchUserRolesAction();
        if (result.success && result.roles) {
          // Filter out the 'администратор' role
          const filteredRoles = result.roles.filter(role => role.name !== 'администратор');
          setUserRoles(filteredRoles);
        } else {
          console.error("Failed to fetch user roles:", result.error);
          // Handle error, maybe show a toast
        }
      } catch (error) {
        console.error("Failed to fetch user roles:", error);
        // Handle error, maybe show a toast
      } finally {
        setRolesLoading(false);
      }
    }
    if (!currentUser) { // Only fetch roles if not redirecting
        fetchRoles();
    }
  }, [currentUser]);

  if (authLoading || rolesLoading || (!authLoading && currentUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="ml-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <RegisterForm userRoles={userRoles} />
    </div>
  );
}

