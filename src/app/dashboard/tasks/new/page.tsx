
'use client';

import TaskForm from '@/components/tasks/task-form';
import { fetchNewTaskPageData } from '@/lib/actions/task.actions'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardEdit, Loader2 } from 'lucide-react';
import type { UserRoleObject, UserRoleName, User, TaskCategory } from '@/types'; 
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTaskPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleObject[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]); 
  const [dataLoading, setDataLoading] = useState(true);
  const [potentialExecutors, setPotentialExecutors] = useState<User[]>([]);
  const [potentialCustomers, setPotentialCustomers] = useState<User[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return; 
      try {
        setDataLoading(true);
        
        const result = await fetchNewTaskPageData(); // Not passing taskId for new task

        if (result.success && result.users && result.userRoles && result.taskCategories) { 
          const fetchedUsers = result.users;
          const fetchedUserRoles = result.userRoles;
          const fetchedTaskCategories = result.taskCategories; 

          setUsers(fetchedUsers);
          setUserRoles(fetchedUserRoles);
          setTaskCategories(fetchedTaskCategories); 

          const executorRoleName: UserRoleName = 'исполнитель';
          const executorRole = fetchedUserRoles.find(role => role.name === executorRoleName);
          
          setPotentialExecutors(executorRole 
            ? fetchedUsers.filter(user => user.roleId === executorRole.id)
            : []);
          
          setPotentialCustomers(fetchedUsers);
        } else {
          console.error("Failed to load data for new task page:", result.error);
        }

      } catch (error) {
        console.error("Failed to load data for new task page:", error);
      } finally {
        setDataLoading(false);
      }
    }
    if (!authLoading && currentUser) {
        loadData();
    } else if (!authLoading && !currentUser) {
      router.replace('/login');
    }
  }, [authLoading, currentUser, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading task form...</p>
      </div>
    );
  }
  
  if (!currentUser) {
      return (
        <div className="max-w-3xl mx-auto flex items-center justify-center py-10">
          <p>Please log in to create a task.</p>
        </div>
      );
  }

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
            potentialCustomers={potentialCustomers}
            potentialExecutors={potentialExecutors}
            taskCategories={taskCategories} 
            isEditMode={false} // Explicitly set for clarity
          />
        </CardContent>
      </Card>
    </div>
  );
}
