import RegisterForm from '@/components/auth/register-form';
import { getUserRoles } from '@/lib/data'; // Import getUserRoles
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export default async function RegisterPage() {
  const userRoles = await getUserRoles(); // Fetch roles

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <RegisterForm userRoles={userRoles} /> {/* Pass roles to the form */}
    </div>
  );
}
