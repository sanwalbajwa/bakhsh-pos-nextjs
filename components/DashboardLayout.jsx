'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingCart, FileBarChart, Menu, X, LogOut } from 'lucide-react'

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin'] },
        { name: 'Products', icon: Package, path: '/products', roles: ['admin'] },
        { name: 'POS', icon: ShoppingCart, path: '/pos', roles: ['admin', 'pharmacist'] },
        { name: 'Reports', icon: FileBarChart, path: '/reports', roles: ['admin'] },
    ]

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role))

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gradient-to-b from-primary to-secondary
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <img src="/bakhsh-logo.jpg" alt="Logo" className="h-10 w-10" />
                    <div className="text-white">
                        <h2 className="text-lg font-bold">Bakhsh POS</h2>
                        <p className="text-xs text-white/70">Healthcare System</p>
                    </div>
                </div>
                <nav className="px-4 py-6 space-y-2">
                    {filteredMenu.map((item) => {
                        const isActive = pathname === item.path
                        const Icon = item.icon
                        return (
                            <Link key={item.path} href={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                                    ${isActive ? 'bg-white text-primary shadow-lg' : 'text-white/90 hover:bg-white/10'}`}>
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-white/70 capitalize">{user?.role}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 hidden lg:block">
                        {filteredMenu.find(item => item.path === pathname)?.name || 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <button onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 text-sm flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    )
}