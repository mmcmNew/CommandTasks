
import type { Task, User, TaskCategory } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TaskStatusBadge from './task-status-badge';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Trash2, CalendarDays, DollarSign, User as UserIcon, Tags } from 'lucide-react'; // Added Tags
import Image from 'next/image';

interface TaskListProps {
  tasks: Task[]; // Assumes tasks are enriched with categoryName
  users: User[];
  categories: TaskCategory[]; // Pass categories for potential filtering/sorting UI, though categoryName is on task
}

const getUserName = (userId: string | null, users: User[]): string => {
  if (!userId) return 'N/A';
  const user = users.find(u => u.id === userId);
  return user ? user.name : 'Unknown User';
};

export default function TaskList({ tasks, users, categories }: TaskListProps) {
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <>
      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Executor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline text-primary">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Tags className="mr-2 h-3.5 w-3.5 text-muted-foreground opacity-80" />
                    {task.categoryName || 'N/A'}
                  </div>
                </TableCell>
                <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                <TableCell>{formatDate(task.dueDate)}</TableCell>
                <TableCell>{task.cost ? `$${task.cost.toLocaleString()}` : 'N/A'}</TableCell>
                <TableCell>{getUserName(task.customerId, users)}</TableCell>
                <TableCell>{getUserName(task.executorId, users)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Link href={`/dashboard/tasks/${task.id}`} passHref>
                    <Button variant="ghost" size="icon" aria-label="View task">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid gap-4 md:hidden">
        {tasks.map((task) => (
          <Card key={task.id} className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline text-primary">
                    {task.title}
                  </Link>
                </CardTitle>
                <TaskStatusBadge status={task.status} />
              </div>
              <CardDescription className="flex items-center text-xs">
                <Tags className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> Category: {task.categoryName || 'N/A'}
              </CardDescription>
              <CardDescription>
                Created: {formatDate(task.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center">
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                Due Date: {formatDate(task.dueDate)}
              </div>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                Cost: {task.cost ? `$${task.cost.toLocaleString()}` : 'N/A'}
              </div>
              <div className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Customer: {getUserName(task.customerId, users)}
              </div>
              <div className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Executor: {getUserName(task.executorId, users)}
              </div>
               {task.attachments && task.attachments.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-semibold text-xs text-muted-foreground mb-1">Attachments:</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.attachments.map((att, index) => (
                      <a key={index} href={att.path} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                        {att.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <Link href={`/dashboard/tasks/${task.id}`} passHref>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
