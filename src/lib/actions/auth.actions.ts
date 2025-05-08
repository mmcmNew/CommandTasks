'use server';
import { z } from 'zod';
import { RegisterSchema, LoginSchema, type RegisterFormData, type LoginFormData } from '@/lib/schema';
import { getUserByEmail, addUser } from '@/lib/data';
import { createSession, deleteSession } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';

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
    // Optionally, log the user in directly after registration
    // await createSession(newUser.id, newUser.role);
    // return { success: 'Registration successful! Redirecting to login...' };
     return { success: 'Registration successful! Please log in.' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Could not register user.' };
  }
}

export async function loginUser(formData: LoginFormData) {
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
    await createSession(user.id, user.role);
    // No explicit redirect here, let the component handle it or use middleware
    return { success: 'Login successful!' };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Could not log in.' };
  }
}

export async function logoutUser() {
  await deleteSession();
  redirect('/login');
}
