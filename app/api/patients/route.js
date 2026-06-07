import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManageCare = (role) => ['admin', 'doctor', 'pharmacist'].includes(role)

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
    if (!canManageCare(role)) return { error: 'Forbidden', status: 403 }

    return { user, role, error: null, status: 200 }
}

export async function GET(request) {
    try {
        const auth = await ensureAuthorized(request)
        if (auth.error) return Response.json({ success: false, error: auth.error }, { status: auth.status })

        const { data, error } = await supabaseAdmin
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false })

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
        const payload = {
            name: String(body.name || '').trim(),
            phone: String(body.phone || '').trim(),
            age: body.age ? Number(body.age) : null,
            gender: body.gender || null,
            address: body.address ? String(body.address).trim() : null,
            allergies: body.allergies ? String(body.allergies).trim() : null,
            notes: body.notes ? String(body.notes).trim() : null,
            created_by: auth.user.id,
        }

        if (!payload.name || !payload.phone) {
            return Response.json({ success: false, error: 'Patient name and phone are required.' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('patients')
            .insert([payload])
            .select('*')
            .single()

        if (error) return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        return Response.json({ success: true, data })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
