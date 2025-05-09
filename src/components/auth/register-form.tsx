
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { RegisterFormData } from '@/lib/schema';
import { RegisterSchema } from '@/lib/schema';
import { registerUser } from '@/lib/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import type { UserRoleObject } from '@/types';

interface RegisterFormProps {
  userRoles: UserRoleObject[];
}

export default function RegisterForm({ userRoles: allUserRoles }: RegisterFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Filter out the 'администратор' role
  const availableRoles = useMemo(() => {
    return allUserRoles.filter(role => role.name !== 'администратор');
  }, [allUserRoles]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      // Default to first available non-admin role's ID
      roleId: availableRoles.length > 0 ? availableRoles[0].id : '',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    // Ensure the selected roleId is not for an administrator role,
    // although filtering in the Select dropdown should prevent this.
    const selectedRole = availableRoles.find(role => role.id === data.roleId);
    if (!selectedRole || selectedRole.name === 'администратор') {
      toast({
        title: 'Registration Failed',
        description: 'Invalid role selection.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await registerUser(data);
      if (result.success) {
        toast({
          title: 'Registration Successful',
          description: result.success,
        });
        router.push('/login');
      } else {
        toast({
          title: 'Registration Failed',
          description: result.error || 'An unknown error occurred.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Registration Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" /> Create your TaskFlow Account
        </CardTitle>
        <CardDescription>Fill in the details below to get started.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </SelectItem>
                      ))}
                      {availableRoles.length === 0 && (
                        <SelectItem value="" disabled>
                          No roles available for registration.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || availableRoles.length === 0}>
              {isLoading ? 'Registering...' : 'Register'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

