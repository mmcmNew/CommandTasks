
'use client';

import { fetchTaskPageData, changeTaskStatusAndLog } from '@/lib/actions/task.actions';
import TaskStatusBadge from '@/components/tasks/task-status-badge';
import CommentSection from '@/components/comments/comment-section';
import TaskProposalForm from '@/components/proposals/task-proposal-form';
import TaskProposalList from '@/components/proposals/task-proposal-list';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, DollarSign, User, Briefcase, Paperclip, FileText, Loader2, SendToBack, Reply, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState, useTransition } from 'react';
import type { Comment as CommentType, User as UserType, Task as TaskType, TaskStatus, EnrichedTaskProposal, UserRoleObject, UserRoleName } from '@/types';
import { useToast } from '@/hooks/use-toast';


interface EnrichedTaskDetails extends TaskType {
  authorName: string;
  customerName: string;
  executorName: string;
}


export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const { toast } = useToast();
  
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [taskDetails, setTaskDetails] = useState<EnrichedTaskDetails | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]); // List of all users for comment author names
  const [taskProposals, setTaskProposals] = useState<EnrichedTaskProposal[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleObject[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRoleName | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusChanging, startStatusChangeTransition] = useTransition();

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const result = await fetchTaskPageData(taskId, currentUser.id); 

      if (result.success && result.taskDetails && result.comments && result.users && result.taskProposals && result.userRoles) {
        if (!result.taskDetails) { 
          notFound(); 
          return;
        }
        setTaskDetails(result.taskDetails as EnrichedTaskDetails); 
        setComments(result.comments);
        setUsers(result.users);
        setTaskProposals(result.taskProposals);
        setUserRoles(result.userRoles);
        setCurrentUserRole(result.currentUserRoleName || null);

      } else {
        console.error("Failed to fetch task page data:", result.error);
        toast({ title: "Error", description: result.error || "Could not load task data.", variant: "destructive" });
        notFound(); 
        return;
      }
    } catch (error) {
      console.error("Failed to fetch task details:", error);
      toast({ title: "Error", description: "An unexpected error occurred while loading task data.", variant: "destructive" });
      notFound(); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return; 

    if (!currentUser) {
      router.replace('/login'); 
      return;
    }
    if (taskId && currentUser) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, currentUser, authLoading, router, toast]);


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!currentUser || !taskDetails) return;

    startStatusChangeTransition(async () => {
      const result = await changeTaskStatusAndLog(taskDetails.id, newStatus, currentUser.id);
      if (result.success) {
        toast({ title: "Status Updated", description: result.success });
        fetchData(); // Re-fetch all data
      } else {
        toast({ title: "Error", description: result.error || "Could not update status.", variant: "destructive" });
      }
    });
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
    return <div className="text-center py-10">Task not found or could not be loaded.</div>;
  }
  
  if (!currentUser) {
    // This case should be handled by the redirect in useEffect, but as a fallback:
    return <div className="text-center py-10">Redirecting to login...</div>;
  }

  const canRequestCustomerRevision = taskDetails.status !== "Требует доработки от заказчика" && taskDetails.status !== "Завершено" && taskDetails.status !== "Новая";
  const canRequestExecutorRevision = taskDetails.status !== "Требует доработки от исполнителя" && taskDetails.status !== "Завершено" && taskDetails.executorId;

  const showProposalForm = currentUserRole === 'исполнитель' && !taskDetails.executorId && (taskDetails.status === "Новая" || taskDetails.status === "Ожидает оценку") && !taskProposals.some(p => p.executorId === currentUser.id);
  const showProposalList = currentUserRole === 'заказчик' && !taskDetails.executorId && taskProposals.length > 0 && (taskDetails.status === "Новая" || taskDetails.status === "Ожидает оценку");


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
                      {att.type === 'image' && <Image data-ai-hint="document file" src={att.path} alt={att.name} width={20} height={20} className="mr-2 rounded-sm object-cover" />}
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
        <CardFooter className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-2 pt-4 border-t">
          {currentUser.id === taskDetails.customerId && taskDetails.executorId && ( // Customer specific actions
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusChange("Требует доработки от исполнителя")}
                disabled={!canRequestExecutorRevision || isStatusChanging}
                className="shadow-sm"
                title="Return task to executor for revision"
              >
                {isStatusChanging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Reply className="mr-2 h-4 w-4" />}
                Send to Executor for Revision
              </Button>
            </>
          )}
          {currentUser.id === taskDetails.executorId && ( // Executor specific actions
             <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusChange("Требует доработки от заказчика")}
                disabled={!canRequestCustomerRevision || isStatusChanging}
                className="shadow-sm"
                title="Request clarification or revision from customer"
              >
                {isStatusChanging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendToBack className="mr-2 h-4 w-4" />}
                Request Customer Revision
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Task Proposal Section */}
      {showProposalForm && (
        <TaskProposalForm taskId={taskDetails.id} onProposalSubmitted={fetchData} />
      )}
      {showProposalList && (
        <TaskProposalList 
            proposals={taskProposals} 
            taskId={taskDetails.id} 
            taskCustomerId={taskDetails.customerId}
            currentTaskExecutorId={taskDetails.executorId}
            onProposalAccepted={fetchData}
        />
      )}


      <CommentSection 
        taskId={taskDetails.id} 
        comments={comments} 
        users={users}
        taskStatus={taskDetails.status}
        taskCustomerId={taskDetails.customerId}
        taskExecutorId={taskDetails.executorId}
      />
    </div>
  );
}
