
import type { Comment as CommentType, User, TaskStatus } from '@/types';
import CommentItem from './comment-item';
import CommentForm from './comment-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface CommentSectionProps {
  taskId: string;
  comments: CommentType[];
  users: User[];
  taskStatus: TaskStatus;
  taskCustomerId: string;
  taskExecutorId: string | null;
}

export default function CommentSection({ taskId, comments, users, taskStatus, taskCustomerId, taskExecutorId }: CommentSectionProps) {
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Comments &amp; Discussion
        </CardTitle>
        <CardDescription>
            {comments.length > 0 ? `Showing ${comments.length} comment(s).` : "No comments yet. Be the first to discuss!"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length > 0 && (
          <div className="space-y-0 mb-6 max-h-[500px] overflow-y-auto pr-2 rounded-md">
            {comments
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) 
              .map((comment) => (
                <CommentItem key={comment.id} comment={comment} users={users} />
            ))}
          </div>
        )}
        <CommentForm 
          taskId={taskId} 
          taskStatus={taskStatus}
          taskCustomerId={taskCustomerId}
          taskExecutorId={taskExecutorId}
        />
      </CardContent>
    </Card>
  );
}
