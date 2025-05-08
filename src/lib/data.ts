import fs from 'fs/promises';
import path from 'path';
import type { User, Task, Comment, UserRoleObject, UserRoleName } from '@/types';

interface AppData {
  users: User[];
  tasks: Task[];
  comments: Comment[];
  userRoles: UserRoleObject[];
}

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'data.json');

export async function readData(): Promise<AppData> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(jsonData) as AppData;
  } catch (error) {
    console.error('Failed to read data file:', error);
    // If file doesn't exist or is corrupted, return a default structure
    return { users: [], tasks: [], comments: [], userRoles: [] };
  }
}

export async function writeData(data: AppData): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(dataFilePath, jsonData, 'utf-8');
  } catch (error) {
    console.error('Failed to write data file:', error);
    throw new Error('Could not save data.');
  }
}

// User Role specific functions
export async function getUserRoles(): Promise<UserRoleObject[]> {
  const data = await readData();
  return data.userRoles || []; // Ensure userRoles is always an array
}


// User specific functions
export async function getUsers(): Promise<User[]> {
  const data = await readData();
  return data.users;
}

export async function getUserByEmail(email: string): Promise<(User & { roleName: UserRoleName }) | undefined> {
  const data = await readData();
  const user = data.users.find(u => u.email === email);
  if (user) {
    const role = data.userRoles.find(r => r.id === user.roleId);
    return { ...user, roleName: role ? role.name : 'Unknown Role' as UserRoleName };
  }
  return undefined;
}

export async function getUserById(id: string): Promise<(User & { roleName: UserRoleName }) | undefined> {
  const data = await readData();
  const user = data.users.find(u => u.id === id);
  if (user) {
    const role = data.userRoles.find(r => r.id === user.roleId);
    return { ...user, roleName: role ? role.name : 'Unknown Role' as UserRoleName };
  }
  return undefined;
}

export async function addUser(user: User): Promise<void> {
  const data = await readData();
  data.users.push(user);
  await writeData(data);
}

// Task specific functions
export async function getTasks(): Promise<Task[]> {
  const data = await readData();
  return data.tasks;
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const tasks = await getTasks();
  return tasks.find(task => task.id === id);
}

export async function addTask(task: Task): Promise<void> {
  const data = await readData();
  data.tasks.push(task);
  await writeData(data);
}

export async function updateTask(updatedTask: Task): Promise<void> {
  const data = await readData();
  const taskIndex = data.tasks.findIndex(task => task.id === updatedTask.id);
  if (taskIndex !== -1) {
    data.tasks[taskIndex] = updatedTask;
    await writeData(data);
  } else {
    throw new Error('Task not found for update.');
  }
}


// Comment specific functions
export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const data = await readData();
  return data.comments.filter(comment => comment.taskId === taskId);
}

export async function addComment(comment: Comment): Promise<void> {
  const data = await readData();
  data.comments.push(comment);
  await writeData(data);
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadsDirectoryExists(taskId?: string, commentId?: string): Promise<string> {
  let specificPath = uploadsDir;
  if (taskId) {
    specificPath = path.join(specificPath, taskId);
    if (commentId) {
      specificPath = path.join(specificPath, 'comments', commentId);
    } else {
      specificPath = path.join(specificPath, 'task');
    }
  }
  
  try {
    await fs.access(specificPath);
  } catch {
    await fs.mkdir(specificPath, { recursive: true });
  }
  return specificPath;
}

export async function saveFile(file: File, taskId: string, subfolder?: 'task' | `comments/${string}`): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  let relativePath = `uploads/${taskId}`;
  if (subfolder === 'task') {
    relativePath = `${relativePath}/task/${sanitizedFileName}`;
  } else if (subfolder?.startsWith('comments/')) {
     relativePath = `${relativePath}/${subfolder}/${sanitizedFileName}`;
  } else {
     relativePath = `${relativePath}/${sanitizedFileName}`; // Default to task root if no subfolder specified
  }
  
  const destinationDir = await ensureUploadsDirectoryExists(taskId, subfolder?.startsWith('comments/') ? subfolder.split('/')[1] : undefined);
  const filePath = path.join(destinationDir, sanitizedFileName);
  
  await fs.writeFile(filePath, buffer);
  return `/${relativePath}`; // Return public path
}
