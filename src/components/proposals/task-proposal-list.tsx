
'use client';

import type { EnrichedTaskProposal } from '@/types';
import TaskProposalListItem from './task-proposal-list-item';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Info } from 'lucide-react';

interface TaskProposalListProps {
  proposals: EnrichedTaskProposal[];
  taskId: string;
  taskCustomerId: string;
  currentTaskExecutorId: string | null;
  onProposalAccepted?: () => void;
}

export default function TaskProposalList({ proposals, taskId, taskCustomerId, currentTaskExecutorId, onProposalAccepted }: TaskProposalListProps) {
  if (proposals.length === 0) {
    return (
        <Card className="mt-6 bg-secondary border-dashed">
            <CardHeader className="items-center text-center">
                <Info className="w-8 h-8 text-muted-foreground mb-2" />
                <CardTitle className="text-lg">No Proposals Yet</CardTitle>
                <CardDescription>
                No executors have submitted proposals for this task.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <ListChecks className="mr-2 h-6 w-6 text-primary" /> Submitted Proposals
      </h3>
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <TaskProposalListItem 
            key={proposal.id} 
            proposal={proposal} 
            taskCustomerId={taskCustomerId}
            currentTaskExecutorId={currentTaskExecutorId}
            onProposalAccepted={onProposalAccepted}
          />
        ))}
      </div>
    </div>
  );
}
