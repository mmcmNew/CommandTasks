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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from 'react';
import { Send, Loader2, Paperclip, AlertTriangle } from 'lucide-react';
import type { CommentAction } from '@/types';
import { useAuth } from '@/context/auth-context';


interface CommentFormProps {
  taskId: string;
  // currentUserId prop removed, will be taken from context
}

const COMMENT_ACTIONS: CommentAction[] = ["Требует доработки от заказчика", "Требует доработки от исполнителя"];

export default function CommentForm({ taskId }: CommentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const form = useForm<CommentFormData>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      text: '',
      attachments: [],
      action: null,
    },
  });

  async function onSubmit(data: CommentFormData) {
    if (!currentUser?.id) {
      toast({ title: 'Authentication Error', description: 'User not found. Please log in.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('text', data.text);
    if (data.action) {
      formData.append('action', data.action);
    }
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach(file => {
        if (file instanceof File) formData.append('attachments', file);
      });
    }
    formData.append('taskId', taskId);
    formData.append('authorId', currentUser.id); // authorId in FormData is for validation, actual authorId for action is passed as param

    try {
      // Pass currentUser.id as the currentUserId to the server action
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
          description: 'Your comment has been successfully posted.',
        });
        form.reset(); 
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="attachments"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-sm">Attachments (Optional)</FormLabel>
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
            <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-sm">Trigger Action (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} defaultValue={field.value || "none"}>
                        <FormControl>
                        <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Select an action" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="none">No Action</SelectItem>
                        {COMMENT_ACTIONS.map((action) => (
                            <SelectItem key={action} value={action}>
                            <AlertTriangle className="mr-2 h-3 w-3 inline-block"/>{action}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" disabled={isLoading || !currentUser} className="w-full sm:w-auto shadow-md">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Post Comment
        </Button>
      </form>
    </Form>
  );
}
