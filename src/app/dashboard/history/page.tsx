
// src/app/dashboard/history/page.tsx
import { getCompletedTasksAction } from '@/lib/actions/task.actions';
import TaskList from '@/components/tasks/task-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, HistoryIcon, ListChecks } from 'lucide-react'; 
import type { TaskCategory } from '@/types'; // Added TaskCategory

export default async function HistoryPage() {
  // getCompletedTasksAction now returns tasks already enriched with categoryName
  const { tasks, users, error /*, categories */ } = await getCompletedTasksAction(); 
  // Categories are fetched within the action and used for enrichment, not directly needed here.

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <HistoryIcon className="mr-3 h-8 w-8 text-primary" />
              Task History
            </h1>
            <p className="text-muted-foreground">Overview of all completed tasks.</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading History</AlertTitle>
          <AlertDescription>
            {error} Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <HistoryIcon className="mr-3 h-8 w-8 text-primary" />
              Task History
            </h1>
          <p className="text-muted-foreground">Overview of all completed tasks.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="w-full py-12">
          <CardHeader className="items-center text-center">
            <ListChecks className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Completed Tasks Yet</CardTitle>
            <CardDescription>
              Once tasks are marked as 'Завершено', they will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
          </CardContent>
        </Card>
      ) : (
        // Pass an empty array for categories if not used directly by TaskList for sorting/filtering UI in this context
        <TaskList tasks={tasks} users={users} categories={[]} />
      )}
    </div>
  );
}
