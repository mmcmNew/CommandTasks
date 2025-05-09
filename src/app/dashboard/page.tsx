
'use client';

import { getDashboardData } from '@/lib/actions/dashboard.actions';
import TaskList from '@/components/tasks/task-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ClipboardList, AlertTriangle, ListFilter, ArrowDownUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect, useState, useMemo } from 'react';
import type { Task, User, TaskCategory } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortKey = 'title' | 'status' | 'dueDate' | 'cost' | 'categoryName';
type SortOrder = 'asc' | 'desc';

export default function DashboardPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const result = await getDashboardData();
      if (result.error) {
        setError(result.error);
        setAllTasks([]);
        setUsers([]);
        setCategories([]);
      } else {
        setAllTasks(result.tasks);
        setUsers(result.users);
        setCategories(result.categories || []); // Ensure categories is an array
        setError(null);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const activeTasks = useMemo(() => {
    return allTasks.filter(task => task.status !== "Завершено");
  }, [allTasks]);

  const sortedTasks = useMemo(() => {
    let sorted = [...activeTasks];
    sorted.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'dueDate') {
        // Handle nulls: tasks with due dates come before those without, or vice-versa depending on order
        if (valA === null && valB === null) return 0;
        if (valA === null) return sortOrder === 'asc' ? 1 : -1;
        if (valB === null) return sortOrder === 'asc' ? -1 : 1;
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else if (sortKey === 'cost') {
        // Handle nulls for cost
        if (valA === null && valB === null) return 0;
        if (valA === null) return sortOrder === 'asc' ? 1 : -1; // Treat null as largest or smallest
        if (valB === null) return sortOrder === 'asc' ? -1 : 1;
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA === undefined || valA === null) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB === undefined || valB === null) valB = sortOrder === 'asc' ? Infinity : -Infinity;


      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [activeTasks, sortKey, sortOrder]);


  if (isLoading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task Dashboard</h1>
            <p className="text-muted-foreground">Overview of all your project tasks.</p>
          </div>
           <div className="flex gap-2">
            <Link href="/dashboard/tasks/new" passHref>
              <Button className="shadow-md">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
              </Button>
            </Link>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
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
          <h1 className="text-3xl font-bold tracking-tight">Task Dashboard</h1>
          <p className="text-muted-foreground">Overview of active project tasks.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-muted-foreground" />
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="cost">Cost</SelectItem>
                <SelectItem value="categoryName">Category</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              <ArrowDownUp className="h-4 w-4" />
              <span className="sr-only">Toggle Sort Order ({sortOrder === 'asc' ? 'Ascending' : 'Descending'})</span>
            </Button>
          </div>
          <Link href="/dashboard/tasks/new" passHref>
            <Button className="shadow-md h-9">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Task
            </Button>
          </Link>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <Card className="w-full py-12">
          <CardHeader className="items-center text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Active Tasks Yet</CardTitle>
            <CardDescription>
              Create a new task or check the history for completed ones.
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
        <TaskList tasks={sortedTasks} users={users} categories={categories} />
      )}
    </div>
  );
}
