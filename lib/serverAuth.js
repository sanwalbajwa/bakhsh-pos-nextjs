import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
}

if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
})

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
})

const readBearerToken = (request) => {
    const authHeader = request.headers.get('authorization') || ''
    if (authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice(7).trim()
    }

    // Fallback for requests that rely on cookie-based forwarding.
    return request.cookies.get('sb-access-token')?.value || null
}

export async function getAuthenticatedUser(request) {
    const token = readBearerToken(request)
    if (!token) {
        return { user: null, error: 'Missing access token' }
    }

    const { data, error } = await authClient.auth.getUser(token)
    if (error || !data?.user) {
        return { user: null, error: error?.message || 'Invalid access token' }
    }

    return { user: data.user, error: null }
}

export async function getUserRole(userId) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        return { role: null, error: error.message }
    }

    return { role: data?.role || null, error: null }
}