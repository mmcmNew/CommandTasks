import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/session';

const protectedRoutes = ['/dashboard']; // Add more routes as needed
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {  
  console.log('Running middleware');
  const session = await getSession();
  console.log('Session:', session);

  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.includes(pathname);
  console.log('Is protected route:', isProtectedRoute);
  console.log('Is auth route:', isAuthRoute);

  if (isAuthRoute) {
    if (session) {
      // If user is logged in and tries to access login/register, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!session) {
      // If user is not logged in and tries to access a protected route, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
      console.log('Redirecting to login from protected route');
    }
    // If session exists, update it to extend its lifetime (optional, good for active users)
    // await updateSession(); 
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /uploads (uploaded files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};

