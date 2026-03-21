'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

const normalizeRole = (role) => {
    if (!role || typeof role !== 'string') return null
    const value = role.toLowerCase()
    if (value === 'admin' || value === 'pharmacist') return value
    return null
}

const resolveRole = (authUser, profile) => {
    const profileRole = normalizeRole(profile?.role)
    if (profileRole) return profileRole

    const appMetaRole = normalizeRole(authUser?.app_metadata?.role)
    if (appMetaRole) return appMetaRole

    const userMetaRole = normalizeRole(authUser?.user_metadata?.role)
    if (userMetaRole) return userMetaRole

    // Keep known admin account on admin flow even if profile row is missing.
    if (authUser?.email?.toLowerCase() === 'admin@bakhshpos.com') return 'admin'

    return 'pharmacist'
}

const fetchProfile = async (authUser) => {
    if (!authUser?.id) return null

    const { data: byId, error: byIdError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()
    if (byIdError) {
        console.warn('Profile lookup by id failed:', byIdError.message)
        return null
    }
    if (byId) return byId

    if (authUser.email) {
        const { data: byEmail, error: byEmailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', authUser.email)
            .maybeSingle()
        if (byEmailError) {
            console.warn('Profile lookup by email failed:', byEmailError.message)
            return null
        }
        if (byEmail) return byEmail
    }

    return null
}

const buildAppUser = (authUser, profile) => ({
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.user_metadata?.full_name || authUser.email,
    role: resolveRole(authUser, profile),
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) {
                    console.error('Get session failed:', error)
                    setUser(null)
                    return
                }

                if (session?.user) {
                    const profile = await fetchProfile(session.user)
                    setUser(buildAppUser(session.user, profile))
                }
            } catch (error) {
                console.error('Unexpected getSession error:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const profile = await fetchProfile(session.user)
                    setUser(buildAppUser(session.user, profile))
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                }
            }
        )
        return () => subscription.unsubscribe()
    }, [])

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const profile = await fetchProfile(data.user)
        const userData = buildAppUser(data.user, profile)
        setUser(userData)
        return userData
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)