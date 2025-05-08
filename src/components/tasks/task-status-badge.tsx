import type { TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export default function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let statusColorClass = '';

  switch (status) {
    case 'Новая':
      variant = 'default'; // Blue (Primary theme color)
      statusColorClass = 'bg-primary/80 text-primary-foreground';
      break;
    case 'Ожидает оценку':
      variant = 'secondary';
      statusColorClass = 'bg-yellow-500 text-white';
      break;
    case 'Требует доработки от заказчика':
      variant = 'outline';
      statusColorClass = 'border-orange-500 text-orange-500';
      break;
    case 'Требует доработки от исполнителя':
      variant = 'outline';
      statusColorClass = 'border-purple-500 text-purple-500';
      break;
    case 'Доработано': // New status
      variant = 'default';
      statusColorClass = 'bg-indigo-500 text-white'; // Example: Indigo
      break;
    case 'В работе':
      variant = 'default';
      statusColorClass = 'bg-accent text-accent-foreground'; // Teal (Accent theme color)
      break;
    case 'Ожидает проверку': 
      variant = 'default';
      statusColorClass = 'bg-blue-500 text-white'; 
      break;
    case 'Ожидает оплату': 
      variant = 'default';
      statusColorClass = 'bg-amber-500 text-white'; 
      break;
    case 'Завершено':
      variant = 'secondary';
      statusColorClass = 'bg-green-600 text-white';
      break;
    default:
      variant = 'outline';
      statusColorClass = 'border-muted-foreground text-muted-foreground';
  }

  return (
    <Badge variant={variant} className={cn(statusColorClass, 'font-semibold', className)}>
      {status}
    </Badge>
  );
}


