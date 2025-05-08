import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Middleware can no longer reliably check auth status if using localStorage for session.
// Client-side checks (e.g., in AuthProvider or specific page components) will handle redirects
// for protected routes and auth routes (like redirecting logged-in users from /login).

export async function middleware(request: NextRequest) {  
  // The primary auth logic is now client-side.
  // This middleware can be used for other purposes like internationalization,
  // A/B testing, or basic path rewriting not related to auth state from localStorage.
  
  // console.log('Middleware running for path:', request.nextUrl.pathname);
  
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
