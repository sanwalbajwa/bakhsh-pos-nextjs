import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManageAppointments = (role) => ['admin', 'doctor'].includes(role)

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing healthcare tables. Run supabase/healthcare-pos.sql in Supabase SQL Editor.'
    }
    return error?.message || fallback
}

async function ensureAuthorized(request) {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (authError || !user) return { error: 'Unauthorized', status: 401 }

    const { role, error: roleError } = await getUserRole(user.id)
    if (roleError) return { error: 'Unable to resolve user role', status: 500 }
    if (!canManageAppointments(role)) return { error: 'Forbidden', status: 403 }

    return { user, role, error: null, status: 200 }
}

export async function GET(request) {
    try {
        const auth = await ensureAuthorized(request)
        if (auth.error) return Response.json({ success: false, error: auth.error }, { status: auth.status })

        const { data, error } = await supabaseAdmin
            .from('appointments')
            .select('*, patients ( id, name, phone )')
            .order('scheduled_at', { ascending: true })

        if (error) return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
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
        if (!body.patientId || !body.scheduledAt) {
            return Response.json({ success: false, error: 'Patient and scheduled date/time are required.' }, { status: 400 })
        }

        const payload = {
            patient_id: body.patientId,
            scheduled_at: body.scheduledAt,
            reason: body.reason ? String(body.reason).trim() : null,
            status: body.status || 'scheduled',
            created_by: auth.user.id,
        }

        const { data, error } = await supabaseAdmin
            .from('appointments')
            .insert([payload])
            .select('*, patients ( id, name, phone )')
            .single()

        if (error) return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        return Response.json({ success: true, data })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
