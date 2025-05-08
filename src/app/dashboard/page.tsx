import { getTasks, getUsers } from '@/lib/data';
import TaskList from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Filter, ClipboardList } from 'lucide-react'; // Added ClipboardList here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const tasks = await getTasks();
  const users = await getUsers(); // To resolve author/customer/executor names

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Dashboard</h1>
          <p className="text-muted-foreground">Overview of all your project tasks.</p>
        </div>
        <div className="flex gap-2">
           {/* Filter button can be implemented later */}
          {/* <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter Tasks
          </Button> */}
          <Link href="/dashboard/tasks/new" passHref>
            <Button className="shadow-md">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
            </Button>
          </Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <Card className="w-full py-12">
          <CardHeader className="items-center text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Tasks Yet</CardTitle>
            <CardDescription>
              Get started by creating your first task.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard/tasks/new" passHref>
              <Button size="lg">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <TaskList tasks={tasks} users={users} />
      )}
    </div>
  );
}
