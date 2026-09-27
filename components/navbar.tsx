'use client'
import { supabase } from "@/libs/supabase";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";



export default function Navbar() {
    const [search, setSearch] = useState(false)
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
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
                    <div className="flex-shrink-0 flex items-center gap-2.5 cursor-pointer">
                        <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-lg leading-none">V</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block">veriScale</span>
                    </div>

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
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLoggingOut ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span className="hidden sm:inline">Logging out...</span>
                                </span>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    <span className="hidden sm:inline">Log Out</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}