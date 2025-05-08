
'use server';

import { getTasks, getUsers } from '@/lib/data';
import type { Task, User } from '@/types';

interface DashboardDataResult {
  tasks: Task[];
  users: User[];
  error?: string;
}

export async function getDashboardData(): Promise<DashboardDataResult> {
  try {
    const tasks = await getTasks();
    const users = await getUsers();
    return { tasks, users };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    // Return empty arrays and an error message or re-throw, depending on desired error handling
    return { tasks: [], users: [], error: "Failed to load dashboard data." };
  }
}
