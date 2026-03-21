import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
    try {
        // Get active products for stock metrics
        const { data: activeProducts, error: productsError } = await supabase
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
        const { count: totalUsers, error: usersError } = await supabase
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
