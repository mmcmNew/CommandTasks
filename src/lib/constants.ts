import type { TaskStatus } from '@/types';

// USER_ROLES is removed as roles are now managed in data.json and fetched via getUserRoles()

export const TASK_STATUSES: TaskStatus[] = [
  "Новая",
  "Ожидает оценку",
  "В работе",
  "Ожидает проверку", // New: Executor has marked task as done
  "Ожидает оплату",   // New: Customer has accepted the work, pending payment confirmation
  "Завершено",        // Final state, implies payment confirmed in the new flow
  "Требует доработки от заказчика", 
  "Требует доработки от исполнителя",
];

export const AUTH_COOKIE_NAME = "taskflow_session";


