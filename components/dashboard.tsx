'use client'

import { supabase } from "@/libs/supabase"
import { salesTransaction } from "@/types"
import { useEffect, useState } from "react"
import { MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
    const [transactions, setTransactions] = useState<salesTransaction[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    
    // New Transaction Form State
    const [itemName, setItemName] = useState('')
    const [itemPrice, setItemPrice] = useState<number | ''>('')
    const [itemCostPrice, setItemCostPrice] = useState<number | ''>('')
    const [quantity, setQuantity] = useState<number | ''>(1)
    const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0])
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<{type: 'transaction', id: string} | null>(null)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const { data: dbTransaction, error: tranError } = await supabase.from('transactions').select('*').order('date', { ascending: false })
                if (tranError) throw tranError
                if (dbTransaction) {
                    const formattedTransactions = dbTransaction.map((t: any) => ({
                        id: String(t.id),
                        date: t.date,
                        items: t.items,
                        totalAmount: Number(t.total_amount),
                        totalProfit: Number(t.total_profit)
                    }))
                    setTransactions(formattedTransactions);
                }
            } catch (error: any) {
                console.error('Error loading data from Supabase: ', error)
                setError(error.message || 'failed to get the data form the super base')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    async function deleteTransaction(id: string) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        try {
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const { data, error } = await supabase.from('transactions').delete().eq('id', parsedId).select();
            if (error) throw error;
            
            if (!data || data.length === 0) {
                throw new Error('Supabase blocked the deletion. This usually happens if you forgot to add a "DELETE" Row Level Security (RLS) policy in your Supabase dashboard.');
            }

            setTransactions(transactions.filter(t => t.id !== id));
            alert('Transaction deleted successfully');
        } catch (err: any) {
            alert('Failed to delete transaction: ' + err.message);
        }
    }

    async function handleRecordTransaction(e: React.FormEvent) {
        e.preventDefault();
        
        const price = Number(itemPrice);
        const costPrice = Number(itemCostPrice);
        const qty = Number(quantity);

        if (!itemName.trim() || price < 0 || qty <= 0) {
            alert('Please fill out all fields correctly.');
            return;
        }

        setIsSubmitting(true)
        const totalAmount = qty * price
        const totalProfit = qty * (price - costPrice)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('user session expired, Please log in')
            
            const itemsString = `${itemName}: ${qty}`;
            
            const { data, error: txError } = await supabase.from('transactions').insert([
                {
                    date: new Date(transactionDate).toISOString(),
                    items: itemsString,
                    total_amount: totalAmount,
                    total_profit: totalProfit,
                    user_id: user.id
                }
            ]).select()
            
            if (txError) throw txError;

            let newId = Math.random().toString();
            if (data && data[0]) {
                newId = String(data[0].id);
            }

            const newTx: salesTransaction = {
                id: newId,
                date: new Date(transactionDate).toISOString(),
                items: itemsString,
                totalAmount: totalAmount,
                totalProfit: totalProfit
            };

            setTransactions([newTx, ...transactions]);
            
            // Reset form
            setItemName('');
            setItemPrice('');
            setItemCostPrice('');
            setQuantity(1);
            
            alert('Transaction recorded successfully!');
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-[#FBFBFB] p-3 md:p-8 font-sans w-full">
                <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-pulse">
                    <div>
                        <div className="h-8 bg-gray-200 rounded-md w-48 md:w-64 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-64 md:w-96"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="h-24 md:h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="h-24 md:h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="h-24 md:h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-64"></div>
                </div>
            </div>
        )
    }

    if (error) {
        const isAuthError = error.toLowerCase().includes('log in') || error.toLowerCase().includes('login') || error.toLowerCase().includes('session') || error.toLowerCase().includes('unauthorized');
        return (
            <div className="flex items-center justify-center min-h-[80vh] w-full p-4">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2">Authentication Required</h2>
                        <p className="text-gray-500 text-sm">
                            {isAuthError ? "You need to be logged in to securely view and manage your VeriScale dashboard." : `Error: ${error}`}
                        </p>
                    </div>
                    <Link href="/login" className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 shadow-sm mt-4">
                        Go to Login
                    </Link>
                </div>
            </div>
        )
    }

    const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalProfit = transactions.reduce((acc, t) => acc + t.totalProfit, 0);
    const totalSalesCount = transactions.length;

    return (
        <div className="bg-[#FBFBFB] p-3 md:p-8 font-sans w-full min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                
                {/* Header Section */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
                    <p className="mt-1 md:mt-2 text-sm text-gray-600">Track and manage your business transactions effortlessly.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</h3>
                        <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Profit</h3>
                        <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900">₦{totalProfit.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 sm:col-span-2 md:col-span-1">
                        <h3 className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">Total Sales</h3>
                        <p className="mt-2 text-2xl md:text-3xl font-bold text-gray-900">{totalSalesCount}</p>
                    </div>
                </div>

                {/* Main Content Grid: Form on left, Table on right on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* Record Transaction Form */}
                    <div className="lg:col-span-1">
                        <form onSubmit={handleRecordTransaction} className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-200 sticky top-6">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-5 md:mb-6">Record New Sale</h2>
                            <div className="space-y-4 md:space-y-5">
                                <div className="flex flex-col space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        placeholder="e.g. Wireless Mouse"
                                        className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Selling Price</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemPrice}
                                            onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="₦0"
                                            className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Cost Price</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={itemCostPrice}
                                            onChange={(e) => setItemCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="₦0"
                                            className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={transactionDate}
                                            onChange={(e) => setTransactionDate(e.target.value)}
                                            className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 mt-4 text-sm font-semibold tracking-wide text-gray-900 transition-colors duration-300 bg-[#C5BAFF] rounded-lg hover:bg-[#b0a1f8] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#C5BAFF]/50 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-gray-900" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            <span>Recording...</span>
                                        </>
                                    ) : (
                                        "Record Sale"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Transactions Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6">Recent Transactions</h2>
                            {transactions.length === 0 ? (
                                <div className="text-center py-10 md:py-16 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    There are no transactions yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto pb-24 -mx-5 md:-mx-6 px-5 md:px-6">
                                    <table className="w-full text-sm text-left text-gray-500 min-w-[500px]">
                                        <thead className="text-xs text-gray-700 uppercase bg-[#E8F9FF] rounded-t-lg">
                                            <tr>
                                                <th className="px-4 md:px-6 py-4 font-semibold tracking-wider rounded-tl-lg">Items</th>
                                                <th className="px-4 md:px-6 py-4 font-semibold tracking-wider">Date</th>
                                                <th className="px-4 md:px-6 py-4 font-semibold tracking-wider">Amount</th>
                                                <th className="px-4 md:px-6 py-4 font-semibold tracking-wider">Profit</th>
                                                <th className="px-4 md:px-6 py-4 font-semibold tracking-wider text-right rounded-tr-lg">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-[#E8F9FF]/30 transition-colors group">
                                                    <td className="px-4 md:px-6 py-4 font-medium text-gray-900">{tx.items}</td>
                                                    <td className="px-4 md:px-6 py-4 text-gray-600">
                                                        <div className="flex flex-col">
                                                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                                                            <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 text-gray-800 font-medium">₦{tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-4 md:px-6 py-4 text-green-600 font-medium">₦{tx.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-4 md:px-6 py-4 text-right relative">
                                                        <button 
                                                            onClick={() => {
                                                                setActiveDropdown(activeDropdown?.type === 'transaction' && activeDropdown.id === tx.id ? null : { type: 'transaction', id: tx.id })
                                                            }} 
                                                            className="text-gray-400 hover:text-gray-900 p-1.5 md:p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none relative z-10"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        {activeDropdown?.type === 'transaction' && activeDropdown.id === tx.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setActiveDropdown(null)}></div>
                                                                <div className="absolute right-8 top-10 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1.5 text-left transform origin-top-right transition-all">
                                                                    <button 
                                                                        onClick={() => { setActiveDropdown(null); deleteTransaction(tx.id); }}
                                                                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                                                                    >
                                                                        <Trash2 size={16} /> Delete
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}