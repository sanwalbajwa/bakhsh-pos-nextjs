import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManageProducts = (role) => role === 'admin' || role === 'pharmacist'

const normalizeProductPayload = (body = {}) => {
    return {
        name: body.name,
        generic_name: body.generic_name || null,
        sku: body.sku,
        barcode: body.barcode || null,
        description: body.description || null,
        price: Number(body.price),
        cost_price: body.cost_price === null || body.cost_price === '' ? null : Number(body.cost_price),
        stock: Number(body.stock),
        reorder_level: Number(body.reorder_level),
        unit: body.unit,
        manufacturer: body.manufacturer || null,
        category: body.category || 'Medicine',
        expiry_date: body.expiry_date || null,
        is_active: Boolean(body.is_active),
    }
}

const validateProductPayload = (payload) => {
    if (!payload.name || !payload.sku || !payload.unit) return 'Name, SKU, and unit are required.'
    if (!Number.isFinite(payload.price)) return 'Price must be a valid number.'
    if (!Number.isInteger(payload.stock)) return 'Stock must be an integer.'
    if (!Number.isInteger(payload.reorder_level)) return 'Reorder level must be an integer.'
    return null
}

export async function GET(request) {
    try {
        const { user, error: authError } = await getAuthenticatedUser(request)
        if (authError || !user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { role, error: roleError } = await getUserRole(user.id)
        if (roleError) {
            return Response.json({ success: false, error: 'Unable to resolve user role' }, { status: 500 })
        }

        if (!canManageProducts(role)) {
            return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        return Response.json({ success: true, data: data || [] })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { user, error: authError } = await getAuthenticatedUser(request)
        if (authError || !user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { role, error: roleError } = await getUserRole(user.id)
        if (roleError) {
            return Response.json({ success: false, error: 'Unable to resolve user role' }, { status: 500 })
        }

        if (!canManageProducts(role)) {
            return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const payload = normalizeProductPayload(body)
        const validationError = validateProductPayload(payload)
        if (validationError) {
            return Response.json({ success: false, error: validationError }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert([payload])
            .select('*')
            .single()

        if (error) {
            return Response.json({ success: false, error: error.message }, { status: 500 })
        }

        return Response.json({ success: true, data })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
