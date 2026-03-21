'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { user, login, loading: authLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (authLoading || !user) return

        if (user.role === 'admin') {
            router.replace('/dashboard')
            return
        }

        if (user.role === 'pharmacist') {
            router.replace('/pos')
        }
    }, [user, authLoading, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const user = await login(email, password)
            if (user.role === 'admin') {
                router.push('/dashboard')
            } else if (user.role === 'pharmacist') {
                router.push('/pos')
            }
        } catch (err) {
            setError(err.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Left Column - Login Form */}
            <div className="flex-1 lg:flex-[0_0_60%] flex items-center justify-center
                          bg-gradient-to-br from-gray-50 to-white
                          px-6 sm:px-8 lg:px-12 py-8 sm:py-12
                          relative overflow-hidden order-2 lg:order-1">
                <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96
                              bg-primary/5 rounded-full blur-3xl
                              -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96
                              bg-secondary/5 rounded-full blur-3xl
                              translate-x-1/2 translate-y-1/2"></div>

                <div className="w-full max-w-md relative z-10">
                    <div className="mb-8 sm:mb-10">
                        <div className="inline-block mb-3 sm:mb-4">
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2
                                          bg-primary/10 rounded-full">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <span className="text-xs sm:text-sm font-semibold text-primary">
                                    Healthcare POS System
                                </span>
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900
                                     mb-2 sm:mb-3 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg">
                            Sign in to continue to Bakhsh POS
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700
                                      px-4 sm:px-5 py-3 sm:py-4 rounded-lg mb-5 sm:mb-6
                                      flex items-start gap-2 sm:gap-3 animate-shake">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5"
                                 fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-sm sm:text-base">Authentication Failed</p>
                                <p className="text-xs sm:text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-2.5
                                          group-focus-within:text-primary transition-colors">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400
                                               group-focus-within:text-primary transition-colors"
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                                    </svg>
                                </div>
                                <input type="email" placeholder="you@example.com"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    required disabled={loading}
                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4
                                             bg-white border-2 border-gray-200 rounded-xl
                                             text-sm sm:text-base placeholder:text-gray-400
                                             focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                                             disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60
                                             transition-all duration-200 shadow-sm hover:border-gray-300" />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-2.5
                                          group-focus-within:text-primary transition-colors">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400
                                               group-focus-within:text-primary transition-colors"
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                    </svg>
                                </div>
                                <input type="password" placeholder="Enter your password"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    required disabled={loading}
                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4
                                             bg-white border-2 border-gray-200 rounded-xl
                                             text-sm sm:text-base placeholder:text-gray-400
                                             focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                                             disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60
                                             transition-all duration-200 shadow-sm hover:border-gray-300" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-secondary
                                     hover:from-secondary hover:to-primary
                                     text-white font-semibold py-3 sm:py-4 rounded-xl
                                     text-sm sm:text-base
                                     transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                     disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                                     shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40
                                     relative overflow-hidden group mt-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                                          translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                            {loading ? (
                                <span className="flex items-center justify-center gap-2 sm:gap-3">
                                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                                stroke="currentColor" strokeWidth="4" fill="none"/>
                                        <path className="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                    </svg>
                                    <span className="text-sm sm:text-base">Authenticating...</span>
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-sm sm:text-base">Sign In</span>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                              d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 sm:mt-12 text-center">
                        <p className="text-xs sm:text-sm text-gray-500
                                    flex items-center justify-center gap-1.5 sm:gap-2">
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                            </svg>
                            <span className="hidden sm:inline">Secured by</span>
                            <span>Bakhsh Healthcare Center © {new Date().getFullYear()}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Column - Logo & Branding */}
            <div className="flex-1 lg:flex-[0_0_40%]
                          bg-gradient-to-br from-primary via-primary to-secondary
                          flex items-center justify-center
                          p-6 sm:p-8 lg:p-12
                          relative overflow-hidden
                          order-1 lg:order-2
                          min-h-[300px] sm:min-h-[400px] lg:min-h-screen">
                <div className="absolute top-5 sm:top-10 right-5 sm:right-10
                              w-48 sm:w-72 h-48 sm:h-72
                              bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-5 sm:bottom-10 left-5 sm:left-10
                              w-64 sm:w-96 h-64 sm:h-96
                              bg-secondary/30 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="text-center text-white relative z-10 w-full">
                    <div className="mb-6 sm:mb-8 lg:mb-10 animate-float">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl
                                      p-4 sm:p-6 lg:p-8 inline-block
                                      shadow-2xl border border-white/20">
                            <img src="/bakhsh-logo.jpg" alt="Bakhsh Healthcare Center"
                                className="w-48 sm:w-56 lg:w-72 h-auto drop-shadow-2xl" />
                        </div>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4
                                 drop-shadow-lg tracking-tight">
                        Bakhsh
                    </h2>
                    <p className="text-lg sm:text-xl lg:text-2xl font-light opacity-90 mb-6 sm:mb-8">
                        Healthcare Management System
                    </p>
                </div>
            </div>
        </div>
    )
}