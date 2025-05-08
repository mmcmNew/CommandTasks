'use client';

import { getTaskDetails } from '@/lib/actions/task.actions';
import { getCommentsByTaskId, getUsers } from '@/lib/data';
import TaskStatusBadge from '@/components/tasks/task-status-badge';
import CommentSection from '@/components/comments/comment-section';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, DollarSign, User, Briefcase, Paperclip, Edit3, FileText, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';
import type { Comment as CommentType, User as UserType, Task as TaskType } from '@/types';

// Define a more specific type for the enriched task details
interface EnrichedTaskDetails extends TaskType {
  authorName: string;
  customerName: string;
  executorName: string;
}


export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [taskDetails, setTaskDetails] = useState<EnrichedTaskDetails | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth state to resolve

    if (!currentUser) {
      router.replace('/login'); // Should be handled by layout, but as a fallback
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const [taskData, commentsData, usersData] = await Promise.all([
          getTaskDetails(taskId),
          getCommentsByTaskId(taskId),
          getUsers()
        ]);

        if (!taskData) {
          notFound(); // Or handle as an error state
          return;
        }
        
        setTaskDetails(taskData as EnrichedTaskDetails); // Cast if confident about structure
        setComments(commentsData);
        setUsers(usersData);

      } catch (error) {
        console.error("Failed to fetch task details:", error);
        // Optionally set an error state to display to the user
        notFound(); // Or a more specific error display
      } finally {
        setLoading(false);
      }
    }

    if (taskId && currentUser) {
      fetchData();
    }
  }, [taskId, currentUser, authLoading, router]);


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading task details...</p>
      </div>
    );
  }

  if (!taskDetails) {
    // This case implies notFound() was called or data fetch failed significantly
    // Handled by notFound() redirect or can show a message here if preferred
    return <div className="text-center py-10">Task not found or could not be loaded.</div>;
  }
  
  if (!currentUser) {
    // Should be caught by layout or early useEffect, but as safety.
    return <div className="text-center py-10">Redirecting to login...</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <CardTitle className="text-3xl font-bold">{taskDetails.title}</CardTitle>
              <CardDescription>Created on {formatDate(taskDetails.createdAt)} by {taskDetails.authorName}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <TaskStatusBadge status={taskDetails.status} className="px-3 py-1 text-sm"/>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{taskDetails.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start">
              <CalendarDays className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Due Date</p>
                <p className="text-muted-foreground">{formatDate(taskDetails.dueDate)}</p>
              </div>
            </div>
            <div className="flex items-start">
              <DollarSign className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cost</p>
                <p className="text-muted-foreground">{taskDetails.cost ? `$${taskDetails.cost.toLocaleString()}` : 'N/A'}</p>
              </div>
            </div>
             <div className="flex items-start">
              <User className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Customer</p>
                <p className="text-muted-foreground">{taskDetails.customerName}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Briefcase className="mr-3 h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Executor</p>
                <p className="text-muted-foreground">{taskDetails.executorName}</p>
              </div>
            </div>
          </div>

          {taskDetails.attachments && taskDetails.attachments.length > 0 && (
            <div>
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Paperclip className="mr-2 h-5 w-5 text-primary" />
                Attachments
              </h3>
              <ul className="space-y-2">
                {taskDetails.attachments.map((att, index) => (
                  <li key={index} className="text-sm">
                    <a 
                      href={att.path} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline hover:text-accent transition-colors flex items-center"
                    >
                      {att.type === 'image' && <Image data-ai-hint="document" src={att.path} alt={att.name} width={20} height={20} className="mr-2 rounded-sm object-cover" />}
                      {att.type === 'pdf' && <FileText className="mr-2 h-4 w-4" />}
                      {att.type === 'other' && <Paperclip className="mr-2 h-4 w-4" />}
                      {att.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
            {/* Edit button could be re-enabled with appropriate logic */}
            {/* <Button variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Task
            </Button> */}
        </CardFooter>
      </Card>
      {/* CommentSection will use AuthContext for currentUserId */}
      <CommentSection taskId={taskDetails.id} comments={comments} users={users} />
    </div>
  );
}
