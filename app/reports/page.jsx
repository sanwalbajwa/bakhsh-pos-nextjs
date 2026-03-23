'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import {
    FileBarChart,
    TrendingUp,
    CalendarRange,
    Download,
    Package,
    Users,
    DollarSign,
    ShoppingCart,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ReportsPage() {
    const { getAccessToken } = useAuth()
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

    const [salesData, setSalesData] = useState([])
    const [productsData, setProductsData] = useState([])
    const [customersData, setCustomersData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const apiRequest = useCallback(
        async (url, options = {}) => {
            const token = await getAccessToken()
            if (!token) throw new Error('Authentication required')

            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {}),
                },
                cache: 'no-store',
            })

            const payload = await response.json().catch(() => ({}))
            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.error || 'Request failed')
            }
            return payload
        },
        [getAccessToken]
    )

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const [salesPayload, productsPayload, customersPayload] = await Promise.all([
                apiRequest('/api/transactions'),
                apiRequest('/api/products'),
                apiRequest('/api/customers'),
            ])

            setSalesData(salesPayload?.data || [])
            setProductsData(productsPayload?.data || [])
            setCustomersData(customersPayload?.data || [])
        } catch (err) {
            console.error('Error fetching report data:', err)
            setError(err.message || 'Failed to fetch report data')
        } finally {
            setLoading(false)
        }
    }, [apiRequest])

    useEffect(() => {
        fetchReportData()
    }, [fetchReportData])

    // Filter data by date range
    const filteredSales = salesData.filter((t) => {
        const txDate = new Date(t.created_at).toISOString().split('T')[0]
        return txDate >= startDate && txDate <= endDate
    })

    // Sales Performance Calculations
    const salesMetrics = {
        totalRevenue: filteredSales.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0),
        totalTransactions: filteredSales.length,
        avgOrderValue: filteredSales.length > 0 ? filteredSales.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0) / filteredSales.length : 0,
        totalDiscount: filteredSales.reduce((sum, t) => sum + (parseFloat(t.discount) || 0), 0),
    }

    // Payment Method Breakdown
    const paymentMethods = {}
    filteredSales.forEach((t) => {
        const method = t.payment_method || 'unknown'
        paymentMethods[method] = (paymentMethods[method] || 0) + (parseFloat(t.total) || 0)
    })

    // Top Selling Products
    const productSales = {}
    filteredSales.forEach((t) => {
        const productId = t.product_id
        if (!productSales[productId]) {
            productSales[productId] = { name: t.product_name || 'Unknown', qty: 0, revenue: 0 }
        }
        productSales[productId].qty += parseInt(t.quantity) || 0
        productSales[productId].revenue += parseFloat(t.total) || 0
    })

    const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

    // Inventory Metrics
    const inventoryMetrics = {
        totalProducts: productsData.length,
        activeProducts: productsData.filter((p) => p.is_active).length,
        lowStockItems: productsData.filter((p) => (p.stock || 0) < (p.reorder_level || 10)).length,
        totalValuation: productsData.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost_price || p.price || 0)), 0),
    }

    // Customer Analytics
    const customerMetrics = {
        totalCustomers: customersData.length,
        activeCustomers: customersData.filter((c) => {
            const hasRecent = filteredSales.some((t) => t.customer_id === c.id)
            return hasRecent
        }).length,
        avgCustomerValue: 0,
    }

    if (customerMetrics.activeCustomers > 0) {
        const activeCustomerIds = new Set(
            filteredSales.filter((t) => t.customer_id).map((t) => t.customer_id)
        )
        const activeRevenue = filteredSales
            .filter((t) => activeCustomerIds.has(t.customer_id))
            .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0)
        customerMetrics.avgCustomerValue = activeRevenue / activeCustomerIds.size || 0
    }

    // Top Customers
    const customerSales = {}
    filteredSales.forEach((t) => {
        if (t.customer_id) {
            if (!customerSales[t.customer_id]) {
                customerSales[t.customer_id] = { name: t.customer_name || 'Unknown', purchases: 0, total: 0 }
            }
            customerSales[t.customer_id].purchases += 1
            customerSales[t.customer_id].total += parseFloat(t.total) || 0
        }
    })

    const topCustomers = Object.entries(customerSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

    const exportToCSV = (data, filename, headers) => {
        const csvContent = [
            headers.join(','),
            ...data.map((row) => headers.map((h) => {
                const value = row[h] || ''
                const escaped = String(value).includes(',') ? `"${value}"` : value
                return escaped
            }).join(',')),
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-2">Track business insights and performance summaries.</p>
                    </div>

                    {/* Date Range Filter */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={fetchReportData}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
                    )}

                    {/* Sales Performance Report */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Sales Performance</h2>
                            </div>
                            <button
                                onClick={() => exportToCSV(
                                    filteredSales.map(t => ({ Date: t.created_at?.split('T')[0], Product: t.product_name, Quantity: t.quantity, 'Unit Price': t.unit_price, Discount: t.discount, Total: t.total, 'Payment Method': t.payment_method })),
                                    'sales-report',
                                    ['Date', 'Product', 'Quantity', 'Unit Price', 'Discount', 'Total', 'Payment Method']
                                )}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {salesMetrics.totalRevenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Transactions</p>
                                <p className="text-2xl font-bold text-gray-900">{salesMetrics.totalTransactions}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {salesMetrics.avgOrderValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Discount</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {salesMetrics.totalDiscount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Payment Method Breakdown */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="space-y-3">
                                    {Object.entries(paymentMethods).map(([method, amount]) => (
                                        <div key={method} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${salesMetrics.totalRevenue > 0 ? (amount / salesMetrics.totalRevenue) * 100 : 0}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 w-24 text-right">Rs {amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Selling Products */}
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Products</h3>
                                <div className="space-y-3">
                                    {topProducts.length > 0 ? (
                                        topProducts.map((product, idx) => (
                                            <div key={product.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-700 w-6">#{idx + 1}</span>
                                                    <span className="text-sm text-gray-700">{product.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900">Rs {product.revenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                                                    <p className="text-xs text-gray-500">{product.qty} units</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No sales data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Report */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Package className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Inventory Status</h2>
                            </div>
                            <button
                                onClick={() => exportToCSV(
                                    productsData.map(p => ({ SKU: p.sku, Name: p.name, Stock: p.stock, 'Reorder Level': p.reorder_level, Cost: p.cost_price, Price: p.price, Valuation: ((p.stock || 0) * (p.cost_price || p.price || 0)).toFixed(2) })),
                                    'inventory-report',
                                    ['SKU', 'Name', 'Stock', 'Reorder Level', 'Cost', 'Price', 'Valuation']
                                )}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900">{inventoryMetrics.totalProducts}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Active Products</p>
                                <p className="text-2xl font-bold text-gray-900">{inventoryMetrics.activeProducts}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                                <p className="text-2xl font-bold text-red-600">{inventoryMetrics.lowStockItems}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Valuation</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {inventoryMetrics.totalValuation.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>

                        {/* Low Stock Products Table */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Products</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="border-b border-gray-200">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Product Name</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Reorder Level</th>
                                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productsData
                                            .filter((p) => (p.stock || 0) < (p.reorder_level || 10))
                                            .map((product) => (
                                                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-gray-900">{product.sku}</td>
                                                    <td className="py-3 px-4 text-gray-900">{product.name}</td>
                                                    <td className="py-3 px-4 text-right text-gray-900 font-semibold">{product.stock || 0}</td>
                                                    <td className="py-3 px-4 text-right text-gray-600">{product.reorder_level || 10}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                            Critical
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                {productsData.filter((p) => (p.stock || 0) < (p.reorder_level || 10)).length === 0 && (
                                    <p className="text-center py-4 text-gray-500">All products have healthy stock levels</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Customer Analytics Report */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Customer Analytics</h2>
                            </div>
                            <button
                                onClick={() => exportToCSV(
                                    customersData.map(c => ({ Name: c.name, Phone: c.phone, Email: c.email || '', 'Joined On': c.created_at?.split('T')[0] })),
                                    'customers-report',
                                    ['Name', 'Phone', 'Email', 'Joined On']
                                )}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{customerMetrics.totalCustomers}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Active (This Period)</p>
                                <p className="text-2xl font-bold text-gray-900">{customerMetrics.activeCustomers}</p>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <p className="text-sm text-gray-600 mb-1">Avg. Customer Value</p>
                                <p className="text-2xl font-bold text-gray-900">Rs {customerMetrics.avgCustomerValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>

                        {/* Top Customers Table */}
                        {topCustomers.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="border-b border-gray-200">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer Name</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Purchases</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Spent</th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg. Per Order</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topCustomers.map((customer, idx) => (
                                                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-4 text-gray-900 font-medium">{customer.name}</td>
                                                    <td className="py-3 px-4 text-right text-gray-900">{customer.purchases}</td>
                                                    <td className="py-3 px-4 text-right text-gray-900 font-semibold">Rs {customer.total.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                                                    <td className="py-3 px-4 text-right text-gray-600">Rs {(customer.total / customer.purchases).toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
