import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const protectedPrefixes = ['/dashboard', '/products', '/reports', '/pos', '/doctor']

const isProtectedPath = (pathname) => {
    return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

const buildAuthClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) return null
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
}

export async function middleware(request) {
    const { pathname } = request.nextUrl
    const needsAuth = isProtectedPath(pathname)
    const isLoginPage = pathname === '/login'

    if (!needsAuth && !isLoginPage) {
        return NextResponse.next()
    }

    const token = request.cookies.get('sb-access-token')?.value
    let isAuthenticated = false

    if (token) {
        const supabase = buildAuthClient()
        if (supabase) {
            const { data, error } = await supabase.auth.getUser(token)
            isAuthenticated = !!data?.user && !error
        }
    }

    if (needsAuth && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    if (isLoginPage && isAuthenticated) {
        const dashboardUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/login', '/dashboard/:path*', '/products/:path*', '/reports/:path*', '/pos/:path*', '/doctor/:path*'],
}