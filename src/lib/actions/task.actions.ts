'use server';
import type { TaskFormData } from '@/lib/schema';
import { TaskSchema } from '@/lib/schema';
import { 
  addTask, 
  getTaskById, 
  updateTask, 
  saveFile, 
  getTasks as getAllTasks,
  getCommentsByTaskId as fetchCommentsFromDb,
  getUserRoles as fetchUserRolesFromDb,
  getUsers as fetchAllUsersFromDb,
  addComment, // Import addComment
  getUserById, // Import getUserById
} from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';
import type { Task, TaskAttachment, Comment, TaskStatus } from '@/types'; // Added Comment and TaskStatus
import { revalidatePath } from 'next/cache';

export async function createTask(formData: FormData, authorId: string) { 
  if (!authorId) {
    return { error: 'Unauthorized. Author ID is missing.' };
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
       if(file && file.size > 0) {
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
    authorId: authorId, 
    createdAt: new Date().toISOString(),
    attachments: uploadedAttachments,
  };

  try {
    await addTask(newTask);
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/tasks/${newTaskId}`);
  } catch (error) {
    console.error('Task creation error:', error);
    return { error: 'Could not create task.' };
  }
  
  redirect(`/dashboard/tasks/${newTaskId}`);
}

export async function getTaskDetails(taskId: string) {
  const task = await getTaskById(taskId);
  if (!task) return null;

  const users = await fetchAllUsersFromDb(); 
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

export async function getTasksForCurrentUser(userId: string) { 
  if (!userId) {
    return []; 
  }
  return await getAllTasks();
}

// Removed old updateTaskStatus function

export async function changeTaskStatusAndLog(
  taskId: string,
  newStatus: TaskStatus, // Should be one of "Требует доработки от заказчика" or "Требует доработки от исполнителя"
  currentUserId: string
) {
  if (!currentUserId) {
    return { error: 'Unauthorized. User ID is missing.' };
  }

  if (newStatus !== "Требует доработки от заказчика" && newStatus !== "Требует доработки от исполнителя") {
    return { error: 'Invalid status for this action.' };
  }

  const task = await getTaskById(taskId);
  if (!task) {
    return { error: 'Task not found.' };
  }

  const user = await getUserById(currentUserId);
  const userName = user ? user.name : 'Система';

  task.status = newStatus;

  const commentText = `Пользователь ${userName} изменил статус задачи на: "${newStatus}".`;
  const newComment: Comment = {
    id: uuidv4(),
    taskId: taskId,
    authorId: currentUserId,
    text: commentText,
    attachments: [],
    timestamp: new Date().toISOString(),
  };

  try {
    await updateTask(task);
    await addComment(newComment);
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: `Task status updated to "${newStatus}" and comment logged.` };
  } catch (error) {
    console.error('Error updating task status and logging comment:', error);
    return { error: 'Could not update task status or log comment.' };
  }
}


export async function fetchTaskPageData(taskId: string) {
  try {
    const taskDetailsWithEnrichedUsers = await getTaskDetails(taskId); 
    
    if (!taskDetailsWithEnrichedUsers) {
      return { success: false, error: "Task not found." };
    }

    const comments = await fetchCommentsFromDb(taskId);
    const allUsersList = await fetchAllUsersFromDb();

    return { 
      success: true, 
      taskDetails: taskDetailsWithEnrichedUsers,
      comments, 
      users: allUsersList 
    };
  } catch (error) {
    console.error(`Failed to fetch page data for task ${taskId}:`, error);
    return { success: false, error: "Failed to load task page data." };
  }
}

export async function fetchNewTaskPageData() {
  try {
    const [users, userRoles] = await Promise.all([
      fetchAllUsersFromDb(),
      fetchUserRolesFromDb()
    ]);
    return { success: true, users, userRoles };
  } catch (error) {
    console.error("Failed to fetch new task page data:", error);
    return { success: false, error: "Failed to load data for new task form." };
  }
}

