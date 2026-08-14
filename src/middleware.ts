import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  const refreshToken = request.cookies.get('admin_refresh_token')?.value;
  const { pathname } = request.nextUrl;

  // If user is trying to access the login page and is already logged in, redirect to dashboard
  if (pathname.startsWith('/login') && (token || refreshToken)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is trying to access a protected route without ANY token, redirect to login
  // Allow through if refresh token exists — the client-side interceptor will silently refresh
  if (!pathname.startsWith('/login') && !token && !refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
