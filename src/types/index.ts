

export type UserRoleName = "заказчик" | "исполнитель";

export interface UserRoleObject {
  id: string;
  name: UserRoleName;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // Store hashed password
  name: string;
  roleId: string; // Changed from role: UserRole
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

export interface CommentAttachment extends TaskAttachment {}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string; // User ID
  text: string;
  attachments: CommentAttachment[];
  timestamp: string; // ISO date string
}

export interface SessionPayload { // For secure HTTP-only cookie session
  userId: string;
  roleId: string; // Changed from role: UserRole
  expiresAt: Date;
}

export interface CurrentUser { // For localStorage, non-sensitive user details
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: UserRoleName;
}

