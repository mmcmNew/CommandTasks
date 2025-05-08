'use server';
import type { CommentFormData } from '@/lib/schema';
import { CommentSchema } from '@/lib/schema';
import { addComment, saveFile } from '@/lib/data';
import { getSession } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import type { Comment, CommentAction, CommentAttachment } from '@/types';

export async function addCommentToTask(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized. Please log in.' };
  }

  const taskId = formData.get('taskId') as string;
  const authorId = formData.get('authorId') as string; // Should match session.userId
  
  if (authorId !== session.userId) {
    return { error: 'User mismatch. Action forbidden.' };
  }

  const rawFormData = {
    text: formData.get('text') as string,
    attachments: formData.getAll('attachments') as File[],
    action: formData.get('action') as CommentAction | null,
  };

  // Filter out empty file inputs
  rawFormData.attachments = rawFormData.attachments.filter(file => file.size > 0);

  const validatedFields = CommentSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { text, attachments, action } = validatedFields.data;
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
    authorId,
    text,
    attachments: uploadedAttachments,
    timestamp: new Date().toISOString(),
    action: action ?? null,
  };

  try {
    await addComment(newComment);
    revalidatePath(`/dashboard/tasks/${taskId}`); // Revalidate the task detail page
    return { success: 'Comment added successfully.' };
  } catch (error) {
    console.error('Add comment error:', error);
    return { error: 'Could not add comment.' };
  }
}
