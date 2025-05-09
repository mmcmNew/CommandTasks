

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CommentFormData } from '@/lib/schema';
import { CommentSchema } from '@/lib/schema';
import { addCommentToTask } from '@/lib/actions/comment.actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, useMemo } from 'react';
import { Send, Loader2, Paperclip, Edit } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { TaskStatus } from '@/types';
import { TASK_STATUSES } from '@/lib/constants';

interface CommentFormProps {
  taskId: string;
  taskStatus: TaskStatus;
  taskCustomerId: string;
  taskExecutorId: string | null;
  onCommentAdded: () => void; // Callback to refresh comments
}

export default function CommentForm({ taskId, taskStatus, taskCustomerId, taskExecutorId, onCommentAdded }: CommentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      text: '',
      attachments: [],
      newStatusToSet: "none" as any, 
    },
  });

  const availableStatusChanges = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.roleName === 'администратор') {
      return TASK_STATUSES.filter(status => status !== taskStatus); // Admin can change to any status (except current)
    }

    const options: TaskStatus[] = [];
    const isCustomer = currentUser.id === taskCustomerId;
    const isExecutor = currentUser.id === taskExecutorId;

    // From "Требует доработки от ..." to "Доработано ..."
    if (taskStatus === "Требует доработки от заказчика" && isCustomer) {
      options.push("Доработано заказчиком");
    }
    if (taskStatus === "Требует доработки от исполнителя" && isExecutor) {
      options.push("Доработано исполнителем");
    }

    // From "В работе" to "Требует доработки от ..."
    if (taskStatus === "В работе") {
      if (isExecutor) {
        options.push("Требует доработки от заказчика");
      }
      if (isCustomer) {
         options.push("Требует доработки от исполнителя");
      }
    }
    
    // From "Ожидает проверку" (by customer) to "Требует доработки от исполнителя"
    if (taskStatus === "Ожидает проверку" && isCustomer) {
      options.push("Требует доработки от исполнителя");
    }
    
    return options.filter(status => status !== taskStatus);
  }, [currentUser, taskStatus, taskCustomerId, taskExecutorId]);


  const canChangeStatusViaComment = availableStatusChanges.length > 0;

  async function onSubmit(data: CommentFormData) {
    if (!currentUser?.id) {
      toast({ title: 'Authentication Error', description: 'User not found. Please log in.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('text', data.text);
    if (data.newStatusToSet && data.newStatusToSet !== "none") {
      formData.append('newStatusToSet', data.newStatusToSet);
    }
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        if (file instanceof File) formData.append('attachments', file);
      });
    }
    formData.append('taskId', taskId);
    formData.append('authorId', currentUser.id); 

    try {
      const result = await addCommentToTask(formData, currentUser.id);
      if (result?.error) {
        toast({
          title: 'Failed to add comment',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Comment Added',
          description: result.success || 'Your comment has been successfully posted.',
        });
        form.reset({ text: '', attachments: [], newStatusToSet: 'none' as any }); 
        onCommentAdded(); // Trigger re-fetch of comments
      }
    } catch (error) {
      toast({
        title: 'Operation Failed',
        description: 'An unexpected error occurred while adding the comment.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Comment Text</FormLabel>
              <FormControl>
                <Textarea placeholder="Write a comment..." {...field} rows={4} className="shadow-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm flex items-center">
                  <Paperclip className="mr-2 h-4 w-4" /> Attachments (Optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    type="file" 
                    multiple 
                    onChange={(e) => field.onChange(e.target.files ? Array.from(e.target.files) : [])} 
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="text-xs"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {canChangeStatusViaComment && (
            <FormField
              control={form.control}
              name="newStatusToSet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm flex items-center">
                    <Edit className="mr-2 h-4 w-4" /> Change Status (Optional)
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger className="shadow-sm">
                        <SelectValue placeholder="Select status to set" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Do not change status</SelectItem>
                      {availableStatusChanges.map(statusValue => (
                        <SelectItem key={statusValue} value={statusValue} disabled={taskStatus === statusValue}>
                          {statusValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <Button type="submit" disabled={isLoading || !currentUser} className="w-full sm:w-auto shadow-md">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Post Comment
        </Button>
      </form>
    </Form>
  );
}




