import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static/image/api routes without using deprecated config export
  const excluded = [
    /^\/api\//,
    /^\/_next\//,
    /^\/_next\/static\//,
    /^\/_next\/image\//,
    /^\/favicon\.ico$/,
  ];
  if (excluded.some((rx) => rx.test(pathname))) {
    return NextResponse.next();
  }

  let isSetupComplete = false;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('API URL ortam değişkeni (NEXT_PUBLIC_API_URL) tanımlanmamış!');
    }

    const statusResponse = await fetch(`${apiUrl}/setup/status`, {
      cache: 'no-store',
    });

    if (!statusResponse.ok) {
      throw new Error(`API status check failed with status: ${statusResponse.status} ${statusResponse.statusText}`);
    }

    const data = await statusResponse.json();
    isSetupComplete = data.isSetupComplete;
  } catch (error) {
    isSetupComplete = false;
  }

  // Setup not complete → always send to /setup (except when already there)
  if (!isSetupComplete) {
    if (pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url));
    }
    return NextResponse.next();
  }

  // Setup complete → auth checks
  const token = request.cookies.get('authToken');

  // Root or setup after completion → go to login
  if (pathname === '/' || pathname === '/setup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token missing/invalid, redirect to login from any non-public path
  const publicPaths = ['/login'];
  const isPublic = publicPaths.includes(pathname);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists and user goes to login, redirect to dashboard
  if (pathname.startsWith('/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};