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

const mapDbError = (error, fallback = 'Database request failed.') => {
    if (error?.code === '42P01') {
        return 'Missing required tables. Run supabase/setup.sql in Supabase SQL Editor.'
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
        const payload = normalizeTransactionPayload(body)
        const validationError = validateTransactionPayload(payload)
        if (validationError) {
            return Response.json({ success: false, error: validationError }, { status: 400 })
        }

        const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('id, name, stock, unit, price, is_active')
            .eq('id', payload.product_id)
            .single()

        if (productError || !product) {
            return Response.json({ success: false, error: 'Product not found.' }, { status: 404 })
        }

        if (!product.is_active) {
            return Response.json({ success: false, error: 'Selected product is inactive.' }, { status: 400 })
        }

        if (payload.quantity > product.stock) {
            return Response.json({ success: false, error: `Only ${product.stock} ${product.unit} available.` }, { status: 400 })
        }

        const unitPrice = Number(product.price)
        const grossTotal = unitPrice * payload.quantity
        const total = Math.max(grossTotal - payload.discount, 0)

        const { data: createdTx, error: txError } = await supabaseAdmin
            .from('transactions')
            .insert([{
                product_id: payload.product_id,
                customer_id: payload.customer_id,
                customer_name: payload.customer_name || null,
                quantity: payload.quantity,
                unit_price: unitPrice,
                discount: payload.discount,
                total,
                payment_method: payload.payment_method,
                notes: payload.notes,
                created_by: auth.user.id,
            }])
            .select('*')
            .single()

        if (txError) {
            return Response.json({ success: false, error: mapDbError(txError) }, { status: 500 })
        }

        const { error: stockError } = await supabaseAdmin
            .from('products')
            .update({ stock: product.stock - payload.quantity })
            .eq('id', payload.product_id)

        if (stockError) {
            await supabaseAdmin.from('transactions').delete().eq('id', createdTx.id)
            return Response.json({ success: false, error: mapDbError(stockError) }, { status: 500 })
        }

        return Response.json({
            success: true,
            data: {
                ...createdTx,
                product_name: product.name,
                product_unit: product.unit,
            },
        })
    } catch (error) {
        return Response.json({ success: false, error: error.message || 'Unexpected server error' }, { status: 500 })
    }
}
