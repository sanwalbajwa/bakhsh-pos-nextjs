'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

const normalizeRole = (role) => {
    if (!role || typeof role !== 'string') return null
    const value = role.toLowerCase()
    if (value === 'admin' || value === 'pharmacist' || value === 'doctor') return value
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
    const email = authUser?.email?.toLowerCase()
    if (email === 'admin@bakhsh.com' || email === 'admin@bakhshpos.com') return 'admin'

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

const setAccessTokenCookie = (token) => {
    if (typeof document === 'undefined') return
    document.cookie = `sb-access-token=${token}; Path=/; Max-Age=3600; SameSite=Lax`
}

const clearAccessTokenCookie = () => {
    if (typeof document === 'undefined') return
    document.cookie = 'sb-access-token=; Path=/; Max-Age=0; SameSite=Lax'
}

const withTimeout = (promise, timeoutMs = 10000, fallbackValue = null) => {
    return Promise.race([
        promise,
        new Promise((resolve) => {
            setTimeout(() => resolve(fallbackValue), timeoutMs)
        }),
    ])
}

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
                    const profile = await withTimeout(fetchProfile(session.user), 8000, null)
                    setUser(buildAppUser(session.user, profile))
                    if (session.access_token) {
                        setAccessTokenCookie(session.access_token)
                    }
                } else {
                    clearAccessTokenCookie()
                }
            } catch (error) {
                console.error('Unexpected getSession error:', error)
                setUser(null)
                clearAccessTokenCookie()
            } finally {
                setLoading(false)
            }
        }
        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
                    const profile = await withTimeout(fetchProfile(session.user), 8000, null)
                    setUser(buildAppUser(session.user, profile))
                    if (session.access_token) {
                        setAccessTokenCookie(session.access_token)
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    clearAccessTokenCookie()
                }
            }
        )
        return () => subscription.unsubscribe()
    }, [])

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const profile = await withTimeout(fetchProfile(data.user), 8000, null)
        const userData = buildAppUser(data.user, profile)
        setUser(userData)
        if (data.session?.access_token) {
            setAccessTokenCookie(data.session.access_token)
        }
        return userData
    }

    const logout = async () => {
        setUser(null)
        clearAccessTokenCookie()
        try {
            await withTimeout(supabase.auth.signOut(), 5000, null)
        } catch (error) {
            console.error('Logout request failed:', error)
        }
    }

    const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token || null
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, getAccessToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)