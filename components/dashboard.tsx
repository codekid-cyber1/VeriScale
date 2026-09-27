'use client'

import { supabase } from "@/libs/supabase"
import { product, salesTransaction } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MoreVertical, Trash2 } from "lucide-react"
export default function Dashboard() {
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState<number>(0);
    const [newProductCostPrice, setNewProductCostPrice] = useState<number>(0);
    const [newProductStock, setNewProductStock] = useState<number>(0);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [products, setProducts] = useState<product[]>([])
    const [transactions, setTransactions] = useState<salesTransaction[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [quantity, setQuantity] = useState<number>(1)
    const [isSubmitingSales, setIsSubmittingSales] = useState(false)
    const [editProductId, setEditProductId] = useState<string>('')
    const [editPrice, setEditPrice] = useState<number>(0)
    const [editCostPrice, setEditCostPrice] = useState<number>(0)
    const [editStock, setEditStock] = useState<number>(0)
    const [isUpdatingProduct, setIsUpdatingProduct] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<{type: 'product' | 'transaction', id: string} | null>(null)

    async function deleteProduct(id: string) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            // Convert to number if the ID is numeric (helps with Supabase int primary keys)
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const { data, error } = await supabase.from('products').delete().eq('id', parsedId).select();
            if (error) throw error;
            
            if (!data || data.length === 0) {
                throw new Error('Supabase blocked the deletion. This usually happens if you forgot to add a "DELETE" Row Level Security (RLS) policy in your Supabase dashboard.');
            }
            
            setProducts(products.filter(p => p.id !== id));
            if (selectedProductId === id) setSelectedProductId('');
            alert('Product deleted successfully');
        } catch (err: any) {
            alert('Failed to delete product: ' + err.message);
        }
    }

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
    }    async function handleCreateProduct(e: React.FormEvent) {
        e.preventDefault()
        if (!newProductName.trim()) {
            alert('please enter a product name')
            return;
        }
        setIsCreatingProduct(true);
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User must log in first')
            const { data, error } = await supabase.from('products').insert([
                {
                    name: newProductName,
                    price: newProductPrice,
                    cost_price: newProductCostPrice,
                    stock: newProductStock,
                    user_id: user.id
                }
            ]).select()
            if (error) throw error

            if (data && data[0]) {
                const added = {
                    id: String(data[0].id),
                    name: data[0].name,
                    price: Number(data[0].price),
                    costPrice: Number(data[0].cost_price),
                    stock: Number(data[0].stock)
                };
                setProducts([...products, added])
                if (!selectedProductId) setSelectedProductId(added.id)
            }
            setNewProductName('');
            setNewProductPrice(0);
            setNewProductCostPrice(0);
            setNewProductStock(0);
            alert("Product added to your inventory!");
        } catch (error: any) {
            console.error('error creating product:', error)
            setError(error.message || 'Faild to add the product')
        } finally {
            setIsCreatingProduct(false)
        }
    }


    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const { data: dbProduct, error: prodError } = await supabase.from('products').select('*')
                if (prodError) throw prodError
                if (dbProduct) {
                    const formattedData = dbProduct.map((p) => ({
                        id: String(p.id),
                        name: p.name,
                        price: Number(p.price),
                        costPrice: Number(p.cost_price),
                        stock: Number(p.stock)
                    }))
                    setProducts(formattedData)
                    if (formattedData.length > 0) {
                        setSelectedProductId(formattedData[0].id)
                    }
                }
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
                setError(error.message || 'faild to get the data form the super base')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])
    if (loading) {
        return (
            <div className="bg-[#FBFBFB] p-6 md:p-10 font-sans">
                <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                    <div>
                        <div className="h-8 bg-gray-200 rounded-md w-64 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-96"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                    </div>

                    <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 bg-white">
                        <div className="w-full h-12 bg-[#E8F9FF] border-b border-gray-200"></div>
                        <div className="divide-y divide-gray-200">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex p-4">
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-2"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 max-w-lg space-y-6">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
                        <div className="space-y-4">
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                            <div className="h-12 bg-gray-200 rounded w-full mt-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen w-screen">
                <div className=" rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500">Error: {error}</div>
            </div>
        )
    }
    const correntProduct = products.find((p) => p.id === selectedProductId)
    const maxStock = correntProduct ? correntProduct.stock : 0


    async function handleRecordSale(e: React.FormEvent) {
        e.preventDefault();

        const productToSell = products.find((p) => p.id === selectedProductId)

        if (!productToSell) {
            alert('Please select a valid product')
            return;
        }
        if (quantity > productToSell.stock) {
            alert('not enough stock avaliable')
            return;
        }
        setIsSubmittingSales(true)
        const totalAmount = quantity * productToSell.price
        const totalProfit = quantity * (productToSell.price - productToSell.costPrice)
        const newStock = productToSell.stock - quantity

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('user session expired,Please login in')
            const { error: txError } = await supabase.from('transactions').insert([
                {
                    date: new Date().toISOString(),
                    items: `${quantity} X ${productToSell.name}`,
                    total_amount: totalAmount,
                    total_profit: totalProfit,
                    user_id: user.id

                }
            ])
            if (txError) throw txError;
            const { error: stockError } = await supabase.from('products').update({ stock: newStock }).eq('id', selectedProductId)

            if (stockError) throw stockError;

            const newTx: salesTransaction = {
                id: Math.random().toString(),
                date: new Date().toISOString(),
                items: `${quantity} X ${productToSell.name}`,
                totalAmount: totalAmount,
                totalProfit: totalProfit
            };

            setTransactions([newTx, ...transactions]);
            setProducts(products.map((p) => p.id === selectedProductId ? { ...p, stock: newStock } : p))
            setQuantity(1);
        } catch (error: any) {
            alert('failed to recieve sales' + error.message)
        } finally {
            setIsSubmittingSales(false)
        }
    }

    const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
    const totalProfit = transactions.reduce((acc, t) => acc + t.totalProfit, 0);
    const totalSalesCount = transactions.length;

    function handleSelectedProductToEdit(productId: string) {
        setEditProductId(productId)
        const prod = products.find((p) => p.id === productId);
        if (prod) {
            setEditPrice(prod.price)
            setEditCostPrice(prod.costPrice)
            setEditStock(prod.stock)
        }
    }
    async function updateProduct(e: React.FormEvent) {
        e.preventDefault();
        setIsUpdatingProduct(true);
        try {
            const { error: updateError } = await supabase.from('products').update({
                price: editPrice,
                cost_price: editCostPrice,
                stock: editStock
            }).eq('id', editProductId)
            if (updateError) throw updateError;

            setProducts(
                products.map((p) =>
                    p.id === editProductId ? { ...p, price: editPrice, costPrice: editCostPrice, stock: editStock } : p
                )
            )
            alert('Product Updated Succesfully')
        } catch (error: any) {
            console.error('failed to update products', error)
            alert('Error Updating Products:' + error.message)
        } finally {
            setIsUpdatingProduct(false)
        }


    }

    return (
        <div className="bg-[#FBFBFB] p-6 md:p-10 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">Add A New Product</h2>
                    <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                            <input type="text" value={newProductName} required onChange={(e) => setNewProductName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50" placeholder="e.g. Premium Wireless Headphones" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500">₦</span>
                                <input type="number" min={0} value={newProductPrice || ''} required onChange={(e) => setNewProductPrice(Number(e.target.value))} className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50" placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500">₦</span>
                                <input type="number" min={0} value={newProductCostPrice || ''} required onChange={(e) => setNewProductCostPrice(Number(e.target.value))} className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50" placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
                            <input type="number" min={0} value={newProductStock || ''} required onChange={(e) => setNewProductStock(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50" placeholder="0" />
                        </div>
                        <div className="flex items-end justify-start">
                            <button type="submit" disabled={isCreatingProduct} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isCreatingProduct ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Adding...
                                    </span>
                                ) : 'Create Product'}
                            </button>
                        </div>
                    </form>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
                    <p className="mt-2 text-sm text-gray-600">Manage your products and record sales seamlessly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">₦{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Profit</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">₦{totalProfit.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Sales</h3>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{totalSalesCount}</p>
                    </div>
                </div>

                <div className="overflow-visible rounded-xl shadow-sm border border-gray-200 bg-white">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-[#E8F9FF]">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Product Name</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Cost Price</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {products.map((p) => (
                                <tr key={p.id} className="bg-white hover:bg-[#E8F9FF]/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                                    <td className="px-6 py-4 text-gray-600">₦{p.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-gray-600">₦{p.costPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 10 ? 'bg-green-100 text-green-800' : p.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.stock} in stock
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button 
                                            onClick={() => {
                                                setActiveDropdown(activeDropdown?.type === 'product' && activeDropdown.id === p.id ? null : { type: 'product', id: p.id })
                                            }} 
                                            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none relative z-50"
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {activeDropdown?.type === 'product' && activeDropdown.id === p.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                <div className="absolute right-10 top-10 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1.5 text-left">
                                                    <button 
                                                        onClick={() => { setActiveDropdown(null); deleteProduct(p.id); }}
                                                        className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors relative z-50"
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

                <form onSubmit={handleRecordSale} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 max-w-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Record New Sale</h2>
                    <div className="space-y-5">
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Select Product</label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors cursor-pointer"
                            >
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Stock: {p.stock})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                max={maxStock}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="block w-full px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-[#C4D9FF] focus:ring-[#C4D9FF] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-3 mt-2 text-sm font-semibold tracking-wide text-gray-900 transition-colors duration-300 bg-[#C5BAFF] rounded-lg hover:bg-[#b0a1f8] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#C5BAFF]/50 shadow-sm"
                        >{isSubmitingSales ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Transactions</h2>
                    {transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            There are no transactions yet.
                        </div>
                    ) : (
                        <div className="overflow-visible">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-[#E8F9FF]">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Items</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Date</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Amount</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider">Profit</th>
                                        <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-[#E8F9FF]/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{tx.items}</td>
                                            <td className="px-6 py-4 text-gray-600">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="px-6 py-4 text-gray-600">₦{tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-gray-600">₦{tx.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-right relative">
                                                <button 
                                                    onClick={() => {
                                                        setActiveDropdown(activeDropdown?.type === 'transaction' && activeDropdown.id === tx.id ? null : { type: 'transaction', id: tx.id })
                                                    }} 
                                                    className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none relative z-50"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                {activeDropdown?.type === 'transaction' && activeDropdown.id === tx.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                        <div className="absolute right-10 top-10 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1.5 text-left">
                                                            <button 
                                                                onClick={() => { setActiveDropdown(null); deleteTransaction(tx.id); }}
                                                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors relative z-50"
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
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Update Product Inventory</h2>

                    <form onSubmit={updateProduct} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Product to Edit</label>
                            <select
                                value={editProductId}
                                onChange={(e) => handleSelectedProductToEdit(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Choose a product --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Current Stock: {p.stock})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {editProductId && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₦)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₦)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editCostPrice}
                                        onChange={(e) => setEditCostPrice(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editStock}
                                        onChange={(e) => setEditStock(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isUpdatingProduct}
                                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition disabled:bg-gray-400"
                                    >
                                        {isUpdatingProduct ? "Saving Changes..." : "Save Product Details"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}