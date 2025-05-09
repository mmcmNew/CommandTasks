
'use client';

import TaskForm from '@/components/tasks/task-form';
import { fetchNewTaskPageData } from '@/lib/actions/task.actions'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardEdit, Loader2, AlertTriangle } from 'lucide-react';
import type { UserRoleObject, User, TaskCategory, Task } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EditTaskPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleObject[]>([]);
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [potentialExecutors, setPotentialExecutors] = useState<User[]>([]);
  const [potentialCustomers, setPotentialCustomers] = useState<User[]>([]);


  useEffect(() => {
    async function loadData() {
      if (!currentUser || !taskId) {
        setDataLoading(false);
        return;
      }
      
      if (currentUser.roleName !== 'администратор') {
        setError("You are not authorized to edit this task.");
        setDataLoading(false);
        // Consider redirecting or showing a more prominent error display
        // router.replace('/dashboard'); 
        return;
      }

      try {
        setDataLoading(true);
        // fetchNewTaskPageData now accepts taskId to fetch the task for editing
        const result = await fetchNewTaskPageData(taskId); 

        if (result.success && result.users && result.userRoles && result.taskCategories) {
          if (!result.taskToEdit && taskId) { // if taskId was provided but task not found
            notFound();
            return;
          }
          setTaskToEdit(result.taskToEdit || null);
          
          const fetchedUsers = result.users;
          const fetchedUserRoles = result.userRoles;
          setUsers(fetchedUsers);
          setUserRoles(fetchedUserRoles);
          setTaskCategories(result.taskCategories);

          const executorRole = fetchedUserRoles.find(role => role.name === 'исполнитель');
          setPotentialExecutors(executorRole 
            ? fetchedUsers.filter(user => user.roleId === executorRole.id)
            : []);
          setPotentialCustomers(fetchedUsers);
          setError(null);

        } else {
          setError(result.error || "Failed to load data for task edit page.");
          console.error("Failed to load data for task edit page:", result.error);
        }

      } catch (err) {
        setError("An unexpected error occurred while loading task data.");
        console.error("Failed to load data for task edit page:", err);
      } finally {
        setDataLoading(false);
      }
    }
    if (!authLoading && currentUser) {
        loadData();
    } else if (!authLoading && !currentUser) {
        router.replace('/login');
    }
  }, [authLoading, currentUser, taskId, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading task form...</p>
      </div>
    );
  }
  
  if (!currentUser) { // Should be caught by authLoading but as a fallback
      return (
        <div className="max-w-3xl mx-auto flex items-center justify-center py-10">
          <p>Redirecting to login...</p>
        </div>
      );
  }

  if (currentUser.roleName !== 'администратор') {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to edit tasks. Only administrators can perform this action.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="max-w-3xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Task Data</AlertTitle>
          <AlertDescription>
            {error} Please try refreshing the page or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!taskToEdit) { // This case should ideally be handled by notFound() earlier
    return <div className="text-center py-10">Task not found or could not be loaded for editing.</div>;
  }


  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardEdit className="w-6 h-6 text-primary" /> Edit Task
          </CardTitle>
          <CardDescription>Modify the details of the task below. Changes will be immediately reflected.</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm 
            task={taskToEdit}
            users={users} 
            potentialCustomers={potentialCustomers}
            potentialExecutors={potentialExecutors}
            taskCategories={taskCategories}
            isEditMode={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
