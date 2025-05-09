
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
  
  const newStatusToSetFromFormValue = formData.get('newStatusToSet');

  const rawFormData = {
    text: formData.get('text') as string,
    attachments: formData.getAll('attachments') as File[],
    newStatusToSet: newStatusToSetFromFormValue === null || newStatusToSetFromFormValue === "none"
                      ? undefined 
                      : newStatusToSetFromFormValue as TaskStatus,
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
    isSystemMessage: false,
  };

  try {
    await addComment(newComment); 

    let statusUpdateMessage = "";
    if (newStatusToSet) { // newStatusToSet is already transformed, so "none" becomes undefined here
      const task = await getTaskById(taskId);
      const user = await getUserById(currentUserId);
      const userName = user ? user.name : 'Система';
      
      if (!task) {
         return { error: 'Task not found for status update.' };
      }
      const oldStatus = task.status;

      let authorizedToChange = false;
      if (newStatusToSet === "Доработано заказчиком") {
        if (task.status === "Требует доработки от заказчика" && task.customerId === currentUserId) authorizedToChange = true;
      } else if (newStatusToSet === "Доработано исполнителем") {
        if (task.status === "Требует доработки от исполнителя" && task.executorId === currentUserId) authorizedToChange = true;
      } else if (newStatusToSet === "Требует доработки от исполнителя") { 
        if ((task.status === "В работе" || task.status === "Ожидает проверку") && task.customerId === currentUserId) authorizedToChange = true;
      } else if (newStatusToSet === "Требует доработки от заказчика") { 
        if (task.status === "В работе" && task.executorId === currentUserId) authorizedToChange = true;
      }


      if (authorizedToChange && oldStatus !== newStatusToSet) {
        // First status change (user initiated)
        task.status = newStatusToSet;
        await updateTask(task);
        
        const firstStatusChangeCommentText = `Статус задачи изменен с "${oldStatus}" на "${newStatusToSet}" пользователем ${userName} при добавлении комментария.`;
        const firstStatusChangeComment: Comment = {
            id: uuidv4(),
            taskId,
            authorId: currentUserId, 
            text: firstStatusChangeCommentText,
            attachments: [],
            timestamp: new Date().toISOString(),
            isSystemMessage: true,
        };
        await addComment(firstStatusChangeComment);
        statusUpdateMessage = ` Статус задачи изменен на "${newStatusToSet}".`;

        // Auto-transition if executor sets "Доработано исполнителем"
        if (newStatusToSet === "Доработано исполнителем" && task.executorId === currentUserId) {
            const autoTransitionStatus: TaskStatus = "Ожидает проверку";
            const intermediateStatus = task.status; // This is "Доработано исполнителем"
            
            task.status = autoTransitionStatus;
            await updateTask(task);

            const autoTransitionCommentText = `Статус задачи автоматически изменен с "${intermediateStatus}" на "${autoTransitionStatus}" после доработки исполнителем.`;
            const autoTransitionComment: Comment = {
                id: uuidv4(),
                taskId,
                authorId: currentUserId, 
                text: autoTransitionCommentText,
                attachments: [],
                timestamp: new Date().toISOString(),
                isSystemMessage: true,
            };
            await addComment(autoTransitionComment);
            statusUpdateMessage += ` Затем статус автоматически обновлен на "${autoTransitionStatus}".`;
        }

      } else if (oldStatus === newStatusToSet) {
        // No actual status change selected by user
      } else if (!authorizedToChange) {
         return { error: `User ${userName} не авторизован для изменения статуса на "${newStatusToSet}" с "${oldStatus}" или переход не разрешен.`};
      }
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: `Комментарий успешно добавлен.${statusUpdateMessage}` };
  } catch (error) {
    console.error('Error during comment addition or status update:', error);
    return { error: 'Не удалось добавить комментарий или обновить статус.' };
  }
}

