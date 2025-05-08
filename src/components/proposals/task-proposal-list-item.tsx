
'use client';

import type { EnrichedTaskProposal, UserRoleName } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DollarSign, CalendarDays, CheckCircle, Loader2, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { acceptTaskProposal } from '@/lib/actions/task.actions';
import { useAuth } from '@/context/auth-context';

interface TaskProposalListItemProps {
  proposal: EnrichedTaskProposal;
  taskCustomerId: string;
  currentTaskExecutorId: string | null; // To disable if task already assigned
  onProposalAccepted?: () => void;
}

export default function TaskProposalListItem({ proposal, taskCustomerId, currentTaskExecutorId, onProposalAccepted }: TaskProposalListItemProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isAccepting, startAcceptTransition] = useTransition();

  const handleAccept = async () => {
    if (!currentUser) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    if (currentUser.id !== taskCustomerId) {
      toast({ title: 'Error', description: 'Only the customer can accept proposals.', variant: 'destructive' });
      return;
    }
    if (currentTaskExecutorId) {
      toast({ title: 'Info', description: 'This task already has an assigned executor.', variant: 'default' });
      return;
    }

    startAcceptTransition(async () => {
      const result = await acceptTaskProposal(proposal.id, currentUser.id);
      if (result.success) {
        toast({ title: 'Proposal Accepted', description: result.success });
        if (onProposalAccepted) onProposalAccepted();
      } else {
        toast({ title: 'Acceptance Failed', description: result.error || 'Could not accept proposal.', variant: 'destructive' });
      }
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const canAccept = currentUser && currentUser.id === taskCustomerId && !currentTaskExecutorId;

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-x-4 pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://picsum.photos/seed/${proposal.executorEmail}/100/100`} alt={proposal.executorName} data-ai-hint="person avatar" />
            <AvatarFallback>
              {proposal.executorName ? proposal.executorName.substring(0, 2).toUpperCase() : <UserIcon />}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold">{proposal.executorName}</CardTitle>
            <CardDescription className="text-xs">Proposed on: {formatDate(proposal.timestamp)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4 space-y-2 text-sm">
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
          Proposed Cost: <strong>{proposal.proposedCost !== null ? `$${proposal.proposedCost.toLocaleString()}` : 'N/A'}</strong>
        </div>
        <div className="flex items-center">
          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
          Proposed Due Date: <strong>{formatDate(proposal.proposedDueDate)}</strong>
        </div>
      </CardContent>
      {canAccept && (
        <CardFooter>
          <Button 
            onClick={handleAccept} 
            disabled={isAccepting || !!currentTaskExecutorId} 
            className="w-full shadow-sm"
            variant="default"
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Accept Proposal & Assign
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
