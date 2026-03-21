'use client'

import { useState, useEffect } from 'react'
import { Package, DollarSign, AlertTriangle, Users, TrendingUp, Clock } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProducts: 0,
        lowStockCount: 0,
        lowStockProducts: [],
        totalUsers: 0,
        recentSales: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard')
            const result = await response.json()
            
            if (result.success) {
                setStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const StatCard = ({ icon: Icon, title, value, color, subtext }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
                </div>
                <div className={`p-4 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-2">Welcome back! Here&apos;s what&apos;s happening today.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon={DollarSign}
                            title="Total Revenue"
                            value={`Rs ${stats.totalRevenue.toLocaleString()}`}
                            color="bg-green-500"
                            subtext="All time sales"
                        />
                        <StatCard
                            icon={Package}
                            title="Total Products"
                            value={stats.totalProducts}
                            color="bg-blue-500"
                            subtext="Active products"
                        />
                        <StatCard
                            icon={AlertTriangle}
                            title="Low Stock"
                            value={stats.lowStockCount}
                            color="bg-orange-500"
                            subtext="Need reordering"
                        />
                        <StatCard
                            icon={Users}
                            title="Total Users"
                            value={stats.totalUsers}
                            color="bg-purple-500"
                            subtext="Admin & Pharmacists"
                        />
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Sales */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Recent Sales
                                </h2>
                                <span className="text-sm text-gray-500">Last 7 days</span>
                            </div>
                            
                            {stats.recentSales.length > 0 ? (
                                <div className="space-y-4">
                                    {stats.recentSales.map((sale, index) => (
                                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                            <div>
                                                <p className="font-medium text-gray-900">Sale #{sale.id}</p>
                                                <p className="text-sm text-gray-500">{sale.date}</p>
                                            </div>
                                            <span className="font-bold text-green-600">Rs {sale.total}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No sales recorded yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Sales will appear here once transactions are made</p>
                                </div>
                            )}
                        </div>

                        {/* Low Stock Alert */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                    Low Stock Alert
                                </h2>
                                <span className="text-sm text-gray-500">{stats.lowStockCount} items</span>
                            </div>
                            
                            {stats.lowStockProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.lowStockProducts.slice(0, 5).map((product) => (
                                        <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Reorder level: {product.reorder_level}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-block px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                                                    {product.stock} left
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {stats.lowStockProducts.length > 5 && (
                                        <button className="w-full text-center text-sm text-primary hover:text-secondary font-medium py-2">
                                            View all {stats.lowStockProducts.length} low stock items -&gt;
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 text-green-300 mx-auto mb-3" />
                                    <p className="text-gray-500">All products are well stocked!</p>
                                    <p className="text-sm text-gray-400 mt-1">You&apos;ll see alerts here when stock runs low</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
