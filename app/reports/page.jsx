'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { FileBarChart, TrendingUp, CalendarRange } from 'lucide-react'

export default function ReportsPage() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-600 mt-1">Track business insights and performance summaries.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                                <FileBarChart className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-500">Inventory Report</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">Available Soon</p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-3">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-500">Sales Performance</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">Available Soon</p>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                                <CalendarRange className="w-5 h-5" />
                            </div>
                            <p className="text-sm text-gray-500">Date Range Analytics</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">Available Soon</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
