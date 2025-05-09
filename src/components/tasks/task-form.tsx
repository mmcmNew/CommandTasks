
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { TaskFormData } from '@/lib/schema';
import { TaskSchema } from '@/lib/schema';
import { createTaskAction, updateTaskAction, deleteTaskAction } from '@/lib/actions/task.actions'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TASK_STATUSES } from '@/lib/constants';
import type { User, Task, TaskCategory } from '@/types'; 
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2, Tags, Trash2 } from 'lucide-react'; 
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, useEffect }  from 'react';
import { useAuth } from '@/context/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface TaskFormProps {
  task?: Task; 
  users: User[]; 
  potentialCustomers: User[]; 
  potentialExecutors: User[];
  taskCategories: TaskCategory[]; 
  isEditMode?: boolean;
}

const UNCATEGORIZED_VALUE = "__uncategorized__";

export default function TaskForm({ task, users, potentialCustomers, potentialExecutors, taskCategories, isEditMode = false }: TaskFormProps) {
  const { toast } = useToast();
  const router = useRouter(); 
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const defaultCategoryId = taskCategories.find(cat => cat.name === "Прочее")?.id || (taskCategories.length > 0 ? taskCategories[0].id : null);


  const form = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: TASK_STATUSES[0],
      dueDate: null,
      cost: null,
      customerId: currentUser?.id || '', 
      executorId: null,
      categoryId: defaultCategoryId, 
      attachments: [],
    },
  });
  
  useEffect(() => {
    if (isEditMode && task) {
      form.reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || TASK_STATUSES[0],
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        cost: task.cost || null,
        customerId: task.customerId || '',
        executorId: task.executorId || null,
        categoryId: (task.categoryId === undefined || task.categoryId === "" || task.categoryId === null) ? UNCATEGORIZED_VALUE : task.categoryId,
        attachments: [], 
      });
    } else if (!isEditMode) {
      form.reset({
          title: '',
          description: '',
          status: TASK_STATUSES[0],
          dueDate: null,
          cost: null,
          customerId: currentUser?.id || '',
          executorId: null,
          categoryId: defaultCategoryId === null ? UNCATEGORIZED_VALUE : defaultCategoryId,
          attachments: [],
      });
    }
  }, [task, isEditMode, form, currentUser, defaultCategoryId]);


  async function onSubmit(data: TaskFormData) {
    if (!currentUser?.id) {
      toast({ title: 'Authentication Error', description: 'User not found. Please log in.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'attachments' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) formData.append(key, file);
        });
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (key === 'categoryId' && value === UNCATEGORIZED_VALUE) {
        // Don't append if it's the placeholder for null
      }
       else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });


    try {
      let result;
      if (isEditMode && task?.id) {
        result = await updateTaskAction(task.id, formData, currentUser.id);
      } else {
        result = await createTaskAction(formData, currentUser.id);
      }

      if (result?.error) {
        toast({
          title: isEditMode ? 'Failed to update task' : 'Failed to create task',
          description: result.error + (result.details ? ` ${Object.values(result.details).flat().join(', ')}` : ''),
          variant: 'destructive',
        });
      } else if (result?.success && result.redirectUrl) {
        toast({
          title: isEditMode ? 'Task Updated' : 'Task Created',
          description: `Task "${data.title}" has been successfully ${isEditMode ? 'updated' : 'created'}.`,
        });
        router.push(result.redirectUrl);
      } else {
        // Fallback if result is not in expected shape, though ideally should not happen
         toast({
          title: 'Unexpected Response',
          description: 'The operation might have succeeded, but an unexpected response was received.',
          variant: 'default',
        });
      }
    } catch (error) {
      toast({
        title: 'Operation Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteTask = async () => {
    if (!task?.id || !currentUser?.id) return;
    setIsLoading(true);
    try {
      const result = await deleteTaskAction(task.id, currentUser.id);
      if (result?.error) {
        toast({ title: 'Delete Failed', description: result.error, variant: 'destructive' });
      } else if (result?.success && result.redirectUrl) {
        toast({ title: 'Task Deleted', description: 'The task has been successfully deleted.' });
        router.push(result.redirectUrl);
      } else {
         toast({
          title: 'Unexpected Response',
          description: 'The deletion might have succeeded, but an unexpected response was received.',
          variant: 'default',
        });
      }
    } catch (error) {
      toast({ title: 'Operation Failed', description: 'An unexpected error occurred during deletion.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Design a new logo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed description of the task..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost (USD)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter amount" {...field} 
                    value={field.value === null || field.value === undefined ? '' : String(field.value)}
                    onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Tags className="mr-2 h-4 w-4 text-muted-foreground" />Category</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === UNCATEGORIZED_VALUE ? null : value)} 
                  value={field.value === null || field.value === undefined || field.value === "" ? UNCATEGORIZED_VALUE : field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={UNCATEGORIZED_VALUE}>Uncategorized</SelectItem>
                    {taskCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {potentialCustomers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="executorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Executor (Optional)</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                  value={field.value === null || field.value === undefined ? "none" : field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign an executor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {potentialExecutors.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="attachments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments (Images/PDF, max 5MB each)</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  multiple 
                  onChange={(e) => field.onChange(e.target.files ? Array.from(e.target.files) : [])} 
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </FormControl>
              <FormDescription>You can upload multiple files. {isEditMode && "Uploading new files will replace existing ones if any are selected."}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !currentUser}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Task' : 'Create Task'}
            </Button>

            {isEditMode && task && currentUser?.roleName === 'администратор' && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto" disabled={isLoading}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task
                            and all associated data (comments, proposals, attachments).
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTask} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
      </form>
    </Form>
  );
}
