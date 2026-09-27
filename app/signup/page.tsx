'use client'

import { supabase } from "@/libs/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const [successMessage, setSuccessMessage] = useState<string | null>(null)


    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true)
        setError(null)
        const { error: authError } = await supabase.auth.signUp({
            email,
            password
        })
        if (authError) {
            setError(authError.message)
            setLoading(false)
        } else {
            setLoading(false)
            setSuccessMessage(
                "Account created successfully! Please check your email inbox for the confirmation link before logging in."
            );
        }
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E8F9FF] via-[#C4D9FF] to-[#C5BAFF] p-4 font-sans relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#C5BAFF] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-[#E8F9FF] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-[#C4D9FF] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>

            <div className="relative w-full max-w-md p-10 space-y-8 bg-[#FBFBFB]/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">Create Account</h1>
                    <p className="text-sm text-gray-700 font-medium">Join us to start managing your store</p>
                </div>

                {error && (
                    <div className="p-4 text-sm font-medium text-white bg-red-500/80 backdrop-blur-sm border border-red-400 rounded-xl shadow-inner">
                        {error}
                    </div>
                )}
                {
                    successMessage ? (
                        <div className="space-y-6">
                            <div className="bg-white/90 text-green-700 p-5 rounded-xl border border-white shadow-inner font-medium leading-relaxed">
                                {successMessage}
                            </div>
                            <Link 
                                href="/login" 
                                className="block text-center w-full bg-[#C5BAFF] text-gray-900 py-4 rounded-2xl hover:bg-[#b0a1f8] hover:shadow-lg transition-all font-bold tracking-wider uppercase shadow-md"
                            >
                                Proceed to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSignUp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-800 tracking-wide ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    className="block w-full px-5 py-3.5 text-gray-900 bg-white/80 border border-gray-200 rounded-2xl focus:border-[#C4D9FF] focus:bg-white focus:ring-4 focus:ring-[#C4D9FF]/50 focus:outline-none transition-all placeholder-gray-400 shadow-sm"
                                    placeholder="name@company.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-800 tracking-wide ml-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    className="block w-full px-5 py-3.5 text-gray-900 bg-white/80 border border-gray-200 rounded-2xl focus:border-[#C4D9FF] focus:bg-white focus:ring-4 focus:ring-[#C4D9FF]/50 focus:outline-none transition-all placeholder-gray-400 shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full px-4 py-4 mt-4 text-sm font-bold tracking-wider text-gray-900 uppercase transition-all duration-300 bg-[#C5BAFF] rounded-2xl hover:bg-[#b0a1f8] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#C5BAFF]/50 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-3 text-gray-900 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing up...
                                    </span>
                                ) : 'Sign up'}
                            </button>
                            <div className="text-center pt-2">
                                <span className="text-gray-700 text-sm font-medium drop-shadow-sm">Already have an account? <Link href="/login" className="text-indigo-900 font-bold hover:underline underline-offset-4 decoration-2">Click to login</Link></span>
                            </div>
                        </form>
                    )
                }
            </div>
        </div>
    )
}