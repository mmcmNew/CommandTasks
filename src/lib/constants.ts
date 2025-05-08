import type { UserRole, TaskStatus } from '@/types';

export const USER_ROLES: UserRole[] = ["заказчик", "исполнитель"];

export const TASK_STATUSES: TaskStatus[] = [
  "Новая",
  "Ожидает оценку",
  "Требует доработки от заказчика",
  "Требует доработки от исполнителя",
  "В работе",
  "Завершено",
];

export const AUTH_COOKIE_NAME = "taskflow_session";
