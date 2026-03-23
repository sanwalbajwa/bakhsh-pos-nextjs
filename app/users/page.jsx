'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import {
    UserPlus,
    Trash2,
    Search,
    Users,
    Shield,
    Stethoscope,
    Pill,
    Eye,
    EyeOff,
    RefreshCw,
} from 'lucide-react'

const ROLE_CONFIG = {
    admin: {
        label: 'Admin',
        icon: Shield,
        color: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
    },
    pharmacist: {
        label: 'Pharmacist',
        icon: Pill,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
    },
    doctor: {
        label: 'Doctor',
        icon: Stethoscope,
        color: 'bg-green-100 text-green-700 border-green-200',
        dot: 'bg-green-500',
    },
}

export default function UsersPage() {
    const { getAccessToken, user: currentUser } = useAuth()

    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const [searchTerm, setSearchTerm] = useState('')

    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'pharmacist' })
    const [formLoading, setFormLoading] = useState(false)
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    const apiRequest = useCallback(async (url, options = {}) => {
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
    }, [getAccessToken])

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            setLoadError('')
            const payload = await apiRequest('/api/users')
            setUsers(payload?.data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            setUsers([])
            setLoadError(error.message || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }, [apiRequest])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setFormError('')
        setFormSuccess('')

        const name = formData.name.trim()
        const email = formData.email.trim()
        const password = formData.password
        const role = formData.role

        if (!name) { setFormError('Name is required.'); return }
        if (!email) { setFormError('Email is required.'); return }
        if (!password || password.length < 6) { setFormError('Password must be at least 6 characters.'); return }

        try {
            setFormLoading(true)
            await apiRequest('/api/users', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role }),
            })

            setFormSuccess(`${ROLE_CONFIG[role]?.label || role} "${name}" created successfully!`)
            setFormData({ name: '', email: '', password: '', role: 'pharmacist' })
            setShowPassword(false)
            await fetchUsers()

            setTimeout(() => setFormSuccess(''), 4000)
        } catch (error) {
            console.error('Create user error:', error)
            setFormError(error.message || 'Failed to create user')
        } finally {
            setFormLoading(false)
        }
    }

    const handleDeleteUser = async (userId) => {
        try {
            setDeleteLoading(true)
            setDeleteError('')
            await apiRequest(`/api/users/${userId}`, { method: 'DELETE' })
            setDeleteConfirm(null)
            await fetchUsers()
        } catch (error) {
            console.error('Delete user error:', error)
            setDeleteError(error.message || 'Failed to delete user')
        } finally {
            setDeleteLoading(false)
        }
    }

    const filteredUsers = users.filter((u) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const roleCounts = {
        admin: users.filter((u) => u.role === 'admin').length,
        pharmacist: users.filter((u) => u.role === 'pharmacist').length,
        doctor: users.filter((u) => u.role === 'doctor').length,
    }

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                            <p className="text-gray-600 mt-1">Add and manage admins, pharmacists, and doctors</p>
                        </div>
                        <button
                            onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess('') }}
                            className="px-5 py-2.5 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary/30"
                        >
                            <UserPlus className="w-5 h-5" />
                            {showForm ? 'Hide Form' : 'Add New User'}
                        </button>
                    </div>

                    {/* Role Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                            const Icon = config.icon
                            return (
                                <div key={roleKey} className="bg-white rounded-lg border border-gray-200 p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">{config.label}s</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">{roleCounts[roleKey]}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${config.color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Add User Form */}
                    {showForm && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                Create New User
                            </h2>

                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            {formSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    {formSuccess}
                                </div>
                            )}

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            placeholder="e.g., Dr. Ahmed Khan"
                                            disabled={formLoading}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            placeholder="e.g., ahmed@bakhsh.com"
                                            disabled={formLoading}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={formData.password}
                                                onChange={handleFormChange}
                                                placeholder="Min. 6 characters"
                                                disabled={formLoading}
                                                className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleFormChange}
                                            disabled={formLoading}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                                        >
                                            <option value="pharmacist">Pharmacist</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="px-6 py-2.5 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                                    >
                                        {formLoading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4" />
                                                Create User
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForm(false)
                                            setFormData({ name: '', email: '', password: '', role: 'pharmacist' })
                                            setFormError('')
                                            setFormSuccess('')
                                        }}
                                        disabled={formLoading}
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : loadError ? (
                            <div className="text-center py-12 px-6">
                                <p className="text-red-600 font-semibold">Unable to load users</p>
                                <p className="text-sm text-gray-600 mt-2">{loadError}</p>
                                <button
                                    onClick={fetchUsers}
                                    className="mt-4 px-5 py-2.5 bg-primary hover:bg-secondary text-white font-semibold rounded-lg transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No users found</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {searchTerm ? 'Try a different search term' : 'Add your first user above'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredUsers.map((u) => {
                                            const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG.pharmacist
                                            const RoleIcon = roleConf.icon
                                            const isSelf = u.id === currentUser?.id

                                            return (
                                                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {u.name}
                                                                    {isSelf && (
                                                                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${roleConf.color}`}>
                                                            <RoleIcon className="w-3 h-3" />
                                                            {roleConf.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {isSelf ? (
                                                            <span className="text-xs text-gray-400">Cannot remove self</span>
                                                        ) : (
                                                            <button
                                                                onClick={() => { setDeleteConfirm(u); setDeleteError('') }}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete user"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <Trash2 className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                                        <p className="text-sm text-gray-600">This will permanently remove the user</p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                {deleteError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                                        <p className="text-sm text-red-700">{deleteError}</p>
                                    </div>
                                )}
                                <p className="text-gray-700">
                                    Are you sure you want to delete{' '}
                                    <span className="font-semibold text-gray-900">&quot;{deleteConfirm.name}&quot;</span>
                                    {' '}({deleteConfirm.email})?
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    This will remove their login access and profile data. This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
                                <button
                                    onClick={() => { setDeleteConfirm(null); setDeleteError('') }}
                                    disabled={deleteLoading}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteConfirm.id)}
                                    disabled={deleteLoading}
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deleteLoading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete User'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    )
}