'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import ProductModal from '@/components/ProductModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import {
    ShoppingCart,
    History,
    Package,
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    AlertTriangle,
    CheckCircle,
    UserPlus,
    Printer,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { printReceipt } from '@/lib/printReceipt'

export default function POSPage() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const { getAccessToken } = useAuth()

    const [products, setProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(false)
    const [productsError, setProductsError] = useState('')

    const [transactions, setTransactions] = useState([])
    const [transactionsLoading, setTransactionsLoading] = useState(false)
    const [transactionsError, setTransactionsError] = useState('')

    const [customers, setCustomers] = useState([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [customersError, setCustomersError] = useState('')

    const [saleForm, setSaleForm] = useState({
        productSearch: '',
        productId: '',
        quantity: '1',
        customerId: '',
        customerName: '',
        paymentMethod: 'cash',
        discount: '0',
        notes: '',
    })
    const [saleLoading, setSaleLoading] = useState(false)
    const [saleError, setSaleError] = useState('')

    const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' })
    const [customerLoading, setCustomerLoading] = useState(false)
    const [customerError, setCustomerError] = useState('')

    const [inventorySearchTerm, setInventorySearchTerm] = useState('')
    const [showProductModal, setShowProductModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [deletingProduct, setDeletingProduct] = useState(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState('')

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: ShoppingCart },
        { id: 'transactions', label: 'Transactions', icon: History },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'customers', label: 'Customers', icon: Users },
    ]
    const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label || 'Dashboard'

    const withTimeout = (promise, timeoutMs = 12000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout. Please check your network or permissions.')), timeoutMs)
            }),
        ])
    }

    const apiRequest = useCallback(async (url, options = {}) => {
        const token = await getAccessToken()
        if (!token) {
            throw new Error('Authentication required')
        }

        const response = await withTimeout(
            fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {}),
                },
                cache: 'no-store',
            })
        )

        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.success === false) {
            throw new Error(payload?.error || 'Request failed')
        }

        return payload
    }, [getAccessToken])

    const fetchProducts = useCallback(async () => {
        try {
            setProductsLoading(true)
            setProductsError('')
            const payload = await apiRequest('/api/products')
            setProducts(payload?.data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
            setProducts([])
            setProductsError(error.message || 'Failed to fetch products')
        } finally {
            setProductsLoading(false)
        }
    }, [apiRequest])

    const fetchTransactions = useCallback(async () => {
        try {
            setTransactionsLoading(true)
            setTransactionsError('')
            const payload = await apiRequest('/api/transactions')
            setTransactions(payload?.data || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
            setTransactions([])
            setTransactionsError(error.message || 'Failed to fetch transactions')
        } finally {
            setTransactionsLoading(false)
        }
    }, [apiRequest])

    const fetchCustomers = useCallback(async () => {
        try {
            setCustomersLoading(true)
            setCustomersError('')
            const payload = await apiRequest('/api/customers')
            setCustomers(payload?.data || [])
        } catch (error) {
            console.error('Error fetching customers:', error)
            setCustomers([])
            setCustomersError(error.message || 'Failed to fetch customers')
        } finally {
            setCustomersLoading(false)
        }
    }, [apiRequest])

    useEffect(() => {
        fetchProducts()
        fetchTransactions()
        fetchCustomers()
    }, [fetchProducts, fetchTransactions, fetchCustomers])

    const activeProducts = useMemo(
        () => products.filter((item) => item.is_active),
        [products]
    )

    const matchedProducts = useMemo(() => {
        const query = saleForm.productSearch.trim().toLowerCase()
        if (!query) return activeProducts.slice(0, 8)

        return activeProducts
            .filter((item) =>
                item.name?.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query) ||
                item.generic_name?.toLowerCase().includes(query)
            )
            .slice(0, 8)
    }, [activeProducts, saleForm.productSearch])

    const selectedProduct = useMemo(
        () => activeProducts.find((item) => String(item.id) === String(saleForm.productId)),
        [activeProducts, saleForm.productId]
    )

    const saleQuantity = Math.max(parseInt(saleForm.quantity || '0', 10) || 0, 0)
    const saleDiscount = Math.max(parseFloat(saleForm.discount || '0') || 0, 0)
    const saleSubTotal = selectedProduct ? Number(selectedProduct.price || 0) * saleQuantity : 0
    const saleTotal = Math.max(saleSubTotal - saleDiscount, 0)

    const inventoryProducts = useMemo(() => {
        return products.filter((product) =>
            product.name?.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
            product.generic_name?.toLowerCase().includes(inventorySearchTerm.toLowerCase())
        )
    }, [products, inventorySearchTerm])

    const closeProductModal = () => {
        setShowProductModal(false)
        setEditingProduct(null)
        setModalError('')
    }

    const closeDeleteModal = () => {
        setShowDeleteModal(false)
        setDeletingProduct(null)
        setModalError('')
    }

    const handleAddProduct = async (formData) => {
        try {
            setModalLoading(true)
            setModalError('')

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
                stock: parseInt(formData.stock, 10),
                reorder_level: parseInt(formData.reorder_level, 10),
                expiry_date: formData.expiry_date || null,
            }

            await apiRequest('/api/products', {
                method: 'POST',
                body: JSON.stringify(payload),
            })

            await fetchProducts()
            closeProductModal()
        } catch (error) {
            console.error('Add product error:', error)
            setModalError(error.message || 'Failed to add product')
        } finally {
            setModalLoading(false)
        }
    }

    const handleUpdateProduct = async (formData) => {
        if (!editingProduct?.id) return

        try {
            setModalLoading(true)
            setModalError('')

            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
                stock: parseInt(formData.stock, 10),
                reorder_level: parseInt(formData.reorder_level, 10),
                expiry_date: formData.expiry_date || null,
            }

            await apiRequest(`/api/products/${editingProduct.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            })

            await fetchProducts()
            closeProductModal()
        } catch (error) {
            console.error('Update product error:', error)
            setModalError(error.message || 'Failed to update product')
        } finally {
            setModalLoading(false)
        }
    }

    const handleDeleteProduct = async () => {
        if (!deletingProduct?.id) return

        try {
            setModalLoading(true)
            setModalError('')

            await apiRequest(`/api/products/${deletingProduct.id}`, {
                method: 'DELETE',
            })

            await fetchProducts()
            closeDeleteModal()
        } catch (error) {
            console.error('Delete product error:', error)
            setModalError(error.message || 'Failed to delete product')
        } finally {
            setModalLoading(false)
        }
    }

    const handleSaleSubmit = async (event) => {
        event.preventDefault()
        setSaleError('')

        if (!selectedProduct) {
            setSaleError('Please select a product from search results')
            return
        }

        if (!Number.isInteger(saleQuantity) || saleQuantity <= 0) {
            setSaleError('Quantity must be a positive number')
            return
        }

        if (saleQuantity > selectedProduct.stock) {
            setSaleError(`Only ${selectedProduct.stock} ${selectedProduct.unit} available`)
            return
        }

        if (saleDiscount > saleSubTotal) {
            setSaleError('Discount cannot be greater than subtotal')
            return
        }

        try {
            setSaleLoading(true)

            await apiRequest('/api/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: saleQuantity,
                    customerId: saleForm.customerId || null,
                    customerName: saleForm.customerName.trim() || null,
                    paymentMethod: saleForm.paymentMethod,
                    discount: saleDiscount,
                    notes: saleForm.notes.trim() || null,
                }),
            })

            await Promise.all([fetchTransactions(), fetchProducts()])

            setSaleForm({
                productSearch: '',
                productId: '',
                quantity: '1',
                customerId: '',
                customerName: '',
                paymentMethod: 'cash',
                discount: '0',
                notes: '',
            })
        } catch (error) {
            console.error('Create sale error:', error)
            setSaleError(error.message || 'Failed to create sale')
        } finally {
            setSaleLoading(false)
        }
    }

    const handleCustomerSubmit = async (event) => {
        event.preventDefault()
        setCustomerError('')

        const name = customerForm.name.trim()
        const phone = customerForm.phone.trim()
        const email = customerForm.email.trim()

        if (!name || !phone) {
            setCustomerError('Customer name and phone are required')
            return
        }

        try {
            setCustomerLoading(true)

            await apiRequest('/api/customers', {
                method: 'POST',
                body: JSON.stringify({ name, phone, email: email || null }),
            })

            await fetchCustomers()
            setCustomerForm({ name: '', phone: '', email: '' })
        } catch (error) {
            console.error('Add customer error:', error)
            setCustomerError(error.message || 'Failed to add customer')
        } finally {
            setCustomerLoading(false)
        }
    }

    const removeCustomer = async (customerId) => {
        try {
            await apiRequest(`/api/customers/${customerId}`, { method: 'DELETE' })
            await fetchCustomers()
        } catch (error) {
            setCustomerError(error.message || 'Failed to remove customer')
        }
    }

    const lowStockCount = products.filter((product) => product.stock <= product.reorder_level).length
    const activeProductsCount = products.filter((product) => product.is_active).length
    const totalRevenue = transactions.reduce((sum, item) => sum + Number(item.total || 0), 0)
    const todaySales = transactions
        .filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString())
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
    const averageOrderValue = transactions.length > 0 ? totalRevenue / transactions.length : 0
    const inventoryValue = products.reduce((sum, product) => {
        const unitCost = Number(product.cost_price || product.price || 0)
        return sum + unitCost * Number(product.stock || 0)
    }, 0)

    return (
        <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
            <DashboardLayout
                sidebarSections={tabs}
                activeSection={activeTab}
                onSectionChange={setActiveTab}
                title={`POS - ${activeTabLabel}`}
            >
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">POS System</h1>
                        <p className="text-gray-600 mt-1">Manage pharmacy operations from one workspace</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Sales Dashboard</h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                                        <p className="text-sm text-blue-600 font-medium">Today&apos;s Sales</p>
                                        <p className="text-3xl font-bold text-blue-900 mt-2">Rs {Math.round(todaySales).toLocaleString()}</p>
                                        <p className="text-xs text-blue-600 mt-1">{transactions.length} transactions</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                                        <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                                        <p className="text-3xl font-bold text-green-900 mt-2">Rs {Math.round(totalRevenue).toLocaleString()}</p>
                                        <p className="text-xs text-green-600 mt-1">Recorded POS sales</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                                        <p className="text-sm text-orange-600 font-medium">Low Stock Items</p>
                                        <p className="text-3xl font-bold text-orange-900 mt-2">{lowStockCount}</p>
                                        <p className="text-xs text-orange-600 mt-1">Needs restock</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                                        <p className="text-sm text-purple-600 font-medium">Avg. Order Value</p>
                                        <p className="text-3xl font-bold text-purple-900 mt-2">Rs {Math.round(averageOrderValue).toLocaleString()}</p>
                                        <p className="text-xs text-purple-600 mt-1">Per sale</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                        <p className="text-sm text-gray-600">Inventory Valuation</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">Rs {Math.round(inventoryValue).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">Based on current stock and cost/price</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                        <p className="text-sm text-gray-600">Active Products</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{activeProductsCount}</p>
                                        <p className="text-xs text-gray-500 mt-1">Products available for sale</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'transactions' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>

                                <form onSubmit={handleSaleSubmit} className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase">Search Product</label>
                                            <div className="relative mt-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={saleForm.productSearch}
                                                    onChange={(e) => {
                                                        setSaleForm((prev) => ({ ...prev, productSearch: e.target.value, productId: '' }))
                                                    }}
                                                    placeholder="Type product name / SKU / generic name"
                                                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 uppercase">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={saleForm.quantity}
                                                    onChange={(e) => setSaleForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                                    className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 uppercase">Discount (Rs)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={saleForm.discount}
                                                    onChange={(e) => setSaleForm((prev) => ({ ...prev, discount: e.target.value }))}
                                                    className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {matchedProducts.length > 0 && (
                                        <div className="border border-gray-200 rounded-lg bg-white max-h-48 overflow-auto">
                                            {matchedProducts.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSaleForm((prev) => ({
                                                            ...prev,
                                                            productId: product.id,
                                                            productSearch: `${product.name} (${product.sku})`,
                                                        }))
                                                    }}
                                                    className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${String(saleForm.productId) === String(product.id) ? 'bg-blue-50' : ''}`}
                                                >
                                                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                    <p className="text-xs text-gray-500">SKU: {product.sku} | Stock: {product.stock} {product.unit} | Rs {Number(product.price || 0).toFixed(2)}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase">Customer</label>
                                            <select
                                                value={saleForm.customerId}
                                                onChange={(e) => setSaleForm((prev) => ({ ...prev, customerId: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                            >
                                                <option value="">Walk-in / Manual</option>
                                                {customers.map((customer) => (
                                                    <option key={customer.id} value={customer.id}>{customer.name} ({customer.phone})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase">Manual Customer Name</label>
                                            <input
                                                type="text"
                                                value={saleForm.customerName}
                                                onChange={(e) => setSaleForm((prev) => ({ ...prev, customerName: e.target.value }))}
                                                placeholder="If no saved customer"
                                                className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 uppercase">Payment Method</label>
                                            <select
                                                value={saleForm.paymentMethod}
                                                onChange={(e) => setSaleForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="wallet">Wallet</option>
                                                <option value="credit">Credit</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-gray-600 uppercase">Notes</label>
                                        <textarea
                                            value={saleForm.notes}
                                            onChange={(e) => setSaleForm((prev) => ({ ...prev, notes: e.target.value }))}
                                            rows={2}
                                            placeholder="Optional sale notes"
                                            className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <p>Subtotal: <span className="font-semibold">Rs {saleSubTotal.toFixed(2)}</span></p>
                                        <p>Discount: <span className="font-semibold">Rs {saleDiscount.toFixed(2)}</span></p>
                                        <p>Total: <span className="font-semibold text-primary">Rs {saleTotal.toFixed(2)}</span></p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saleLoading}
                                        className="px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg font-semibold disabled:opacity-60"
                                    >
                                        {saleLoading ? 'Processing...' : 'Create Sale'}
                                    </button>
                                </form>

                                {saleError && <p className="text-sm text-red-600">{saleError}</p>}
                                {transactionsError && <p className="text-sm text-red-600">{transactionsError}</p>}

                                {transactionsLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No transactions yet</p>
                                        <p className="text-sm text-gray-400 mt-1">Create your first sale from the form above</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {transactions.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(item.created_at).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.products?.name || 'Product'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{item.customer_name || 'Walk-in Customer'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{item.payment_method?.replace('_', ' ')}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">Rs {Number(item.total || 0).toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => printReceipt(item)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                                                                title="Print Receipt"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Inventory Products</h2>
                                    <button
                                        onClick={() => {
                                            setEditingProduct(null)
                                            setShowProductModal(true)
                                        }}
                                        className="px-4 py-2.5 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Product
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, SKU, or generic name..."
                                            value={inventorySearchTerm}
                                            onChange={(e) => setInventorySearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    {productsLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                        </div>
                                    ) : productsError ? (
                                        <div className="text-center py-10 px-6">
                                            <p className="text-red-600 font-semibold">Unable to load inventory products</p>
                                            <p className="text-sm text-gray-600 mt-2">{productsError}</p>
                                            <button onClick={fetchProducts} className="mt-4 px-5 py-2.5 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors">Retry</button>
                                        </div>
                                    ) : inventoryProducts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">No products found</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {inventoryProducts.map((product) => (
                                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                                {product.generic_name && <p className="text-xs text-gray-500">{product.generic_name}</p>}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{product.category || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">PKR {parseFloat(product.price || 0).toFixed(2)}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col items-start gap-1">
                                                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${product.stock <= product.reorder_level ? 'bg-red-100 text-red-700' : product.stock <= (product.reorder_level || 10) * 1.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                                        {product.stock} {product.unit}
                                                                    </span>
                                                                    {product.stock <= product.reorder_level && (
                                                                        <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            Critical
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingProduct(product)
                                                                            setShowProductModal(true)
                                                                        }}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setDeletingProduct(product)
                                                                            setShowDeleteModal(true)
                                                                        }}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-blue-700">Total Products</p>
                                                <p className="text-2xl font-bold text-blue-900 mt-1">{products.length}</p>
                                            </div>
                                            <Package className="w-6 h-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-red-700">Low Stock</p>
                                                <p className="text-2xl font-bold text-red-900 mt-1">{lowStockCount}</p>
                                            </div>
                                            <AlertTriangle className="w-6 h-6 text-red-600" />
                                        </div>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-green-700">Active Products</p>
                                                <p className="text-2xl font-bold text-green-900 mt-1">{activeProductsCount}</p>
                                            </div>
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'customers' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Customers</h2>

                                <form onSubmit={handleCustomerSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <input
                                        type="text"
                                        value={customerForm.name}
                                        onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Customer name"
                                        className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="text"
                                        value={customerForm.phone}
                                        onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Phone"
                                        className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                    />
                                    <input
                                        type="email"
                                        value={customerForm.email}
                                        onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                                        placeholder="Email (optional)"
                                        className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                                    />
                                    <button type="submit" disabled={customerLoading} className="px-4 py-2.5 bg-primary hover:bg-secondary text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                                        <UserPlus className="w-4 h-4" />
                                        {customerLoading ? 'Adding...' : 'Add Customer'}
                                    </button>
                                </form>

                                {customerError && <p className="text-sm text-red-600">{customerError}</p>}
                                {customersError && <p className="text-sm text-red-600">{customersError}</p>}

                                {customersLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                    </div>
                                ) : customers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No customers yet</p>
                                        <p className="text-sm text-gray-400 mt-1">Add regular customers to track repeat buyers</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Added</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {customers.map((customer) => (
                                                    <tr key={customer.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{customer.name}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{customer.email || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(customer.created_at).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => removeCustomer(customer.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <ProductModal
                    isOpen={showProductModal}
                    onClose={closeProductModal}
                    onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                    product={editingProduct}
                    loading={modalLoading}
                    error={modalError}
                />

                <DeleteConfirmModal
                    isOpen={showDeleteModal}
                    onClose={closeDeleteModal}
                    onConfirm={handleDeleteProduct}
                    productName={deletingProduct?.name}
                    loading={modalLoading}
                    error={modalError}
                />
            </DashboardLayout>
        </ProtectedRoute>
    )
}
