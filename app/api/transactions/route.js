import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

const canManagePOS = (role) => role === 'admin' || role === 'pharmacist'

const normalizeTransactionPayload = (body = {}) => ({
    product_id: body.productId,
    customer_id: body.customerId || null,
    customer_name: body.customerName ? String(body.customerName).trim() : null,
    quantity: Number(body.quantity),
    discount: Number(body.discount || 0),
    payment_method: String(body.paymentMethod || 'cash').toLowerCase(),
    notes: body.notes ? String(body.notes).trim() : null,
})

const normalizeCartPayload = (body = {}) => {
    const shared = {
        customer_id: body.customerId || null,
        customer_name: body.customerName ? String(body.customerName).trim() : null,
        payment_method: String(body.paymentMethod || 'cash').toLowerCase(),
        notes: body.notes ? String(body.notes).trim() : null,
    }

    const items = Array.isArray(body.items) ? body.items : []
    return items.map((item) => ({
        ...shared,
        product_id: item.productId,
        quantity: Number(item.quantity),
        discount: Number(item.discount || 0),
    }))
}

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing required tables. Run supabase/setup.sql in Supabase SQL Editor.'
    }
    if (error?.code === '42883' || error?.message?.includes('process_pos_sale')) {
        return 'Missing POS checkout function. Run supabase/healthcare-pos.sql in Supabase SQL Editor.'
    }
    return error?.message || fallback
}

const validateTransactionPayload = (payload) => {
    if (!payload.product_id) return 'Product is required.'
    if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) return 'Quantity must be a positive integer.'
    if (!Number.isFinite(payload.discount) || payload.discount < 0) return 'Discount must be zero or greater.'
    if (!['cash', 'card', 'bank_transfer', 'wallet', 'credit'].includes(payload.payment_method)) {
        return 'Invalid payment method.'
    }
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
            .from('transactions')
            .select(`
                id,
                product_id,
                customer_id,
                customer_name,
                quantity,
                unit_price,
                discount,
                total,
                payment_method,
                notes,
                created_at,
                products ( id, name, unit )
            `)
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
        const cartPayload = Array.isArray(body.items) && body.items.length > 0
            ? normalizeCartPayload(body)
            : [normalizeTransactionPayload(body)]

        if (cartPayload.length === 0) {
            return Response.json({ success: false, error: 'At least one sale item is required.' }, { status: 400 })
        }

        for (const payload of cartPayload) {
            const validationError = validateTransactionPayload(payload)
            if (validationError) {
                return Response.json({ success: false, error: validationError }, { status: 400 })
            }
        }

        const { data, error } = await supabaseAdmin.rpc('process_pos_sale', {
            sale_items: cartPayload.map((payload) => ({
                productId: payload.product_id,
                quantity: payload.quantity,
                discount: payload.discount,
            })),
            sale_customer_id: cartPayload[0]?.customer_id || null,
            sale_customer_name: cartPayload[0]?.customer_name || null,
            sale_payment_method: cartPayload[0]?.payment_method || 'cash',
            sale_notes: cartPayload[0]?.notes || null,
            sale_created_by: auth.user.id,
        })

        if (error) {
            return Response.json({ success: false, error: mapDbError(error) }, { status: 500 })
        }

        const createdTransactions = Array.isArray(data) ? data : []

        return Response.json({
            success: true,
            data: createdTransactions.length === 1 ? createdTransactions[0] : createdTransactions,
        })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
