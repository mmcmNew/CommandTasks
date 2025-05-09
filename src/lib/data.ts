
import fs from 'fs/promises';
import path from 'path';
import type { User, Task, Comment, UserRoleObject, UserRoleName, TaskProposal, TaskCategory } from '@/types';

interface AppData {
  users: User[];
  tasks: Task[];
  comments: Comment[];
  userRoles: UserRoleObject[];
  taskProposals: TaskProposal[];
  taskCategories: TaskCategory[];
}

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'data.json');

export async function readData(): Promise<AppData> {
  try {
    const jsonData = await fs.readFile(dataFilePath, 'utf-8');
    const parsedData = JSON.parse(jsonData) as AppData;
    return {
      users: parsedData.users || [],
      tasks: parsedData.tasks || [],
      comments: parsedData.comments || [],
      userRoles: parsedData.userRoles || [],
      taskProposals: parsedData.taskProposals || [],
      taskCategories: parsedData.taskCategories || [],
    };
  } catch (error) {
    console.error('Failed to read data file:', error);
    return { users: [], tasks: [], comments: [], userRoles: [], taskProposals: [], taskCategories: [] };
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
  return data.userRoles; 
}

// Task Category specific functions
export async function getTaskCategories(): Promise<TaskCategory[]> {
  const data = await readData();
  return data.taskCategories;
}

export async function getTaskCategoryById(id: string): Promise<TaskCategory | undefined> {
  const categories = await getTaskCategories();
  return categories.find(category => category.id === id);
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
  const categories = data.taskCategories || [];
  return data.tasks.map(task => {
    const category = categories.find(c => c.id === task.categoryId);
    return {
      ...task,
      categoryName: category ? category.name : 'Uncategorized',
    };
  });
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const data = await readData();
  const task = data.tasks.find(task => task.id === id);
  if (task) {
    const category = data.taskCategories.find(c => c.id === task.categoryId);
    return {
      ...task,
      categoryName: category ? category.name : 'Uncategorized',
    };
  }
  return undefined;
}

export async function addTask(task: Task): Promise<void> {
  const data = await readData();
  const { categoryName, ...taskToSave } = task;
  data.tasks.push(taskToSave as Task);
  await writeData(data);
}

export async function updateTask(updatedTask: Task): Promise<void> {
  const data = await readData();
  const taskIndex = data.tasks.findIndex(task => task.id === updatedTask.id);
  if (taskIndex !== -1) {
    const { categoryName, ...taskToSave } = updatedTask;
    data.tasks[taskIndex] = taskToSave as Task;
    await writeData(data);
  } else {
    throw new Error('Task not found for update.');
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const data = await readData();
  const initialLength = data.tasks.length;
  data.tasks = data.tasks.filter(task => task.id !== taskId);
  if (data.tasks.length === initialLength) {
    throw new Error('Task not found for deletion.');
  }
  // Optionally, delete related comments and proposals
  data.comments = data.comments.filter(comment => comment.taskId !== taskId);
  data.taskProposals = data.taskProposals.filter(proposal => proposal.taskId !== taskId);
  // Optionally, delete associated files in public/uploads/taskId
  // This is complex and requires careful implementation to avoid deleting unrelated files.
  // For now, we'll leave the files.
  await writeData(data);
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

// TaskProposal specific functions
export async function getTaskProposalsByTaskId(taskId: string): Promise<TaskProposal[]> {
  const data = await readData();
  return data.taskProposals.filter(proposal => proposal.taskId === taskId);
}

export async function getTaskProposalById(proposalId: string): Promise<TaskProposal | undefined> {
  const data = await readData();
  return data.taskProposals.find(proposal => proposal.id === proposalId);
}

export async function addTaskProposal(proposal: TaskProposal): Promise<void> {
  const data = await readData();
  const existingProposalIndex = data.taskProposals.findIndex(p => p.taskId === proposal.taskId && p.executorId === proposal.executorId);
  if (existingProposalIndex !== -1) {
    data.taskProposals[existingProposalIndex] = proposal; 
  } else {
    data.taskProposals.push(proposal);
  }
  await writeData(data);
}

export async function deleteTaskProposalsByTaskId(taskId: string): Promise<void> {
  const data = await readData();
  data.taskProposals = data.taskProposals.filter(proposal => proposal.taskId !== taskId);
  await writeData(data);
}

export async function deleteTaskProposalById(proposalId: string): Promise<void> {
  const data = await readData();
  data.taskProposals = data.taskProposals.filter(proposal => proposal.id !== proposalId);
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
     relativePath = `${relativePath}/${sanitizedFileName}`; 
  }
  
  const destinationDir = await ensureUploadsDirectoryExists(taskId, subfolder?.startsWith('comments/') ? subfolder.split('/')[1] : undefined);
  const filePath = path.join(destinationDir, sanitizedFileName);
  
  await fs.writeFile(filePath, buffer);
  return `/${relativePath}`; 
}
