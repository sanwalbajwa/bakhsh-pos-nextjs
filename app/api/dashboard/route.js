import { getAuthenticatedUser, getUserRole, supabaseAdmin } from '@/lib/serverAuth'

export async function GET(request) {
    try {
        const { user, error: authError } = await getAuthenticatedUser(request)
        if (authError || !user) {
            return Response.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { role, error: roleError } = await getUserRole(user.id)
        if (roleError) {
            return Response.json(
                { success: false, error: 'Unable to resolve user role' },
                { status: 500 }
            )
        }

        if (role !== 'admin' && role !== 'pharmacist') {
            return Response.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Get active products for stock metrics
        const { data: activeProducts, error: productsError } = await supabaseAdmin
            .from('products')
            .select('id, name, stock, reorder_level')
            .eq('is_active', true)
        if (productsError) {
            console.error('Dashboard products query failed:', productsError)
        }

        const sortedProducts = [...(activeProducts || [])].sort((a, b) => a.stock - b.stock)
        const lowStockProducts = sortedProducts.filter((product) => product.stock <= product.reorder_level)
        const totalProducts = activeProducts?.length || 0

        // Get total users count
        const { count: totalUsers, error: usersError } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
        if (usersError) {
            console.error('Dashboard profiles query failed:', usersError)
        }

        const { data: transactions, error: transactionsError } = await supabaseAdmin
            .from('transactions')
            .select('id, total, created_at, products ( name )')
            .order('created_at', { ascending: false })
        if (transactionsError) {
            console.error('Dashboard transactions query failed:', transactionsError)
        }

        const { data: returns, error: returnsError } = await supabaseAdmin
            .from('returns')
            .select('amount, created_at, status')
            .eq('status', 'completed')
        if (returnsError && returnsError.code !== '42P01') {
            console.error('Dashboard returns query failed:', returnsError)
        }

        const grossRevenue = (transactions || []).reduce(
            (sum, transaction) => sum + Number(transaction.total || 0),
            0
        )
        const returnedRevenue = (returns || []).reduce(
            (sum, item) => sum + Number(item.amount || 0),
            0
        )
        const totalRevenue = Math.max(grossRevenue - returnedRevenue, 0)

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentSales = (transactions || [])
            .filter((transaction) => new Date(transaction.created_at) >= sevenDaysAgo)
            .slice(0, 8)
            .map((transaction) => ({
                id: transaction.id,
                productName: transaction.products?.name || 'Sale',
                date: new Date(transaction.created_at).toLocaleDateString('en-PK'),
                total: Number(transaction.total || 0).toLocaleString('en-PK', {
                    maximumFractionDigits: 0,
                }),
            }))

        return Response.json({
            success: true,
            data: {
                totalRevenue,
                totalProducts: totalProducts || 0,
                lowStockCount: lowStockProducts?.length || 0,
                lowStockProducts: lowStockProducts || [],
                totalUsers: totalUsers || 0,
                recentSales
            }
        })
    } catch (error) {
        console.error('Dashboard API Error:', error)
        return Response.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
