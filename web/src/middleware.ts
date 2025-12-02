import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

    const isPublicPath = publicPaths.some(path =>
        request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
    )
    if (isAdminPath) {
        return NextResponse.next()
    }

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
