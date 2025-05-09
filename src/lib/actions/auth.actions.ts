'use server';
import { z } from 'zod';
import { RegisterSchema, LoginSchema, type RegisterFormData, type LoginFormData } from '@/lib/schema';
import { getUserByEmail, addUser, getUserRoles as fetchRolesFromDb } from '@/lib/data'; // Aliased getUserRoles
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { CurrentUser } from '@/types';

interface LoginUserResult {
  success?: string;
  user?: CurrentUser; 
  error?: string;
  details?: z.ZodError<LoginFormData>['formErrors']['fieldErrors'];
}

export async function registerUser(formData: RegisterFormData) {
  const validatedFields = RegisterSchema.safeParse(formData);

  if (!validatedFields.success) {
    return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password, roleId } = validatedFields.data;

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
    roleId,
  };

  try {
    // @ts-ignore User type expects roleId which is provided
    await addUser(newUser);
    return { success: 'Registration successful! Please log in.' };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Could not register user.' };
  }
}

export async function loginUser(formData: LoginFormData): Promise<LoginUserResult> {
  console.log('loginUser: Starting loginUser function');
  const validatedFields = LoginSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.log('loginUser: Validation failed');
    return { error: 'Invalid fields.', details: validatedFields.error.flatten().fieldErrors };
  }
  console.log('loginUser: Validation successful');

  const { email, password } = validatedFields.data;

  const user = await getUserByEmail(email); // getUserByEmail now returns roleName as well
  if (!user) {
    console.log('loginUser: User not found');
    return { error: 'Invalid email or password.' };
  }
  console.log('loginUser: User found, id:', user.id, 'roleId:', user.roleId, 'roleName:', user.roleName);

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    console.log('loginUser: Password does not match');
    return { error: 'Invalid email or password.' };
  }
  console.log('loginUser: Password matches');

  // Server no longer creates session cookie directly. Client will handle localStorage.
  return { 
    success: 'Login successful!', 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      roleId: user.roleId, 
      roleName: user.roleName // roleName is from the enhanced getUserByEmail
    } 
  };
}

export async function logoutUser() {
  // This function can be used for any server-side cleanup during logout if needed.
  // For localStorage based auth, primary logout (clearing storage) happens client-side.
  console.log('logoutUser: Server-side logout signal received.');
  // No cookie deletion needed here as we're moving away from cookies.
}

export async function fetchUserRolesAction() {
  try {
    const roles = await fetchRolesFromDb();
    return { success: true, roles };
  } catch (error) {
    console.error("Failed to fetch user roles via action:", error);
    return { success: false, error: "Failed to load roles." };
  }
}
