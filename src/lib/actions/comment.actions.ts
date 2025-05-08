
'use server';
import type { CommentFormData } from '@/lib/schema';
import { CommentSchema } from '@/lib/schema';
import { addComment, saveFile, getTaskById, updateTask, getUserById } from '@/lib/data'; // Added getTaskById, updateTask
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import type { Comment, CommentAttachment, TaskStatus } from '@/types'; // Added TaskStatus

export async function addCommentToTask(formData: FormData, currentUserId: string) { 
  if (!currentUserId) {
    return { error: 'Unauthorized. User ID is missing.' };
  }

  const taskId = formData.get('taskId') as string;
  const authorIdFromForm = formData.get('authorId') as string; 
  const newStatusToSet = formData.get('newStatusToSet') as TaskStatus | undefined | "none";
  
  if (authorIdFromForm !== currentUserId) {
    return { error: 'User mismatch. Action forbidden.' };
  }

  const rawFormData = {
    text: formData.get('text') as string,
    attachments: formData.getAll('attachments') as File[],
    newStatusToSet: newStatusToSet === "none" ? undefined : newStatusToSet,
  };

  rawFormData.attachments = rawFormData.attachments.filter(file => file.size > 0);

  const validatedFields = CommentSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Comment validation errors:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid comment fields.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { text, attachments, newStatusToSet: validatedStatus } = validatedFields.data;
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
  };

  try {
    await addComment(newComment);

    let statusUpdateMessage = "";
    if (validatedStatus && (validatedStatus === "Требует доработки от заказчика" || validatedStatus === "Требует доработки от исполнителя")) {
      const task = await getTaskById(taskId);
      const user = await getUserById(currentUserId);
      const userName = user ? user.name : 'Система';
      
      if (task) {
        const oldStatus = task.status;
        if (oldStatus !== validatedStatus) {
            task.status = validatedStatus;
            await updateTask(task);
            statusUpdateMessage = ` Статус задачи изменен с "${oldStatus}" на "${validatedStatus}" пользователем ${userName}.`;
            
            // Log a system comment for the status change
            const statusChangeComment: Comment = {
                id: uuidv4(),
                taskId,
                authorId: currentUserId, // Or a system ID if preferred
                text: `Статус задачи изменен с "${oldStatus}" на "${validatedStatus}" пользователем ${userName} при добавлении комментария.`,
                attachments: [],
                timestamp: new Date().toISOString(),
            };
            await addComment(statusChangeComment);
        }
      } else {
         return { error: 'Task not found for status update.' };
      }
    }

    revalidatePath(`/dashboard/tasks/${taskId}`);
    return { success: `Comment added successfully.${statusUpdateMessage}` };
  } catch (error) {
    console.error('Error during comment addition or status update:', error);
    return { error: 'Could not add comment or update status.' };
  }
}
