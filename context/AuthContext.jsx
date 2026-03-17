'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: profile?.name || session.user.email,
                    role: profile?.role || 'pharmacist',
                })
            }
            setLoading(false)
        }
        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()
                    setUser({
                        id: session.user.id,
                        email: session.user.email,
                        name: profile?.name || session.user.email,
                        role: profile?.role || 'pharmacist',
                    })
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
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
        const userData = {
            id: data.user.id,
            email: data.user.email,
            name: profile?.name || data.user.email,
            role: profile?.role || 'pharmacist',
        }
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