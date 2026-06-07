import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManageReturns = (role) => ['admin', 'pharmacist'].includes(role)

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing returns table. Run supabase/healthcare-pos.sql in Supabase SQL Editor.'
    }
    if (error?.code === '42883' || error?.message?.includes('process_pos_return')) {
        return 'Missing POS return function. Run supabase/healthcare-pos.sql in Supabase SQL Editor.'
    }
    return error?.message || fallback
}

async function ensureAuthorized(request) {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) return { error: 'Unauthorized', status: 401 }

    const { role, error: roleError } = await getUserRole(user.id)
    if (roleError) return { error: 'Unable to resolve user role', status: 500 }
    if (!canManageReturns(role)) return { error: 'Forbidden', status: 403 }

    return { user, role, error: null, status: 200 }
}

export async function GET(request) {
    try {
        const auth = await ensureAuthorized(request)
        if (auth.error) return Response.json({ success: false, error: auth.error }, { status: auth.status })

        const { data, error } = await supabaseAdmin
            .from('returns')
            .select('id, transaction_id, product_id, quantity, amount, reason, status, created_at')
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
        if (auth.error) return Response.json({ success: false, error: auth.error }, { status: auth.status })

        const body = await request.json()
        const transactionId = body.transactionId
        const reason = String(body.reason || '').trim()
        if (!transactionId || !reason) {
            return Response.json({ success: false, error: 'Transaction and return reason are required.' }, { status: 400 })
        }

        const { data: createdReturn, error } = await supabaseAdmin.rpc('process_pos_return', {
            return_transaction_id: transactionId,
            return_reason: reason,
            return_created_by: auth.user.id,
        })

        if (error) {
            return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        }

        return Response.json({ success: true, data: createdReturn })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
