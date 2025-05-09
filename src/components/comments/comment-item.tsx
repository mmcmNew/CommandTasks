import type { Comment as CommentType, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { User as UserIcon, Paperclip, FileText, Image as ImageIcon, Info } from 'lucide-react';

interface CommentItemProps {
  comment: CommentType;
  users: User[];
}

export default function CommentItem({ comment, users }: CommentItemProps) {
  const author = users.find(u => u.id === comment.authorId);

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return 'Invalid Date';
    }
  };

  if (comment.isSystemMessage) {
    return (
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs text-muted-foreground italic flex items-center">
            <Info className="h-3 w-3 mr-1.5" />
            {comment.text} - {formatDate(comment.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-3 py-4 border-b border-border last:border-b-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={`https://picsum.photos/seed/${author?.id || 'default'}/100/100`} alt={author?.name || 'User'} data-ai-hint="person avatar" />
        <AvatarFallback>
          {author ? author.name.substring(0, 2).toUpperCase() : <UserIcon className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">{author?.name || 'Unknown User'}</h4>
          <p className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</p>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Attachments:</p>
            <ul className="flex flex-wrap gap-2">
              {comment.attachments.map((att, index) => (
                <li key={index}>
                  <a 
                    href={att.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center bg-secondary px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {att.type === 'image' && <ImageIcon className="mr-1 h-3 w-3" />}
                    {att.type === 'pdf' && <FileText className="mr-1 h-3 w-3" />}
                    {att.type === 'other' && <Paperclip className="mr-1 h-3 w-3" />}
                    {att.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


