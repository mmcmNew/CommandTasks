'use server';
import type { SessionPayload, UserRole } from '@/types';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './constants';

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error('AUTH_SECRET environment variable is not set.');
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Session expires in 1 day
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload; // Cast needed as jose types are generic
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

export async function createSession(userId: string, role: UserRole) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const sessionPayload: SessionPayload = { userId, role, expiresAt };
  
  const session = await encrypt(sessionPayload);

  cookies().set(AUTH_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
    sameSite: 'lax', 
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const sessionCookie = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  const session = await decrypt(sessionCookie);
  if (!session || new Date(session.expiresAt) < new Date()) {
    // Session expired or invalid
    await deleteSession();
    return null;
  }
  
  return session;
}

export async function deleteSession() {
  cookies().delete(AUTH_COOKIE_NAME);
}

export async function updateSession() {
  const session = await getSession();
  if (session) {
    // Re-issue the session to extend its lifetime
    await createSession(session.userId, session.role);
  }
}
