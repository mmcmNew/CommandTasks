'use server';
import type { TaskFormData } from '@/lib/schema';
import { TaskSchema } from '@/lib/schema';
import { addTask, getTaskById, getUsers, updateTask, saveFile, getTasks as getAllTasks } from '@/lib/data';
import { getSession } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';
import type { Task, TaskAttachment } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createTask(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized. Please log in.' };
  }

  const rawFormData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    status: formData.get('status') as Task['status'],
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null,
    cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
    customerId: formData.get('customerId') as string,
    executorId: formData.get('executorId') ? formData.get('executorId') as string : null,
    attachments: formData.getAll('attachments') as File[],
  };
  
  // Filter out empty file inputs
  rawFormData.attachments = rawFormData.attachments.filter(file => file.size > 0);


  const validatedFields = TaskSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
  }
  
  const { title, description, status, dueDate, cost, customerId, executorId, attachments } = validatedFields.data;

  const newTaskId = uuidv4();
  const uploadedAttachments: TaskAttachment[] = [];

  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
       if(file && file.size > 0) { // Ensure file is not empty placeholder
        try {
          const savedPath = await saveFile(file, newTaskId, 'task');
          uploadedAttachments.push({ path: savedPath, name: file.name, type: file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'other') });
        } catch (e) {
          console.error("File upload error:", e);
          return { error: `Failed to upload file: ${file.name}` };
        }
      }
    }
  }

  const newTask: Task = {
    id: newTaskId,
    title,
    description,
    status,
    dueDate: dueDate ? dueDate.toISOString() : null,
    cost: cost ?? null,
    customerId,
    executorId: executorId ?? null,
    authorId: session.userId,
    createdAt: new Date().toISOString(),
    attachments: uploadedAttachments,
  };

  try {
    await addTask(newTask);
    revalidatePath('/dashboard'); // Revalidate task list
    revalidatePath(`/dashboard/tasks/${newTaskId}`); // Revalidate new task page
  } catch (error) {
    console.error('Task creation error:', error);
    return { error: 'Could not create task.' };
  }
  
  redirect(`/dashboard/tasks/${newTaskId}`);
}

export async function getTaskDetails(taskId: string) {
  const task = await getTaskById(taskId);
  if (!task) return null;

  const users = await getUsers();
  const author = users.find(u => u.id === task.authorId);
  const customer = users.find(u => u.id === task.customerId);
  const executor = task.executorId ? users.find(u => u.id === task.executorId) : null;

  return {
    ...task,
    authorName: author?.name || 'Unknown',
    customerName: customer?.name || 'Unknown',
    executorName: executor?.name || 'N/A',
  };
}

export async function getTasksForCurrentUser() {
  // This is a placeholder. In a real app, you'd filter tasks based on user role (customer, executor, author)
  // For now, it returns all tasks.
  const session = await getSession();
  if (!session) {
    return [];
  }
  return await getAllTasks();
}

export async function updateTaskStatus(taskId: string, status: Task['status']) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const task = await getTaskById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  // Add role-based logic for who can update status if needed
  // e.g., if (session.userId !== task.authorId && session.userId !== task.executorId && session.role !== 'admin') return { error: 'Forbidden' };
  
  task.status = status;
  
  try {
    await updateTask(task);
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: 'Status updated' };
  } catch (error) {
    console.error('Update status error:', error);
    return { error: 'Could not update status' };
  }
}

// More actions like updateTaskDetails, deleteTask, assignExecutor can be added here.
