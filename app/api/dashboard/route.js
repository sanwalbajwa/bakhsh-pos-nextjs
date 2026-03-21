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

        if (role !== 'admin') {
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

        // TODO: Get total revenue from sales table (will implement when we create sales)
        const totalRevenue = 0

        // TODO: Get recent sales (will implement when we create sales)
        const recentSales = []

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
