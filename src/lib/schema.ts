
import { z } from 'zod';
import { TASK_STATUSES } from './constants'; 
import type { TaskStatus } from '@/types'; // Ensure TaskStatus is imported for the ZodEnum cast

export const RegisterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  roleId: z.string().min(1, { message: "Role is required." }), 
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const fileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => ALLOWED_FILE_TYPES.includes(file.type),
    "Only .jpg, .png, and .pdf files are accepted."
  ); 
  
const fileListSchema = z.array(fileSchema).optional(); 


export const TaskSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  status: z.enum(TASK_STATUSES, { message: "Invalid status." }),
  dueDate: z.date().nullable().optional(),
  cost: z.coerce.number().positive({ message: "Cost must be a positive number." }).nullable().optional(),
  customerId: z.string().uuid({ message: "Invalid customer ID." }),
  executorId: z.string().uuid({ message: "Invalid executor ID." }).nullable().optional(),
  categoryId: z.string({ required_error: "Category is required." }).min(1, { message: "Category is required."}).nullable().optional(), // Added categoryId
  attachments: fileListSchema,
});

export type TaskFormData = z.infer<typeof TaskSchema>;


export const CommentSchema = z.object({
  text: z.string().min(1, { message: "Comment text cannot be empty." }),
  attachments: fileListSchema,
  newStatusToSet: z.enum([...TASK_STATUSES, "none"] as [TaskStatus | "none", ...(TaskStatus | "none")[]])
    .optional()
    .transform(val => val === "none" ? undefined : val) as z.ZodOptional<z.ZodEnum<typeof TASK_STATUSES>>,
});

export type CommentFormData = z.infer<typeof CommentSchema>;

export const TaskProposalSchema = z.object({
  taskId: z.string().uuid(),
  proposedCost: z.coerce.number().positive({ message: "Proposed cost must be a positive number." }).nullable().optional(),
  proposedDueDate: z.date().nullable().optional(),
}).refine(data => data.proposedCost !== null || data.proposedDueDate !== null, {
  message: "Either proposed cost or proposed due date must be provided.",
  path: ["proposedCost"], 
});

export type TaskProposalFormData = z.infer<typeof TaskProposalSchema>;
