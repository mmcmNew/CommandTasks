
export type UserRole = "заказчик" | "исполнитель";

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Store hashed password
  name: string;
  role: UserRole;
}

export type TaskStatus = 
  | "Новая" 
  | "Ожидает оценку" 
  | "Требует доработки от заказчика" 
  | "Требует доработки от исполнителя"
  | "В работе"
  | "Завершено";

export interface TaskAttachment {
  path: string;
  name: string;
  type: "image" | "pdf" | "other";
}

export interface Task {
  id: string;
  createdAt: string; // ISO date string
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null; // ISO date string or null
  cost: number | null;
  authorId: string; // User ID
  customerId: string; // User ID
  executorId: string | null; // User ID or null
  attachments: TaskAttachment[];
}

export type CommentAction = 
  | "Требует доработки от заказчика" 
  | "Требует доработки от исполнителя";

export interface CommentAttachment extends TaskAttachment {}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string; // User ID
  text: string;
  attachments: CommentAttachment[];
  timestamp: string; // ISO date string
  action: CommentAction | null;
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  expiresAt: Date;
}
