import TaskForm from '@/components/tasks/task-form';
import { getUsers } from '@/lib/data';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardEdit } from 'lucide-react';

export default async function NewTaskPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const users = await getUsers();
  // Filter for potential customers and executors. For simplicity, all users can be selected for now.
  const customers = users.filter(user => user.role === 'заказчик' || user.role === 'исполнитель'); // Or specific logic
  const executors = users.filter(user => user.role === 'исполнитель');

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
            users={users} 
            currentUserId={session.userId} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
