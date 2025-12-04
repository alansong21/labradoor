import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/verify', '/verify-signup', '/']
const RESEARCHER_ONLY_PATHS = [/^\/my-posts(?:\/.*)?$/, /^\/researcher-myposts(?:\/.*)?$/, /^\/researcher-post-creation(?:\/.*)?$/]
const STUDENT_ONLY_PATHS = [/^\/student_application(?:\/.*)?$/]
const API_BASE_URLS = [
    process.env.INTERNAL_API_URL,
    process.env.API_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
    'http://server:4000/api',
    'http://localhost:4000/api',
].filter(Boolean) as string[]

type Role = 'STUDENT' | 'RESEARCHER' | null

const pathMatches = (pathname: string, patterns: RegExp[]) => patterns.some(pattern => pattern.test(pathname))

async function fetchUserRole(sessionValue: string | undefined): Promise<Role> {
    if (!sessionValue) return null
    for (const base of API_BASE_URLS) {
        try {
            const res = await fetch(`${base.replace(/\/$/, '')}/auth/me`, {
                headers: {
                    Cookie: `session=${sessionValue}`,
                },
                cache: 'no-store',
            })
            if (!res.ok) continue
            const body = await res.json()
            const user = body?.user
            if (user?.researcher) return 'RESEARCHER'
            if (user?.student) return 'STUDENT'
            return null
        } catch (error) {
            continue
        }
    }
    return null
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const session = request.cookies.get('session')
    const isAdminPath = pathname.startsWith('/admin')
    const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))

    if (isAdminPath) {
        return NextResponse.next()
    }

    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const requiresResearcherRole = pathMatches(pathname, RESEARCHER_ONLY_PATHS)
    const requiresStudentRole = pathMatches(pathname, STUDENT_ONLY_PATHS)
    const shouldRedirectResearcherFromLanding = pathname === '/' && !!session

    if (!(requiresResearcherRole || requiresStudentRole || shouldRedirectResearcherFromLanding)) {
        return NextResponse.next()
    }

    const role = await fetchUserRole(session?.value)

    if (requiresResearcherRole && role !== 'RESEARCHER') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    if (requiresStudentRole && role !== 'STUDENT') {
        return NextResponse.redirect(new URL('/my-posts', request.url))
    }

    if (shouldRedirectResearcherFromLanding && role === 'RESEARCHER') {
        return NextResponse.redirect(new URL('/my-posts', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
