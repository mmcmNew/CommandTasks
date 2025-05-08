import TaskForm from '@/components/tasks/task-form';
import { getUsers, getUserRoles } from '@/lib/data';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardEdit } from 'lucide-react';
import type { UserRoleObject, UserRoleName } from '@/types';

export default async function NewTaskPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const users = await getUsers();
  const userRoles = await getUserRoles();
  
  const executorRoleName: UserRoleName = 'исполнитель';
  const executorRole = userRoles.find(role => role.name === executorRoleName);
  
  const potentialExecutors = executorRole 
    ? users.filter(user => user.roleId === executorRole.id)
    : []; // If "исполнитель" role not found, no executors

  // For customers, we can assume any user can be a customer for now,
  // or apply specific logic if needed, similar to executors.
  // const customerRoleName: UserRoleName = 'заказчик';
  // const customerRole = userRoles.find(role => role.name === customerRoleName);
  // const potentialCustomers = customerRole ? users.filter(user => user.roleId === customerRole.id) : users;
  const potentialCustomers = users; // Simpler: all users can be customers


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardEdit className="w-6 h-6 text-primary" /> Create New Task
          </CardTitle>
          <CardDescription>Fill out the form below to add a new task to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm 
            users={users} // Pass all users for selection lists
            potentialCustomers={potentialCustomers}
            potentialExecutors={potentialExecutors}
            currentUserId={session.userId} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
