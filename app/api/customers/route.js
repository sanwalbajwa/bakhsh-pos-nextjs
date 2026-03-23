import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManagePOS = (role) => role === 'admin' || role === 'pharmacist'

const normalizeCustomerPayload = (body = {}) => ({
    name: String(body.name || '').trim(),
    phone: String(body.phone || '').trim(),
    email: body.email ? String(body.email).trim() : null,
})

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing required tables. Run supabase/setup.sql in Supabase SQL Editor.'
    }
    return error?.message || fallback
}

const validateCustomerPayload = (payload) => {
    if (!payload.name) return 'Customer name is required.'
    if (!payload.phone) return 'Phone is required.'
    return null
}

async function ensureAuthorized(request) {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) {
        return { user: null, role: null, error: 'Unauthorized', status: 401 }
    }

    const { role, error: roleError } = await getUserRole(user.id)
    if (roleError) {
        return { user: null, role: null, error: 'Unable to resolve user role', status: 500 }
    }

    if (!canManagePOS(role)) {
        return { user: null, role: null, error: 'Forbidden', status: 403 }
    }

    return { user, role, error: null, status: 200 }
}

export async function GET(request) {
    try {
        const auth = await ensureAuthorized(request)
        if (auth.error) {
            return Response.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const { data, error } = await supabaseAdmin
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        }

        return Response.json({ success: true, data: data || [] })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const auth = await ensureAuthorized(request)
        if (auth.error) {
            return Response.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const body = await request.json()
        const payload = normalizeCustomerPayload(body)
        const validationError = validateCustomerPayload(payload)
        if (validationError) {
            return Response.json({ success: false, error: validationError }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('customers')
            .insert([{ ...payload, created_by: auth.user.id }])
            .select('*')
            .single()

        if (error) {
            const isDuplicatePhone = error.code === '23505' && error.message.toLowerCase().includes('phone')
            return Response.json(
                { success: false, error: isDuplicatePhone ? 'A customer with this phone already exists.' : mapDbError(error) },
                { status: isDuplicatePhone ? 409 : 500 }
            )
        }

        return Response.json({ success: true, data })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
