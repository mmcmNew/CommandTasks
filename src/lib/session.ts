'use server';
import type { SessionPayload } from '@/types'; // UserRole removed as roleId is used
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './constants';

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error('AUTH_SECRET environment variable is not set.');
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  console.log('lib/session.ts encrypt: Encrypting payload:', payload);
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
    console.log('lib/session.ts decrypt: Payload decrypted successfully:', payload);
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('lib/session.ts decrypt: Failed to verify session:', error);
    return null;
  }
}

export async function createSession(userId: string, roleId: string) { // role changed to roleId
  console.log('lib/session.ts createSession: Called with userId:', userId, 'roleId:', roleId);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const sessionPayload: SessionPayload = { userId, roleId, expiresAt }; // Use roleId
  console.log('lib/session.ts createSession: Session payload to encrypt:', sessionPayload);
  
  try {
    const sessionToken = await encrypt(sessionPayload);
    console.log('lib/session.ts createSession: Session token encrypted:', sessionToken ? 'OK (length ' + sessionToken.length + ')' : 'Failed or empty');

    if (!sessionToken) {
        console.error('lib/session.ts createSession: Encryption returned empty token.');
        throw new Error('Session token encryption failed.');
    }

    cookies().set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      path: '/',
      sameSite: 'lax', 
    });
    console.log(`lib/session.ts createSession: Cookie "${AUTH_COOKIE_NAME}" set attempt finished.`);
  } catch (error) {
    console.error('lib/session.ts createSession: Error during encrypt or cookie set:', error);
    throw error; // Re-throw to be caught by the caller (e.g., loginUser action)
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  console.log('lib/session.ts getSession: Attempting to get session cookie:', AUTH_COOKIE_NAME);
  const sessionCookie = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    console.log('lib/session.ts getSession: No session cookie found.');
    return null;
  }
  console.log('lib/session.ts getSession: Session cookie found, length:', sessionCookie.length);

  try {
    const session = await decrypt(sessionCookie);
    if (!session) {
        console.log('lib/session.ts getSession: Decryption returned null.');
        return null;
    }
    if (new Date(session.expiresAt) < new Date()) {
      console.log('lib/session.ts getSession: Session expired at', session.expiresAt);
      await deleteSession();
      return null;
    }
    console.log('lib/session.ts getSession: Session is valid:', session);
    return session;
  } catch (error) {
    // Decrypt itself logs errors, so this is more of a fallback
    console.error('lib/session.ts getSession: Error during decryption process:', error);
    return null;
  }
}

export async function deleteSession() {
  console.log('lib/session.ts deleteSession: Deleting session cookie:', AUTH_COOKIE_NAME);
  cookies().delete(AUTH_COOKIE_NAME);
}

export async function updateSession() {
  const session = await getSession();
  if (session) {
    await createSession(session.userId, session.roleId); // Use roleId
    console.log('lib/session.ts updateSession: Session updated for userId:', session.userId);
  } else {
    console.log('lib/session.ts updateSession: No session found to update.');
  }
}
