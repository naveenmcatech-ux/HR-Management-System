//src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('hrms-session');
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/unauthorized'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect root to appropriate page
  if (pathname === '/') {
    if (sessionCookie?.value === 'admin-authenticated') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For now, only admin dashboard is protected by this logic.
  // Supabase handles auth for other roles on the client-side.
  if (pathname.startsWith('/admin')) {
    if (sessionCookie?.value !== 'admin-authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/hr/:path*',
    '/employee/:path*',
    '/dashboard/:path*',
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|unauthorized).*)'
  ],
};
