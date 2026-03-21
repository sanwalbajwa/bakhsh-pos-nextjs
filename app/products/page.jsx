'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import ProductModal from '@/components/ProductModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [showProductModal, setShowProductModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [deletingProduct, setDeletingProduct] = useState(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [modalError, setModalError] = useState('')

    const withTimeout = (promise, timeoutMs = 12000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout. Please check your network or permissions.')), timeoutMs)
            }),
        ])
    }

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            setLoadError('')
            const { data, error } = await withTimeout(
                supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
            )
            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
            setProducts([])
            setLoadError(error.message || 'Failed to fetch products')
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAddProduct = async (formData) => {
        try {
            setModalLoading(true)
            setModalError('')
            const { error } = await withTimeout(
                supabase.from('products').insert([{
                    ...formData,
                    price: parseFloat(formData.price),
                    cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
                    stock: parseInt(formData.stock),
                    reorder_level: parseInt(formData.reorder_level),
                }])
            )
            if (error) throw error
            await fetchProducts()
            setShowProductModal(false)
            setEditingProduct(null)
            setModalError('')
        } catch (error) {
            console.error('Add product error:', error)
            setModalError(error.message || 'Failed to add product. Please check your permissions or network connection.')
        } finally { setModalLoading(false) }
    }

    const handleUpdateProduct = async (formData) => {
        try {
            setModalLoading(true)
            setModalError('')
            const { error } = await withTimeout(
                supabase.from('products').update({
                    ...formData,
                    price: parseFloat(formData.price),
                    cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
                    stock: parseInt(formData.stock),
                    reorder_level: parseInt(formData.reorder_level),
                }).eq('id', editingProduct.id)
            )
            if (error) throw error
            await fetchProducts()
            setShowProductModal(false)
            setEditingProduct(null)
            setModalError('')
        } catch (error) {
            console.error('Update product error:', error)
            setModalError(error.message || 'Failed to update product. Please check your permissions or network connection.')
        } finally { setModalLoading(false) }
    }

    const handleDeleteProduct = async () => {
        try {
            setModalLoading(true)
            setModalError('')
            const { error } = await withTimeout(
                supabase.from('products').delete().eq('id', deletingProduct.id)
            )
            if (error) throw error
            await fetchProducts()
            setShowDeleteModal(false)
            setDeletingProduct(null)
            setModalError('')
        } catch (error) {
            console.error('Delete product error:', error)
            setModalError(error.message || 'Failed to delete product. Please check your permissions or network connection.')
        } finally { setModalLoading(false) }
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
                            <p className="text-gray-600 mt-1">Manage your inventory</p>
                        </div>
                        <button onClick={() => { setEditingProduct(null); setShowProductModal(true) }}
                            className="px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg shadow-primary/30 flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Add Product
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search by name, SKU, or generic name..."
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : loadError ? (
                            <div className="text-center py-12 px-6">
                                <p className="text-red-600 font-semibold">Unable to load products</p>
                                <p className="text-sm text-gray-600 mt-2">{loadError}</p>
                                <button
                                    onClick={fetchProducts}
                                    className="mt-4 px-5 py-2.5 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12"><p className="text-gray-500">No products found</p></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    {product.generic_name && <p className="text-sm text-gray-500">{product.generic_name}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{product.sku}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">{product.category || 'N/A'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">PKR {parseFloat(product.price).toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${product.stock <= product.reorder_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {product.stock} {product.unit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => { setEditingProduct(product); setShowProductModal(true) }}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => { setDeletingProduct(product); setShowDeleteModal(true) }}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600">Total Products</p><p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p></div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-blue-600" /></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600">Low Stock Items</p><p className="text-2xl font-bold text-red-600 mt-1">{products.filter(p => p.stock <= p.reorder_level).length}</p></div>
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600">Active Products</p><p className="text-2xl font-bold text-green-600 mt-1">{products.filter(p => p.is_active).length}</p></div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <ProductModal isOpen={showProductModal} onClose={() => { setShowProductModal(false); setEditingProduct(null); setModalError('') }}
                    onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                    product={editingProduct} loading={modalLoading} error={modalError} />
                <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletingProduct(null); setModalError('') }}
                    onConfirm={handleDeleteProduct} productName={deletingProduct?.name} loading={modalLoading} error={modalError} />
            </DashboardLayout>
        </ProtectedRoute>
    )
}