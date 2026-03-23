import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const VALID_ROLES = ['admin', 'pharmacist', 'doctor']

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing required tables. Run supabase/setup.sql in Supabase SQL Editor.'
    }
    return error?.message || fallback
}

async function ensureAdmin(request) {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
        return { user: null, error: 'Unauthorized', status: 401 }
    }

    const { role, error: roleError } = await getUserRole(user.id)
    if (roleError) {
        return { user: null, error: 'Unable to resolve user role', status: 500 }
    }

    if (role !== 'admin') {
        return { user: null, error: 'Forbidden – admin access required', status: 403 }
    }

    return { user, error: null, status: 200 }
}

// GET – list all users (profiles joined with auth metadata)
export async function GET(request) {
    try {
        const auth = await ensureAdmin(request)
        if (auth.error) {
            return Response.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, role, created_at')
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        }

        return Response.json({ success: true, data: data || [] })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}

// POST – create a new user (auth user + profile row)
export async function POST(request) {
    try {
        const auth = await ensureAdmin(request)
        if (auth.error) {
            return Response.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const body = await request.json()
        const name = String(body.name || '').trim()
        const email = String(body.email || '').trim().toLowerCase()
        const password = String(body.password || '')
        const role = String(body.role || '').toLowerCase()

        if (!name) {
            return Response.json({ success: false, error: 'Name is required.' }, { status: 400 })
        }
        if (!email) {
            return Response.json({ success: false, error: 'Email is required.' }, { status: 400 })
        }
        if (!password || password.length < 6) {
            return Response.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 })
        }
        if (!VALID_ROLES.includes(role)) {
            return Response.json({ success: false, error: `Role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
        }

        // 1. Create auth user via Supabase Admin API
        const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // auto-confirm so they can log in immediately
            user_metadata: { full_name: name, role },
            app_metadata: { role },
        })

        if (authCreateError) {
            const msg = authCreateError.message || 'Failed to create auth user.'
            const isDuplicate = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')
            return Response.json(
                { success: false, error: isDuplicate ? 'A user with this email already exists.' : msg },
                { status: isDuplicate ? 409 : 500 }
            )
        }

        const newUserId = authData?.user?.id
        if (!newUserId) {
            return Response.json({ success: false, error: 'Auth user created but no ID returned.' }, { status: 500 })
        }

        // 2. Insert matching profile row
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert([{ id: newUserId, name, email, role }], { onConflict: 'id' })
            .select('*')
            .single()

        if (profileError) {
            // Attempt cleanup – delete the orphaned auth user
            await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {})
            return Response.json({ success: false, error: mapDbError(profileError) }, { status: 500 })
        }

        return Response.json({ success: true, data: profile })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}