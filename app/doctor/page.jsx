'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { Stethoscope, Users, FileText, Calendar } from 'lucide-react'

export default function DoctorPage() {
    const [activeTab, setActiveTab] = useState('dashboard')

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: Stethoscope },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
    ]

    return (
        <ProtectedRoute allowedRoles={['doctor']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage patients and prescriptions</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-gray-200 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Overview</h2>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                                        <p className="text-sm text-blue-600 font-medium">Total Patients</p>
                                        <p className="text-3xl font-bold text-blue-900 mt-2">0</p>
                                        <p className="text-xs text-blue-600 mt-1">Registered</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                                        <p className="text-sm text-green-600 font-medium">Today&apos;s Appointments</p>
                                        <p className="text-3xl font-bold text-green-900 mt-2">0</p>
                                        <p className="text-xs text-green-600 mt-1">Scheduled</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                                        <p className="text-sm text-orange-600 font-medium">Pending Prescriptions</p>
                                        <p className="text-3xl font-bold text-orange-900 mt-2">0</p>
                                        <p className="text-xs text-orange-600 mt-1">Awaiting review</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                                        <p className="text-sm text-purple-600 font-medium">Active Cases</p>
                                        <p className="text-3xl font-bold text-purple-900 mt-2">0</p>
                                        <p className="text-xs text-purple-600 mt-1">Under treatment</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'patients' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900">Patient Records</h2>
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No patients yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Patient records will appear here</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'prescriptions' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900">Prescriptions</h2>
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No prescriptions yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Issued prescriptions will appear here</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold text-gray-900">Appointment Calendar</h2>
                                <div className="text-center py-12">
                                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No appointments scheduled</p>
                                    <p className="text-sm text-gray-400 mt-1">Scheduled appointments will appear here</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
