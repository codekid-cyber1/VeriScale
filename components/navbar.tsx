'use client'
import { supabase } from "@/libs/supabase";
import { Search, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";



export default function Navbar() {
    const [search, setSearch] = useState(false)
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null)
            setAuthLoading(false);
        })
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })
        
        return () => subscription.unsubscribe()
    }, [])

    async function handleAuthAction() {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsLoggingOut(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.push('/login');
        } catch (err: any) {
            console.error("Failed to log out:", err);
            alert("Error logging out: " + err.message);
            setIsLoggingOut(false);
        }
    }

    const handleSearch = () => {
        setSearch(!search);
    }


    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand / Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 cursor-pointer group">
                        <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-700/60 p-1.5 transition-transform duration-200 group-hover:scale-105">
                            <svg className="w-full h-full" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 8L15 24C15.4 24.8 16.6 24.8 17 24L25 8" stroke="url(#nav-vs-grad)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="25" cy="8" r="2.2" fill="#38BDF8"/>
                                <defs>
                                    <linearGradient id="nav-vs-grad" x1="7" y1="24" x2="25" y2="8" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#6366F1"/>
                                        <stop offset="0.5" stopColor="#8B5CF6"/>
                                        <stop offset="1" stopColor="#06B6D4"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block">veriScale</span>
                    </Link>

                    {/* Search Bar - Center */}
                    <div className="flex-1 flex justify-center max-w-md mx-4">
                        <div 
                            className={`relative flex items-center h-10 transition-all duration-300 ease-out bg-gray-100/80 rounded-full border border-transparent focus-within:bg-white focus-within:border-gray-300 focus-within:ring-4 focus-within:ring-gray-100 overflow-hidden ${search ? 'w-full px-4' : 'w-10 justify-center cursor-pointer hover:bg-gray-200/80'}`}
                            onClick={() => !search && setSearch(true)}
                        >
                            <Search className={`w-5 h-5 flex-shrink-0 transition-colors ${search ? 'mr-2.5 text-gray-400' : 'text-gray-600'}`} />
                            {search && (
                                <input 
                                    type="search" 
                                    name="Search" 
                                    placeholder="Search products..." 
                                    className="w-full h-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                    autoFocus
                                    onBlur={(e) => {
                                        if (!e.target.value) setSearch(false);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        {!authLoading && (
                            <button
                                onClick={handleAuthAction}
                                disabled={isLoggingOut}
                                className={`group flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                                    user 
                                    ? "text-gray-600 bg-white hover:bg-red-50 hover:text-red-600 border-gray-200 hover:border-red-200" 
                                    : "text-white bg-gray-900 hover:bg-gray-800 border-transparent"
                                }`}
                            >
                                {isLoggingOut ? (
                                    <span className="flex items-center gap-2">
                                        <svg className={`animate-spin h-4 w-4 ${user ? 'text-red-600' : 'text-white'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span className="hidden sm:inline">Logging out...</span>
                                    </span>
                                ) : (
                                    <>
                                        {user ? (
                                            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                                        ) : (
                                            <LogIn className="w-4 h-4 text-white transition-colors" />
                                        )}
                                        <span className="hidden sm:inline">{user ? "Log Out" : "Log In"}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}