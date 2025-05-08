'use server';
import { z } from 'zod';
import { RegisterSchema, LoginSchema, type RegisterFormData, type LoginFormData } from '@/lib/schema';
import { getUserByEmail, addUser } from '@/lib/data';
import { createSession, deleteSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { UserRole, CurrentUser } from '@/types'; // Import CurrentUser

// Define a clear return type for loginUser
interface LoginUserResult {
  success?: string;
  user?: CurrentUser; // User details for client-side storage
  error?: string;
  details?: z.ZodError<LoginFormData>['formErrors']['fieldErrors'];
}

export async function registerUser(formData: RegisterFormData) {
  const validatedFields = RegisterSchema.safeParse(formData);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = validatedFields.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { error: 'Email already in use.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    name,
    email,
    passwordHash,
    role,
  };

  try {
    await addUser(newUser);
    return { success: 'Registration successful! Please log in.' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Could not register user.' };
  }
}

export async function loginUser(formData: LoginFormData): Promise<LoginUserResult> {
  const validatedFields = LoginSchema.safeParse(formData);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await getUserByEmail(email);
  if (!user) {
    return { error: 'Invalid email or password.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { error: 'Invalid email or password.' };
  }

  try {
    await createSession(user.id, user.role); // Sets HTTP-only cookie
    // Return user details for client-side
    return { 
      success: 'Login successful!', 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Could not log in.' };
  }
}

export async function logoutUser() {
  await deleteSession(); // Clears HTTP-only cookie
  // Client-side should handle redirect after logout
}
