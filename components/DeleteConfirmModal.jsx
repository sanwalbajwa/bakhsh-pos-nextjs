'use client'

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, productName, loading }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Delete Product</h2>
                            <p className="text-sm text-gray-600">This action cannot be undone</p>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-gray-900">&quot;{productName}&quot;</span>?
                    </p>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                    <button onClick={onClose} disabled={loading}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
                        {loading ? 'Deleting...' : 'Delete Product'}
                    </button>
                </div>
            </div>
        </div>
    )
}