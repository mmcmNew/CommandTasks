
export type UserRoleName = "заказчик" | "исполнитель" | "администратор";

export interface UserRoleObject {
  id: string;
  name: UserRoleName;
}

export interface User {
  id:string;
  email: string;
  passwordHash: string; // Store hashed password
  name: string;
  roleId: string; 
}

export type TaskStatus = 
  | "Новая" 
  | "Ожидает оценку" 
  | "В работе"
  | "Требует доработки от заказчика" 
  | "Требует доработки от исполнителя"
  | "Доработано заказчиком" 
  | "Доработано исполнителем" 
  | "Ожидает проверку" 
  | "Принята. Ожидает подтверждение оплаты" // New status
  | "Завершено";        

export interface TaskAttachment {
  path: string;
  name: string;
  type: "image" | "pdf" | "other";
}

export interface TaskCategory {
  id: string;
  name: string;
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
  categoryId: string | null; // Added categoryId
  categoryName?: string; // For enriched tasks
}

export interface CommentAttachment extends TaskAttachment {}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string; // User ID
  text: string;
  attachments: CommentAttachment[];
  timestamp: string; // ISO date string
  isSystemMessage?: boolean; // Added to differentiate system messages
}

export interface SessionPayload { // For secure HTTP-only cookie session
  userId: string;
  roleId: string; 
  expiresAt: Date;
}

export interface CurrentUser { // For localStorage, non-sensitive user details
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: UserRoleName;
}

export interface TaskProposal {
  id: string;
  taskId: string;
  executorId: string;
  proposedCost: number | null;
  proposedDueDate: string | null; // ISO date string
  timestamp: string; // ISO date string
}

export interface EnrichedTaskProposal extends TaskProposal {
  executorName: string;
  executorEmail: string; // For avatar or contact
}
