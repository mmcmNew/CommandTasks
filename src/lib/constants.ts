import type { TaskStatus } from '@/types';

// USER_ROLES is removed as roles are now managed in data.json and fetched via getUserRoles()

export const TASK_STATUSES: TaskStatus[] = [
  "Новая",
  "Ожидает оценку",
  "В работе",
  "Ожидает проверку", 
  "Ожидает оплату",   
  "Доработано", // New: Task has been reworked
  "Завершено",        
  "Требует доработки от заказчика", 
  "Требует доработки от исполнителя",
];

export const AUTH_COOKIE_NAME = "taskflow_session";



