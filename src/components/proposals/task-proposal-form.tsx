
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TaskProposalSchema, type TaskProposalFormData } from '@/lib/schema';
import { submitTaskProposal } from '@/lib/actions/task.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useEffect } from 'react';
import { CalendarIcon, DollarSign, Send, Loader2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { EnrichedTaskProposal } from '@/types';

interface TaskProposalFormProps {
  taskId: string;
  onProposalSubmitted?: () => void; // Optional callback
  existingProposal?: EnrichedTaskProposal | null;
}

export default function TaskProposalForm({ taskId, onProposalSubmitted, existingProposal }: TaskProposalFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isPending, startTransition] = useTransition();

  const form = useForm<TaskProposalFormData>({
    resolver: zodResolver(TaskProposalSchema),
    defaultValues: {
      taskId: taskId,
      proposedCost: existingProposal?.proposedCost ?? null,
      proposedDueDate: existingProposal?.proposedDueDate ? new Date(existingProposal.proposedDueDate) : null,
    },
  });

  useEffect(() => {
    // Reset form if existingProposal changes (e.g., after submission and re-fetch)
    // or if it's initially loaded
    form.reset({
      taskId: taskId,
      proposedCost: existingProposal?.proposedCost ?? null,
      proposedDueDate: existingProposal?.proposedDueDate ? new Date(existingProposal.proposedDueDate) : null,
    });
  }, [existingProposal, taskId, form]);


  async function onSubmit(data: TaskProposalFormData) {
    if (!currentUser) {
      toast({ title: 'Error', description: 'You must be logged in to submit a proposal.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('taskId', data.taskId);
      if (data.proposedCost !== null && data.proposedCost !== undefined) {
        formData.append('proposedCost', String(data.proposedCost));
      }
      if (data.proposedDueDate) {
        formData.append('proposedDueDate', data.proposedDueDate.toISOString());
      }

      const result = await submitTaskProposal(formData, currentUser.id);
      if (result.success) {
        toast({ title: existingProposal ? 'Proposal Updated' : 'Proposal Submitted', description: result.success });
        // Form reset is handled by useEffect when existingProposal (or lack thereof) changes after fetchData
        if (onProposalSubmitted) onProposalSubmitted();
      } else {
        toast({ title: existingProposal ? 'Update Failed' : 'Submission Failed', description: result.error || 'Could not submit proposal.', variant: 'destructive' });
      }
    });
  }

  const buttonText = existingProposal ? 'Update Proposal' : 'Submit Proposal';
  const buttonIcon = existingProposal ? <Edit className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />;


  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <DollarSign className="mr-2 h-5 w-5 text-primary" /> 
          {existingProposal ? 'Edit Your Proposal' : 'Submit Your Proposal'}
        </CardTitle>
        <CardDescription>
          {existingProposal ? 'Update your estimated cost and completion date.' : 'Provide your estimated cost and completion date for this task.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="proposedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposed Cost (USD)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter amount" 
                      {...field} 
                      value={field.value === null || field.value === undefined ? '' : field.value}
                      onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      className="shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposedDueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Proposed Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal shadow-sm",
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
            <Button type="submit" disabled={isPending || !currentUser} className="w-full shadow-md">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : buttonIcon}
              {buttonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

