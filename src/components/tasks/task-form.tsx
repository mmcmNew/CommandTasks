'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import type { TaskFormData } from '@/lib/schema';
import { TaskSchema } from '@/lib/schema';
import { createTask } from '@/lib/actions/task.actions'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TASK_STATUSES } from '@/lib/constants';
import type { User, Task } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState }  from 'react';

interface TaskFormProps {
  task?: Task; // For editing
  users: User[]; // All users, for general reference or if filtering is done here
  potentialCustomers: User[]; // Pre-filtered customers
  potentialExecutors: User[]; // Pre-filtered executors
  currentUserId: string;
}

export default function TaskForm({ task, users, potentialCustomers, potentialExecutors, currentUserId }: TaskFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || TASK_STATUSES[0],
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      cost: task?.cost || null,
      customerId: task?.customerId || currentUserId, 
      executorId: task?.executorId || null,
      attachments: [],
    },
  });
  

  async function onSubmit(data: TaskFormData) {
    setIsLoading(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'attachments' && Array.isArray(value)) {
        value.forEach(file => {
          if (file instanceof File) formData.append(key, file);
        });
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    formData.append('authorId', currentUserId);

    try {
      const result = await createTask(formData); 
      if (result?.error) {
        toast({
          title: task ? 'Failed to update task' : 'Failed to create task',
          description: result.error + (result.details ? ` ${Object.values(result.details).flat().join(', ')}` : ''),
          variant: 'destructive',
        });
      } else {
        toast({
          title: task ? 'Task Updated' : 'Task Created',
          description: `Task "${data.title}" has been successfully ${task ? 'updated' : 'created'}.`,
        });
        // Redirect is handled by server action in createTask
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
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
        
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (USD)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter amount" {...field} 
                  value={field.value === null ? '' : field.value}
                  onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} defaultValue={field.value || "none"}>
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
              <FormDescription>You can upload multiple files.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </form>
    </Form>
  );
}
