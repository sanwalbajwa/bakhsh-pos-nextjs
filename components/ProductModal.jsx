'use client'

import { useState, useEffect } from 'react'

export default function ProductModal({ isOpen, onClose, onSubmit, product, loading, error }) {
    const [formData, setFormData] = useState({
        name: '', generic_name: '', sku: '', barcode: '', description: '',
        price: '', cost_price: '', stock: '', reorder_level: '10',
        unit: 'piece', manufacturer: '', category: 'Medicine',
        expiry_date: '', is_active: true,
    })

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '', generic_name: product.generic_name || '',
                sku: product.sku || '', barcode: product.barcode || '',
                description: product.description || '', price: product.price || '',
                cost_price: product.cost_price || '', stock: product.stock || '',
                reorder_level: product.reorder_level || '10', unit: product.unit || 'piece',
                manufacturer: product.manufacturer || '', category: product.category || 'Medicine',
                expiry_date: product.expiry_date || '', is_active: product.is_active ?? true,
            })
        } else {
            setFormData({
                name: '', generic_name: '', sku: '', barcode: '', description: '',
                price: '', cost_price: '', stock: '', reorder_level: '10',
                unit: 'piece', manufacturer: '', category: 'Medicine',
                expiry_date: '', is_active: true,
            })
        }
    }, [product, isOpen])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    if (!isOpen) return null

    const fields = [
        { label: 'Product Name', name: 'name', required: true, placeholder: 'e.g., Panadol 500mg' },
        { label: 'Generic Name', name: 'generic_name', placeholder: 'e.g., Paracetamol' },
        { label: 'SKU', name: 'sku', required: true, placeholder: 'e.g., MED-001' },
        { label: 'Barcode', name: 'barcode', placeholder: 'e.g., 8964000123456' },
    ]

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={onClose} disabled={loading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">Error:</p>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                        {fields.map(f => (
                            <div key={f.name}>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {f.label} {f.required && <span className="text-red-500">*</span>}
                                </label>
                                <input type="text" name={f.name} value={formData[f.name]} onChange={handleChange}
                                    required={f.required} disabled={loading} placeholder={f.placeholder}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} disabled={loading}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                <option value="Medicine">Medicine</option>
                                <option value="Supplies">Supplies</option>
                                <option value="Equipment">Equipment</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Manufacturer</label>
                            <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange}
                                disabled={loading} placeholder="e.g., GSK"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Price (PKR) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange}
                                required disabled={loading} placeholder="e.g., 500.00"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cost Price (PKR)</label>
                            <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange}
                                disabled={loading} placeholder="e.g., 300.00"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity <span className="text-red-500">*</span></label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleChange}
                                required disabled={loading} placeholder="e.g., 100"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reorder Level <span className="text-red-500">*</span></label>
                            <input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleChange}
                                required disabled={loading} placeholder="e.g., 10"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Unit <span className="text-red-500">*</span></label>
                            <select name="unit" value={formData.unit} onChange={handleChange} required disabled={loading}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                                <option value="piece">Piece</option>
                                <option value="strip">Strip</option>
                                <option value="box">Box</option>
                                <option value="bottle">Bottle</option>
                                <option value="vial">Vial</option>
                                <option value="pack">Pack</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                            <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange}
                                rows="3" disabled={loading} placeholder="Product description..."
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                        </div>

                        <div className="md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange}
                                    disabled={loading} className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary/20" />
                                <span className="text-sm font-semibold text-gray-700">Active Product</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button type="button" onClick={onClose} disabled={loading}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-primary hover:bg-secondary text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                            {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}