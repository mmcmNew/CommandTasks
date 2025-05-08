import { getTaskDetails } from '@/lib/actions/task.actions';
import { getCommentsByTaskId, getUsers } from '@/lib/data';
import TaskStatusBadge from '@/components/tasks/task-status-badge';
import CommentSection from '@/components/comments/comment-section';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, DollarSign, User, Briefcase, Paperclip, Edit3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getSession } from '@/lib/session';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Placeholder for TaskStatusUpdater component
// import TaskStatusUpdater from '@/components/tasks/task-status-updater';

interface TaskDetailPageProps {
  params: { taskId: string };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const taskDetails = await getTaskDetails(params.taskId);

  if (!taskDetails) {
    notFound();
  }
  
  const comments = await getCommentsByTaskId(params.taskId);
  const users = await getUsers();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

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
              {/* Placeholder for status updater. Implement if needed.
              <TaskStatusUpdater taskId={taskDetails.id} currentStatus={taskDetails.status} /> 
              */}
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
            {/* <Button variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Task
            </Button> */}
        </CardFooter>
      </Card>

      <CommentSection taskId={taskDetails.id} comments={comments} users={users} currentUserId={session.userId} />
    </div>
  );
}
