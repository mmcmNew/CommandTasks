
export type UserRoleName = "заказчик" | "исполнитель";

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
  | "Требует доработки от заказчика" 
  | "Требует доработки от исполнителя"
  | "Доработано" // New: Task has been reworked after a revision request
  | "В работе"
  | "Ожидает проверку" // New: Executor has marked task as done
  | "Ожидает оплату"   // New: Customer has accepted the work, pending payment confirmation
  | "Завершено"; // Final state, implies payment confirmed in the new flow

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

// Added newStatusToSet to allow changing task status when submitting a comment
export interface Comment {
  id: string;
  taskId: string;
  authorId: string; // User ID
  text: string;
  attachments: CommentAttachment[];
  timestamp: string; // ISO date string
  // newStatusToSet?: TaskStatus; // This logic will be handled by the action based on form input
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


