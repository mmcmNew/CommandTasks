
'use server';

import { getTasks as getAllTasksFromDb, getUsers, getTaskCategories } from '@/lib/data';
import type { Task, User, TaskCategory } from '@/types';

interface DashboardDataResult {
  tasks: Task[]; // Enriched tasks
  users: User[];
  categories: TaskCategory[];
  error?: string;
}

export async function getDashboardData(): Promise<DashboardDataResult> {
  try {
    // getTasks from data.ts already enriches with categoryName
    const tasks = await getAllTasksFromDb(); 
    const users = await getUsers();
    const categories = await getTaskCategories();

    return { tasks, users, categories };
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return { tasks: [], users: [], categories: [], error: "Failed to load dashboard data." };
  }
}
