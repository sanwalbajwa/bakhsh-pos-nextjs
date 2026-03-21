import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import DashboardLayout from '../components/DashboardLayout';
import ProductModal from '../components/ProductModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal states
    const [showProductModal, setShowProductModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deletingProduct, setDeletingProduct] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Fetch products from Supabase
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Failed to fetch products: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Search products
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle Add Product
    const handleAddProduct = async (formData) => {
        try {
            setModalLoading(true);

            // Clean up the data - convert strings to proper types
            const cleanData = {
                name: formData.name,
                generic_name: formData.generic_name || null,
                sku: formData.sku,
                barcode: formData.barcode || null,
                description: formData.description || null,
                price: parseFloat(formData.price) || 0,
                cost_price: parseFloat(formData.cost_price) || 0,
                stock: parseInt(formData.stock) || 0,
                reorder_level: parseInt(formData.reorder_level) || 10,
                unit: formData.unit,
                manufacturer: formData.manufacturer || null,
                category: formData.category,
                expiry_date: formData.expiry_date || null,
                is_active: formData.is_active,
            };

            const { error } = await supabase
                .from('products')
                .insert([cleanData]);

            if (error) throw error;

            await fetchProducts();
            setShowProductModal(false);
            alert('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    // Handle Update Product
    const handleUpdateProduct = async (formData) => {
        try {
            setModalLoading(true);

            const cleanData = {
                name: formData.name,
                generic_name: formData.generic_name || null,
                sku: formData.sku,
                barcode: formData.barcode || null,
                description: formData.description || null,
                price: parseFloat(formData.price) || 0,
                cost_price: parseFloat(formData.cost_price) || 0,
                stock: parseInt(formData.stock) || 0,
                reorder_level: parseInt(formData.reorder_level) || 10,
                unit: formData.unit,
                manufacturer: formData.manufacturer || null,
                category: formData.category,
                expiry_date: formData.expiry_date || null,
                is_active: formData.is_active,
            };

            const { error } = await supabase
                .from('products')
                .update(cleanData)
                .eq('id', editingProduct.id);

            if (error) throw error;

            await fetchProducts();
            setShowProductModal(false);
            setEditingProduct(null);
            alert('Product updated successfully!');
        } catch (error) {
            console.error('Error updating product:', error);
            alert('Failed to update product: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    // Handle Delete Product
    const handleDeleteProduct = async () => {
        try {
            setModalLoading(true);

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deletingProduct.id);

            if (error) throw error;

            await fetchProducts();
            setShowDeleteModal(false);
            setDeletingProduct(null);
            alert('Product deleted successfully!');
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    // Open Add Modal
    const openAddModal = () => {
        setEditingProduct(null);
        setShowProductModal(true);
    };

    // Open Edit Modal
    const openEditModal = (product) => {
        setEditingProduct(product);
        setShowProductModal(true);
    };

    // Open Delete Modal
    const openDeleteModal = (product) => {
        setDeletingProduct(product);
        setShowDeleteModal(true);
    };

    // Close Modals
    const closeProductModal = () => {
        setShowProductModal(false);
        setEditingProduct(null);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingProduct(null);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
                        <p className="text-gray-600 mt-1">Manage your inventory</p>
                    </div>
                    <button 
                        onClick={openAddModal}
                        className="px-6 py-3 bg-primary hover:bg-secondary text-white 
                                font-semibold rounded-lg transition-colors duration-200
                                shadow-lg shadow-primary/30 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Product
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, SKU, or generic name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg
                                     focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No products found</p>
                            <p className="text-gray-400 text-sm mt-1">Add your first product to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            SKU
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{product.name}</p>
                                                    {product.generic_name && (
                                                        <p className="text-sm text-gray-500">{product.generic_name}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {product.sku}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    {product.category || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                PKR {parseFloat(product.price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    product.stock <= product.reorder_level
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {product.stock} {product.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                    product.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openEditModal(product)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => openDeleteModal(product)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Product"
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock Items</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {products.filter(p => p.stock <= p.reorder_level).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Products</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {products.filter(p => p.is_active).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Modals */}
            <ProductModal
                isOpen={showProductModal}
                onClose={closeProductModal}
                onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
                product={editingProduct}
                loading={modalLoading}
            />

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteProduct}
                productName={deletingProduct?.name}
                loading={modalLoading}
            />

        </DashboardLayout>
    );
}
