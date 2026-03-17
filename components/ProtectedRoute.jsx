'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
        if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
            router.push('/login')
        }
    }, [user, loading, router, allowedRoles])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!user) return null
    if (allowedRoles && !allowedRoles.includes(user.role)) return null

    return children
}