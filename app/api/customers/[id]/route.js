import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManagePOS = (role) => role === 'admin' || role === 'pharmacist'

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing required tables. Run supabase/setup.sql in Supabase SQL Editor.'
    }
    return error?.message || fallback
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

export async function DELETE(request, { params }) {
    try {
        const auth = await ensureAuthorized(request)
        if (auth.error) {
            return Response.json({ success: false, error: auth.error }, { status: auth.status })
        }

        const customerId = params?.id
        if (!customerId) {
            return Response.json({ success: false, error: 'Missing customer id' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('customers')
            .delete()
            .eq('id', customerId)

        if (error) {
            return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        }

        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
