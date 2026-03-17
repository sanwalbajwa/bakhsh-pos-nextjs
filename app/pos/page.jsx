'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'

export default function POSPage() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'pharmacist']}>
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">POS System</h2>
                        <p className="text-gray-600">Coming Soon</p>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}