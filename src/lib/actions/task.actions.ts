
'use server';
import type { TaskFormData, TaskProposalFormData } from '@/lib/schema';
import { TaskSchema, TaskProposalSchema } from '@/lib/schema';
import { 
  addTask, 
  getTaskById, 
  updateTask, 
  saveFile, 
  getTasks as getAllTasks,
  getCommentsByTaskId as fetchCommentsFromDb,
  getUserRoles as fetchUserRolesFromDb,
  getUsers as fetchAllUsersFromDb,
  addComment, 
  getUserById, 
  addTaskProposal as saveTaskProposal,
  getTaskProposalsByTaskId as fetchTaskProposalsFromDb,
  getTaskProposalById as fetchTaskProposalByIdFromDb,
  deleteTaskProposalsByTaskId,
  // deleteTaskProposalById, // Not currently used, but keep for future
} from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';
import type { Task, TaskAttachment, Comment, TaskStatus, TaskProposal, UserRoleName, EnrichedTaskProposal, User } from '@/types';
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

export async function changeTaskStatusAndLog(
  taskId: string,
  newStatus: TaskStatus, 
  currentUserId: string // Changed from actingUserId to currentUserId for consistency
) {
  if (!currentUserId) {
    return { error: 'Unauthorized. User ID is missing.' };
  }

  const task = await getTaskById(taskId);
  if (!task) {
    return { error: 'Task not found.' };
  }

  const user = await getUserById(currentUserId);
  const userName = user ? user.name : 'Система';

  const oldStatus = task.status;
  task.status = newStatus;

  const commentText = `Пользователь ${userName} изменил статус задачи с "${oldStatus}" на: "${newStatus}".`;
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


export async function fetchTaskPageData(taskId: string, currentUserId?: string) {
  try {
    const taskDetailsWithEnrichedUsers = await getTaskDetails(taskId); 
    
    if (!taskDetailsWithEnrichedUsers) {
      return { success: false, error: "Task not found." };
    }

    const comments = await fetchCommentsFromDb(taskId);
    const allUsersList = await fetchAllUsersFromDb();
    const userRoles = await fetchUserRolesFromDb();

    const rawProposals = await fetchTaskProposalsFromDb(taskId);
    const enrichedProposals: EnrichedTaskProposal[] = rawProposals.map(proposal => {
      const executor = allUsersList.find(u => u.id === proposal.executorId);
      return {
        ...proposal,
        executorName: executor?.name || 'Unknown Executor',
        executorEmail: executor?.email || '',
      };
    });
    
    const currentUser = currentUserId ? await getUserById(currentUserId) : null;

    return { 
      success: true, 
      taskDetails: taskDetailsWithEnrichedUsers,
      comments, 
      users: allUsersList,
      taskProposals: enrichedProposals,
      userRoles, 
      currentUserRoleName: currentUser?.roleName
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

export async function submitTaskProposal(formData: FormData, currentUserId: string) {
  if (!currentUserId) {
    return { error: 'Unauthorized. User ID is missing.' };
  }
  const currentUser = await getUserById(currentUserId);
  if (!currentUser || currentUser.roleName !== 'исполнитель') {
    return { error: 'Only executors can submit proposals.' };
  }

  const taskId = formData.get('taskId') as string;
  const rawFormData = {
    taskId,
    proposedCost: formData.get('proposedCost') ? parseFloat(formData.get('proposedCost') as string) : null,
    proposedDueDate: formData.get('proposedDueDate') ? new Date(formData.get('proposedDueDate') as string) : null,
  };

  const validatedFields = TaskProposalSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    console.error("Proposal validation error details:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid proposal data.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { proposedCost, proposedDueDate } = validatedFields.data;

  const task = await getTaskById(taskId);
  if (!task) {
    return { error: 'Task not found.' };
  }
  if (task.executorId) {
    return { error: 'Task already has an assigned executor. Proposals cannot be submitted or edited.' };
  }
  if (task.status !== 'Новая' && task.status !== 'Ожидает оценку') {
     return { error: 'Task is not open for proposals at this stage.' };
  }

  // Check if this executor already has a proposal for this task
  const existingProposals = await fetchTaskProposalsFromDb(taskId);
  const existingProposalForUser = existingProposals.find(p => p.executorId === currentUserId);

  const proposalToSave: TaskProposal = {
    id: existingProposalForUser ? existingProposalForUser.id : uuidv4(), // Use existing ID if updating
    taskId,
    executorId: currentUserId,
    proposedCost,
    proposedDueDate: proposedDueDate ? proposedDueDate.toISOString() : null,
    timestamp: new Date().toISOString(), // Always update timestamp for new or edited proposal
  };

  try {
    await saveTaskProposal(proposalToSave); // saveTaskProposal handles create or update
    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: existingProposalForUser ? 'Proposal updated successfully.' : 'Proposal submitted successfully.' };
  } catch (error) {
    console.error('Error submitting/updating task proposal:', error);
    return { error: 'Could not submit or update proposal.' };
  }
}

export async function acceptTaskProposal(proposalId: string, currentUserId: string) {
  if (!currentUserId) {
    return { error: 'Unauthorized. User ID is missing.' };
  }

  const proposal = await fetchTaskProposalByIdFromDb(proposalId);
  if (!proposal) {
    return { error: 'Proposal not found.' };
  }

  const task = await getTaskById(proposal.taskId);
  if (!task) {
    return { error: 'Task not found.' };
  }

  if (task.customerId !== currentUserId) {
    return { error: 'Only the task customer can accept proposals.' };
  }

  if (task.executorId) {
    return { error: 'Task already has an assigned executor.' };
  }
  
  const customer = await getUserById(task.customerId);
  const executor = await getUserById(proposal.executorId);

  if (!customer || !executor) {
    return { error: 'Customer or Executor details not found.'};
  }

  task.executorId = proposal.executorId;
  task.cost = proposal.proposedCost;
  task.dueDate = proposal.proposedDueDate;
  const oldStatus = task.status;
  task.status = 'В работе'; 
  
  const commentText = `Заказчик ${customer.name} назначил исполнителя ${executor.name} для задачи. ` +
                      `Условия: стоимость - ${proposal.proposedCost !== null ? `$${proposal.proposedCost.toLocaleString()}` : 'N/A'}, ` +
                      `срок - ${proposal.proposedDueDate ? new Date(proposal.proposedDueDate).toLocaleDateString() : 'N/A'}. ` +
                      `Статус задачи изменен с "${oldStatus}" на "${task.status}".`;
  
  const assignmentComment: Comment = {
    id: uuidv4(),
    taskId: task.id,
    authorId: currentUserId, 
    text: commentText,
    attachments: [],
    timestamp: new Date().toISOString(),
  };

  try {
    await updateTask(task);
    await addComment(assignmentComment);
    
    // Delete all proposals for this task, including the accepted one,
    // as its details are now part of the task.
    await deleteTaskProposalsByTaskId(task.id);

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/tasks/${task.id}`);
    return { success: 'Proposal accepted and executor assigned.' };
  } catch (error) {
    console.error('Error accepting task proposal:', error);
    return { error: 'Could not accept proposal.' };
  }
}

// New actions for task completion flow

export async function markTaskAsCompletedByExecutorAction(taskId: string, currentUserId: string) {
  if (!currentUserId) return { error: 'Unauthorized. User ID is missing.' };

  const task = await getTaskById(taskId);
  if (!task) return { error: 'Task not found.' };
  if (task.executorId !== currentUserId) return { error: 'Only the assigned executor can mark this task as completed.' };
  if (task.status !== 'В работе') return { error: `Task cannot be marked as completed from status: ${task.status}.` };

  const user = await getUserById(currentUserId);
  const userName = user ? user.name : 'Исполнитель';
  const oldStatus = task.status;
  const newStatus: TaskStatus = 'Ожидает проверку';
  
  task.status = newStatus;

  const commentText = `Исполнитель ${userName} отметил задачу как выполненную. Статус изменен с "${oldStatus}" на "${newStatus}". Ожидается проверка заказчиком.`;
  const newComment: Comment = {
    id: uuidv4(),
    taskId,
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
    return { success: `Task marked as completed. Status: ${newStatus}.` };
  } catch (error) {
    console.error('Error marking task as completed:', error);
    return { error: 'Could not mark task as completed.' };
  }
}

export async function acceptCompletedTaskByCustomerAction(taskId: string, currentUserId: string) {
  if (!currentUserId) return { error: 'Unauthorized. User ID is missing.' };

  const task = await getTaskById(taskId);
  if (!task) return { error: 'Task not found.' };
  if (task.customerId !== currentUserId) return { error: 'Only the customer can accept this task.' };
  if (task.status !== 'Ожидает проверку') return { error: `Task cannot be accepted from status: ${task.status}.` };
  
  const user = await getUserById(currentUserId);
  const userName = user ? user.name : 'Заказчик';
  const oldStatus = task.status;
  const newStatus: TaskStatus = 'Ожидает оплату';

  task.status = newStatus;

  const commentText = `Заказчик ${userName} принял выполненную работу. Статус изменен с "${oldStatus}" на "${newStatus}". Ожидается подтверждение оплаты исполнителем.`;
  const newComment: Comment = {
    id: uuidv4(),
    taskId,
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
    return { success: `Task accepted. Status: ${newStatus}.` };
  } catch (error) {
    console.error('Error accepting task:', error);
    return { error: 'Could not accept task.' };
  }
}

export async function confirmPaymentAndFinalizeTaskAction(taskId: string, currentUserId: string) {
  if (!currentUserId) return { error: 'Unauthorized. User ID is missing.' };

  const task = await getTaskById(taskId);
  if (!task) return { error: 'Task not found.' };
  if (task.executorId !== currentUserId) return { error: 'Only the assigned executor can confirm payment for this task.' };
  if (task.status !== 'Ожидает оплату') return { error: `Payment cannot be confirmed for task with status: ${task.status}.` };

  const user = await getUserById(currentUserId);
  const userName = user ? user.name : 'Исполнитель';
  const oldStatus = task.status;
  const newStatus: TaskStatus = 'Завершено';

  task.status = newStatus;

  const commentText = `Исполнитель ${userName} подтвердил получение оплаты. Статус изменен с "${oldStatus}" на "${newStatus}". Задача завершена.`;
  const newComment: Comment = {
    id: uuidv4(),
    taskId,
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
    return { success: `Payment confirmed. Task finalized with status: ${newStatus}.` };
  } catch (error) {
    console.error('Error confirming payment and finalizing task:', error);
    return { error: 'Could not confirm payment or finalize task.' };
  }
}
