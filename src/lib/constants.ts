import type { TaskStatus } from '@/types';

// USER_ROLES is removed as roles are now managed in data.json and fetched via getUserRoles()

export const TASK_STATUSES: TaskStatus[] = [
  "Новая",
  "Ожидает оценку",
  "Ожидает выбор исполнителя", // New display status
  "В работе",
  "Требует доработки от заказчика", 
  "Требует доработки от исполнителя",
  "Доработано заказчиком", 
  "Доработано исполнителем",
  "Ожидает проверку", 
  "Принята. Ожидает подтверждение оплаты",
  "Завершено",        
];

export const AUTH_COOKIE_NAME = "taskflow_session";

