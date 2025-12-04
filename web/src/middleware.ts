import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to handle authentication and route protection.
 * Checks for session cookies and redirects unauthenticated users to login.
 * Allows access to public paths and admin routes (handled separately).
 */
export function middleware(request: NextRequest) {
    const session = request.cookies.get('session')
    const adminSession = request.cookies.get('admin_session')

    // Define paths that don't require authentication
    const publicPaths = [
        '/login',
        '/signup',
        '/verify',
        '/verify-signup',
        '/', // Landing page
    ]
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

    // Check if the current path is public
    const isPublicPath = publicPaths.some(path =>
        request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
    )

    // Admin paths are handled by their own layout/page logic or separate middleware logic if needed
    if (isAdminPath) {
        return NextResponse.next()
    }

    // Redirect to login if no session and trying to access a protected route
    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
