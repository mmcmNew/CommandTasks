
'use server';
import type { CommentFormData } from '@/lib/schema';
import { CommentSchema } from '@/lib/schema';
import { addComment, saveFile, getTaskById, updateTask, getUserById } from '@/lib/data'; 
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import type { Comment, CommentAttachment, TaskStatus } from '@/types'; 

export async function addCommentToTask(formData: FormData, currentUserId: string) { 
  if (!currentUserId) {
    return { error: 'Unauthorized. User ID is missing.' };
  }

  const taskId = formData.get('taskId') as string;
  const authorIdFromForm = formData.get('authorId') as string; 
  
  if (authorIdFromForm !== currentUserId) {
    return { error: 'User mismatch. Action forbidden.' };
  }
  
  const newStatusToSetFromFormValue = formData.get('newStatusToSet'); // string | File | null

  const rawFormData = {
    text: formData.get('text') as string,
    attachments: formData.getAll('attachments') as File[],
    // If newStatusToSetFromFormValue is null (field not in FormData), treat as undefined for optional schema.
    // Otherwise, pass the value (which could be "none" or a TaskStatus) to the schema.
    newStatusToSet: newStatusToSetFromFormValue === null 
                      ? undefined 
                      : newStatusToSetFromFormValue as TaskStatus | "none",
  };

  rawFormData.attachments = rawFormData.attachments.filter(file => file.size > 0);

  const validatedFields = CommentSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Comment validation errors:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid comment fields.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { text, attachments, newStatusToSet } = validatedFields.data;
  const newCommentId = uuidv4();
  const uploadedAttachments: CommentAttachment[] = [];

  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      if (file && file.size > 0) {
        try {
          const savedPath = await saveFile(file, taskId, `comments/${newCommentId}`);
          uploadedAttachments.push({ path: savedPath, name: file.name, type: file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'other') });
        } catch (e) {
          console.error("Comment file upload error:", e);
          return { error: `Failed to upload file for comment: ${file.name}` };
        }
      }
    }
  }

  const newComment: Comment = {
    id: newCommentId,
    taskId,
    authorId: currentUserId, 
    text,
    attachments: uploadedAttachments,
    timestamp: new Date().toISOString(),
    isSystemMessage: false, // Regular user comment
  };

  try {
    await addComment(newComment); // Add the main user comment first

    let statusUpdateMessage = "";
    if (newStatusToSet) {
      const task = await getTaskById(taskId);
      const user = await getUserById(currentUserId);
      const userName = user ? user.name : 'Система';
      
      if (!task) {
         return { error: 'Task not found for status update.' };
      }
      const oldStatus = task.status;

      // Authorization for status change
      let authorizedToChange = false;
      if (newStatusToSet === "Доработано заказчиком") {
        if (task.status === "Требует доработки от заказчика" && task.customerId === currentUserId) authorizedToChange = true;
      } else if (newStatusToSet === "Доработано исполнителем") {
        if (task.status === "Требует доработки от исполнителя" && task.executorId === currentUserId) authorizedToChange = true;
      } else if (newStatusToSet === "Требует доработки от исполнителя") { // Customer requests rework from executor
        if ((task.status === "В работе" || task.status === "Ожидает проверку") && task.customerId === currentUserId) authorizedToChange = true;
      } else if (newStatusToSet === "Требует доработки от заказчика") { // Executor requests rework from customer
        if (task.status === "В работе" && task.executorId === currentUserId) authorizedToChange = true;
      }


      if (authorizedToChange && oldStatus !== newStatusToSet) {
        task.status = newStatusToSet;
        await updateTask(task);
        statusUpdateMessage = ` Статус задачи изменен с "${oldStatus}" на "${newStatusToSet}" пользователем ${userName}.`;
        
        const statusChangeCommentText = `Статус задачи изменен с "${oldStatus}" на "${newStatusToSet}" пользователем ${userName} при добавлении комментария.`;
        const statusChangeComment: Comment = {
            id: uuidv4(),
            taskId,
            authorId: currentUserId, 
            text: statusChangeCommentText,
            attachments: [],
            timestamp: new Date().toISOString(),
            isSystemMessage: true, // This is a system message
        };
        await addComment(statusChangeComment); // Add separate comment for status change log
      } else if (oldStatus === newStatusToSet) {
        // No actual status change, do nothing extra
      } else if (!authorizedToChange) {
         return { error: `User ${userName} is not authorized to change status to "${newStatusToSet}" from "${oldStatus}" or the transition is not allowed.`};
      }
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: `Comment added successfully.${statusUpdateMessage}` };
  } catch (error) {
    console.error('Error during comment addition or status update:', error);
    return { error: 'Could not add comment or update status.' };
  }
}

