'use client'

import { supabase } from "@/libs/supabase"
import { Product, ProductVariant, salesTransaction, ProductAnalytics } from "@/types"
import { useEffect, useState, useMemo, useCallback } from "react"
import { 
    MoreVertical, 
    Trash2, 
    Plus, 
    Pencil,
    ChevronDown, 
    ChevronUp, 
    Calculator, 
    AlertCircle, 
    CheckCircle2, 
    X, 
    TrendingUp, 
    DollarSign, 
    ShoppingBag, 
    Boxes,
} from "lucide-react"
import Link from "next/link"

// Helper to parse product name and encoded units from Supabase
function parseProductRecord(row: any): Product {
    const rawName: string = row.name || ''
    
    // Check if name is formatted as: "Product Name (Unit 1 | Unit 2 | Unit 3)"
    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/)
    if (match) {
        const cleanName = match[1].trim()
        const unitsList = match[2].split('|').map(u => u.trim()).filter(Boolean)
        return {
            id: String(row.id),
            name: cleanName,
            variants: unitsList.map((unitName, idx) => ({
                id: `${row.id}-v${idx}`,
                product_id: String(row.id),
                unit_name: unitName
            }))
        }
    }

    // Check localStorage cache as fallback
    let cachedUnits: string[] = []
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(`veriscale_units_${row.id}`)
            if (raw) cachedUnits = JSON.parse(raw)
        } catch {}
    }

    const unitsList = cachedUnits.length > 0 ? cachedUnits : ['Standard Unit']
    return {
        id: String(row.id),
        name: rawName,
        variants: unitsList.map((unitName, idx) => ({
            id: `${row.id}-v${idx}`,
            product_id: String(row.id),
            unit_name: unitName
        }))
    }
}

export default function Dashboard() {
    // Data State
    const [products, setProducts] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<salesTransaction[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    // Quick Record Sale Form State
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [selectedVariantId, setSelectedVariantId] = useState<string>('')
    const [sellingPrice, setSellingPrice] = useState<number | ''>('')
    const [costPrice, setCostPrice] = useState<number | ''>('')
    const [quantity, setQuantity] = useState<number | ''>(1)
    const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [activeDropdown, setActiveDropdown] = useState<{ type: 'transaction', id: string } | null>(null)

    // Breakdown Accordion States for Metric Cards
    const [showRevenueBreakdown, setShowRevenueBreakdown] = useState<boolean>(false)
    const [showProfitBreakdown, setShowProfitBreakdown] = useState<boolean>(false)

    // Modal State for Goods & Units (Create & Edit)
    const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [newProductName, setNewProductName] = useState<string>('')
    const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false)
    const [unitNames, setUnitNames] = useState<string[]>([
        'Full Bag',
        '1/2 Bag',
        '1/4 Bag',
    ])

    // Fetch live user data from Supabase
    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Check Authentication First
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                setError("Authentication Required. Please log in to manage your sales dashboard.")
                setLoading(false)
                return
            }

            // 2. Fetch Transactions for this user
            const { data: dbTransaction, error: tranError } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
            
            if (tranError) throw tranError

            if (dbTransaction) {
                const formattedTransactions: salesTransaction[] = dbTransaction.map((t: any) => ({
                    id: String(t.id),
                    date: t.date,
                    items: t.items || 'Sales Item: 1',
                    totalAmount: Number(t.total_amount) || 0,
                    totalProfit: Number(t.total_profit) || 0,
                }))
                setTransactions(formattedTransactions)
            } else {
                setTransactions([])
            }

            // 3. Fetch Products for this user (directly from products table, no external variant table dependency)
            const { data: dbProducts, error: prodError } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (!prodError && dbProducts && dbProducts.length > 0) {
                const formattedProducts: Product[] = dbProducts.map(parseProductRecord)
                setProducts(formattedProducts)
                
                // Auto-select first product & variant
                setSelectedProductId(formattedProducts[0].id)
                if (formattedProducts[0].variants && formattedProducts[0].variants.length > 0) {
                    setSelectedVariantId(formattedProducts[0].variants[0].id)
                } else {
                    setSelectedVariantId('')
                }
            } else {
                // User has no products yet
                setProducts([])
                setSelectedProductId('')
                setSelectedVariantId('')
            }

        } catch (err: any) {
            console.error('Error loading data from Supabase:', err)
            setError(err.message || 'Failed to fetch data from Supabase')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()

        // Auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                setError("Authentication Required. Please log in to manage your sales dashboard.")
                setTransactions([])
                setProducts([])
                setLoading(false)
            } else {
                fetchData()
            }
        })

        return () => subscription.unsubscribe()
    }, [fetchData])

    // Active selected product and variant references
    const activeProduct = useMemo(() => {
        return products.find(p => p.id === selectedProductId) || null
    }, [products, selectedProductId])

    const activeVariant = useMemo(() => {
        if (!activeProduct || !activeProduct.variants) return null
        return activeProduct.variants.find(v => v.id === selectedVariantId) || activeProduct.variants[0] || null
    }, [activeProduct, selectedVariantId])

    // When product selection changes, select its first variant automatically
    function handleProductChange(newProdId: string) {
        if (newProdId === '__ADD_NEW__') {
            handleOpenCreateModal()
            return
        }
        setSelectedProductId(newProdId)
        const prod = products.find(p => p.id === newProdId)
        if (prod && prod.variants && prod.variants.length > 0) {
            setSelectedVariantId(prod.variants[0].id)
        } else {
            setSelectedVariantId('')
        }
    }

    // Modal open handlers
    async function handleOpenCreateModal() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError("Authentication Required. Please log in to add goods and units.")
            return
        }
        setEditingProduct(null)
        setNewProductName('')
        setUnitNames(['Full Bag', '1/2 Bag', '1/4 Bag'])
        setIsProductModalOpen(true)
    }

    async function handleOpenEditModal(prod: Product) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError("Authentication Required. Please log in to edit goods and units.")
            return
        }
        setEditingProduct(prod)
        setNewProductName(prod.name)
        const existingUnits = prod.variants && prod.variants.length > 0 
            ? prod.variants.map(v => v.unit_name) 
            : ['Standard Unit']
        setUnitNames(existingUnits)
        setIsProductModalOpen(true)
    }

    // Delete Product handler
    async function handleDeleteProduct(prodId: string, prodName: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError("Authentication Required. Please log in to delete goods.")
            return
        }

        if (!confirm(`Are you sure you want to delete "${prodName}" and all its defined units?`)) return
        try {
            const { error: delError } = await supabase.from('products').delete().eq('id', prodId)
            if (delError) throw delError

            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(`veriscale_units_${prodId}`)
                } catch {}
            }

            setProducts(prev => {
                const remaining = prev.filter(p => p.id !== prodId)
                if (selectedProductId === prodId) {
                    if (remaining.length > 0) {
                        setSelectedProductId(remaining[0].id)
                        setSelectedVariantId(remaining[0].variants?.[0]?.id || '')
                    } else {
                        setSelectedProductId('')
                        setSelectedVariantId('')
                    }
                }
                return remaining
            })

            alert(`"${prodName}" deleted successfully.`)
        } catch (err: any) {
            console.error('Delete product error:', err)
            alert(err.message || `Failed to delete "${prodName}".`)
        }
    }

    // Live Calculations
    const qty = typeof quantity === 'number' ? quantity : (Number(quantity) || 0)
    const sellPrice = typeof sellingPrice === 'number' ? sellingPrice : (Number(sellingPrice) || 0)
    const buyPrice = typeof costPrice === 'number' ? costPrice : (Number(costPrice) || 0)

    const liveTotalAmount = Math.round(qty * sellPrice * 100) / 100
    const liveTotalProfit = Math.round(qty * (sellPrice - buyPrice) * 100) / 100

    // Grand Totals
    const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0)
    const totalProfit = transactions.reduce((acc, t) => acc + t.totalProfit, 0)
    const totalSalesCount = transactions.length

    // Per-Product Analytics Breakdown
    const productAnalytics: ProductAnalytics[] = useMemo(() => {
        const statsMap = new Map<string, { revenue: number; profit: number; salesCount: number; unitsSold: number }>()

        for (const p of products) {
            statsMap.set(p.name.toLowerCase().trim(), { revenue: 0, profit: 0, salesCount: 0, unitsSold: 0 })
        }

        for (const tx of transactions) {
            let pName = ''
            if (tx.items) {
                const match = tx.items.match(/^([^(:]+)/)
                pName = match ? match[1].trim() : tx.items.split(':')[0].trim()
            }
            if (!pName) pName = 'Other Items'

            const key = pName.toLowerCase().trim()
            const current = statsMap.get(key) || { revenue: 0, profit: 0, salesCount: 0, unitsSold: 0 }
            current.revenue += Number(tx.totalAmount) || 0
            current.profit += Number(tx.totalProfit) || 0
            current.salesCount += 1
            current.unitsSold += 1
            statsMap.set(key, current)
        }

        const analyticsList: ProductAnalytics[] = []
        statsMap.forEach((val, key) => {
            const matchedProd = products.find(p => p.name.toLowerCase().trim() === key)
            const displayName = matchedProd ? matchedProd.name : key.charAt(0).toUpperCase() + key.slice(1)

            if (val.salesCount > 0 || matchedProd) {
                analyticsList.push({
                    name: displayName,
                    revenue: val.revenue,
                    profit: val.profit,
                    salesCount: val.salesCount,
                    unitsSold: val.unitsSold,
                    revenuePercentage: totalRevenue > 0 ? (val.revenue / totalRevenue) * 100 : 0,
                    profitPercentage: totalProfit > 0 ? (val.profit / totalProfit) * 100 : 0
                })
            }
        })

        return analyticsList.sort((a, b) => b.revenue - a.revenue)
    }, [products, transactions, totalRevenue, totalProfit])

    // Quick Preset Quantity Helpers
    const presetQuantities = [1, 2, 3, 5, 10]

    // Delete Transaction
    async function deleteTransaction(id: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError("Authentication Required. Please log in to delete transactions.")
            return
        }

        if (!confirm('Are you sure you want to delete this transaction?')) return
        try {
            const parsedId = isNaN(Number(id)) ? id : Number(id)
            const { error: delError } = await supabase.from('transactions').delete().eq('id', parsedId).select()
            if (delError) throw delError

            setTransactions(prev => prev.filter(t => t.id !== id))
            alert('Transaction deleted successfully')
        } catch (err: any) {
            console.error('Delete transaction error:', err)
            alert(err.message || 'Failed to delete transaction.')
        }
    }

    // Submit Quick Record Sale
    async function handleRecordSale(e: React.FormEvent) {
        e.preventDefault()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError("Authentication Required. Please log in to record sales.")
            return
        }

        if (!activeProduct || !activeVariant) {
            alert('Please select a valid product and portion unit.')
            return
        }

        if (sellPrice < 0) {
            alert('Please enter a valid selling price.')
            return
        }

        if (qty <= 0) {
            alert('Please specify a quantity greater than zero.')
            return
        }

        setIsSubmitting(true)

        try {
            const itemsString = `${activeProduct.name} (${activeVariant.unit_name}): ${qty}`

            // Insert strictly into available columns: user_id, date, items, total_amount, total_profit
            const payload: any = {
                user_id: user.id,
                date: new Date(transactionDate).toISOString(),
                items: itemsString,
                total_amount: liveTotalAmount,
                total_profit: liveTotalProfit,
            }

            const { data, error: txError } = await supabase.from('transactions').insert([payload]).select()
            if (txError) throw txError

            const newTxId = data && data[0] ? String(data[0].id) : Math.random().toString()

            const newTx: salesTransaction = {
                id: newTxId,
                date: new Date(transactionDate).toISOString(),
                items: itemsString,
                totalAmount: liveTotalAmount,
                totalProfit: liveTotalProfit,
            }

            setTransactions(prev => [newTx, ...prev])

            // Reset inputs for next sale
            setSellingPrice('')
            setCostPrice('')
            setQuantity(1)
            alert(`Sale recorded! ${activeProduct.name} (${activeVariant.unit_name}) × ${qty} for ₦${liveTotalAmount.toLocaleString()}`)
        } catch (err: any) {
            console.error('Record sale error:', err)
            alert(err.message || 'Failed to record sale.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Preset unit loaders for the Product Setup Modal
    function applyUnitPreset(type: 'bags' | 'weight' | 'pieces') {
        if (type === 'bags') {
            setUnitNames(['Full Bag', '1/2 Bag', '1/4 Bag'])
        } else if (type === 'weight') {
            setUnitNames(['1 Kg', '1/2 Kg', '1/4 Kg'])
        } else if (type === 'pieces') {
            setUnitNames(['Single Piece', 'Pack', 'Carton'])
        }
    }

    function addUnitRow() {
        setUnitNames(prev => [...prev, ''])
    }

    function removeUnitRow(index: number) {
        if (unitNames.length <= 1) {
            alert('A product must have at least one unit/portion.')
            return
        }
        setUnitNames(prev => prev.filter((_, i) => i !== index))
    }

    function updateUnitName(index: number, value: string) {
        setUnitNames(prev => prev.map((u, i) => i === index ? value : u))
    }

    // Save New or Edited Product & Units
    async function handleSaveProduct(e: React.FormEvent) {
        e.preventDefault()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError("Authentication Required. Please log in to manage goods and units.")
            setIsProductModalOpen(false)
            return
        }

        if (!newProductName.trim()) {
            alert('Please enter a product name (e.g. Rice, Fabric, Sugar).')
            return
        }

        const validUnits = unitNames.map(u => u.trim()).filter(u => u !== '')
        if (validUnits.length === 0) {
            alert('Please enter at least one unit or portion name.')
            return
        }

        setIsSavingProduct(true)

        try {
            const unitsString = validUnits.join(' | ')
            const encodedName = `${newProductName.trim()} (${unitsString})`

            if (editingProduct) {
                // EDIT EXISTING PRODUCT
                const targetId = editingProduct.id

                const { error: prodUpdateErr } = await supabase
                    .from('products')
                    .update({ 
                        name: encodedName,
                        price: 0,
                        cost_price: 0,
                        stock: 0
                    })
                    .eq('id', targetId)

                if (prodUpdateErr) throw prodUpdateErr

                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(`veriscale_units_${targetId}`, JSON.stringify(validUnits))
                    } catch {}
                }

                const updatedVariants: ProductVariant[] = validUnits.map((unitName, idx) => ({
                    id: `${targetId}-v${idx}`,
                    product_id: targetId,
                    unit_name: unitName
                }))

                setProducts(prev => prev.map(p => {
                    if (p.id === targetId) {
                        return {
                            ...p,
                            name: newProductName.trim(),
                            variants: updatedVariants
                        }
                    }
                    return p
                }))

                if (selectedProductId === targetId) {
                    if (updatedVariants.length > 0 && !updatedVariants.some(v => v.id === selectedVariantId)) {
                        setSelectedVariantId(updatedVariants[0].id)
                    }
                }

                alert(`"${newProductName.trim()}" updated successfully!`)
            } else {
                // CREATE NEW PRODUCT
                const { data: prodData, error: prodErr } = await supabase
                    .from('products')
                    .insert([
                        {
                            name: encodedName,
                            user_id: user.id,
                            price: 0,
                            cost_price: 0,
                            stock: 0
                        }
                    ])
                    .select()

                if (prodErr) throw prodErr
                if (!prodData || !prodData[0]) throw new Error("Failed to create product record.")

                const createdProductId = String(prodData[0].id)

                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(`veriscale_units_${createdProductId}`, JSON.stringify(validUnits))
                    } catch {}
                }

                const createdVariants: ProductVariant[] = validUnits.map((unitName, idx) => ({
                    id: `${createdProductId}-v${idx}`,
                    product_id: createdProductId,
                    unit_name: unitName
                }))

                const newProductObj: Product = {
                    id: createdProductId,
                    name: newProductName.trim(),
                    variants: createdVariants
                }

                setProducts(prev => [newProductObj, ...prev])
                setSelectedProductId(createdProductId)
                if (createdVariants.length > 0) {
                    setSelectedVariantId(createdVariants[0].id)
                }

                alert(`"${newProductObj.name}" added successfully!`)
            }

            // Close modal & reset form
            setIsProductModalOpen(false)
            setEditingProduct(null)
            setNewProductName('')
            setUnitNames(['Full Bag', '1/2 Bag', '1/4 Bag'])
        } catch (err: any) {
            console.error('Failed to save product:', err)
            alert(err.message || 'Failed to save product.')
        } finally {
            setIsSavingProduct(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-[#FBFBFB] p-4 md:p-8 font-sans w-full">
                <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-pulse">
                    <div className="flex justify-between items-center">
                        <div className="h-8 bg-gray-200 rounded-md w-48 md:w-64"></div>
                        <div className="h-10 bg-gray-200 rounded-xl w-36"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="h-28 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                        <div className="lg:col-span-2 h-96 bg-white rounded-xl shadow-sm border border-gray-200"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        const isAuthError = error.toLowerCase().includes('log in') || error.toLowerCase().includes('login') || error.toLowerCase().includes('session') || error.toLowerCase().includes('unauthorized') || error.toLowerCase().includes('authentication')
        return (
            <div className="flex items-center justify-center min-h-[80vh] w-full p-4">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-blue-500" />
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

    return (
        <div className="bg-[#FBFBFB] p-3 md:p-8 font-sans w-full min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Sales & Analytics Overview</h1>
                        <p className="mt-1 text-sm text-gray-600">Record sales, track units and portions, and monitor your profit effortlessly.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all hover:shadow duration-200"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>State Your Goods & Units</span>
                        </button>
                    </div>
                </div>

                {/* Metrics Cards with Per-Product Breakdown Accordions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    
                    {/* 1. Total Revenue Card with Dropdown */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200">
                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</span>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                ₦{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setShowRevenueBreakdown(!showRevenueBreakdown)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                                >
                                    <span>{showRevenueBreakdown ? "Hide product breakdown" : "View breakdown by product"}</span>
                                    {showRevenueBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <span className="text-xs text-gray-400">{productAnalytics.length} goods</span>
                            </div>
                        </div>

                        {/* Revenue Accordion Breakdown List */}
                        {showRevenueBreakdown && (
                            <div className="bg-gray-50/70 border-t border-gray-100 p-4 space-y-3">
                                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Revenue Earned per Product</h4>
                                {productAnalytics.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No product revenue recorded yet.</p>
                                ) : (
                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                        {productAnalytics.map((item, idx) => (
                                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs space-y-1.5">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-gray-800 truncate max-w-[140px]">{item.name}</span>
                                                    <span className="font-bold text-gray-900">₦{item.revenue.toLocaleString()}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
                                                        style={{ width: `${Math.min(100, Math.max(3, item.revenuePercentage))}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[11px] text-gray-400">
                                                    <span>{item.salesCount} {item.salesCount === 1 ? 'sale' : 'sales'}</span>
                                                    <span>{item.revenuePercentage.toFixed(1)}% of total</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. Total Profit Card with Dropdown */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200">
                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Profit</span>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl md:text-3xl font-extrabold text-emerald-600 tracking-tight">
                                ₦{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => setShowProfitBreakdown(!showProfitBreakdown)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors focus:outline-none"
                                >
                                    <span>{showProfitBreakdown ? "Hide product breakdown" : "View breakdown by product"}</span>
                                    {showProfitBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <span className="text-xs text-gray-400">
                                    {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : '0% margin'}
                                </span>
                            </div>
                        </div>

                        {/* Profit Accordion Breakdown List */}
                        {showProfitBreakdown && (
                            <div className="bg-emerald-50/30 border-t border-gray-100 p-4 space-y-3">
                                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Net Profit Earned per Product</h4>
                                {productAnalytics.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No product profit recorded yet.</p>
                                ) : (
                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                        {productAnalytics.map((item, idx) => {
                                            const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0'
                                            return (
                                                <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs space-y-1.5">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-semibold text-gray-800 truncate max-w-[140px]">{item.name}</span>
                                                        <span className="font-bold text-emerald-600">₦{item.profit.toLocaleString()}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                                            style={{ width: `${Math.min(100, Math.max(3, item.profitPercentage))}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] text-gray-400">
                                                        <span>{margin}% margin</span>
                                                        <span>{item.profitPercentage.toFixed(1)}% of total profit</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. Total Sales Card */}
                    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Sales</span>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                            </div>
                            <p className="mt-2 text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                {totalSalesCount} <span className="text-sm font-normal text-gray-500">completed</span>
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Average Ticket:</span>
                            <span className="font-semibold text-gray-800">
                                ₦{totalSalesCount > 0 ? (totalRevenue / totalSalesCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                            </span>
                        </div>
                    </div>

                </div>

                {/* Main Content Grid: Record Sale Form on left, Transactions on right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                    
                    {/* RECORD SALE FORM */}
                    <div className="lg:col-span-1">
                        <form onSubmit={handleRecordSale} className="bg-white p-5 md:p-7 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                            
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Record New Sale</h2>
                                    <p className="text-xs text-gray-500">Select product & portion, enter prices</p>
                                </div>
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Calculator className="w-4 h-4" />
                                </div>
                            </div>

                            {/* 1. Product Dropdown */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Select Product</label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                >
                                    {products.length === 0 ? (
                                        <option value="">No goods found (Add one below)</option>
                                    ) : (
                                        products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))
                                    )}
                                    <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ State New Goods & Units...</option>
                                </select>
                            </div>

                            {/* 2. Portion / Unit Dropdown */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit / Portion Sold</label>
                                <select
                                    value={selectedVariantId}
                                    onChange={(e) => setSelectedVariantId(e.target.value)}
                                    disabled={!activeProduct || !activeProduct.variants || activeProduct.variants.length === 0}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none disabled:opacity-50"
                                >
                                    {(!activeProduct || !activeProduct.variants || activeProduct.variants.length === 0) ? (
                                        <option value="">No units defined for this good</option>
                                    ) : (
                                        activeProduct.variants.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.unit_name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {/* 3. Selling Price & Cost Price Inputs */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Selling Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="₦0"
                                        value={sellingPrice}
                                        onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Cost Price</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="₦0"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* 4. Quantity Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Quantity</label>
                                
                                <div className="flex gap-2">
                                    {presetQuantities.map((preset) => {
                                        const isSelected = qty === preset
                                        return (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => setQuantity(preset)}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {preset}
                                            </button>
                                        )
                                    })}
                                </div>

                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Quantity"
                                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            {/* 5. Date Picker */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Sale Date</label>
                                <input
                                    type="date"
                                    required
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:bg-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            {/* 6. Live Total & Profit Calculation */}
                            <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-600 font-medium">Total Amount:</span>
                                    <span className="font-extrabold text-sm text-indigo-950">
                                        ₦{liveTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-emerald-800 font-medium">Calculated Profit:</span>
                                    <span className="font-bold text-emerald-700">
                                        ₦{liveTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            {/* 7. Submit Action Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !activeProduct || !activeVariant}
                                className="w-full py-3.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Recording Sale...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span>{products.length === 0 ? "State Goods First" : "Record Sale Now"}</span>
                                    </>
                                )}
                            </button>

                        </form>
                    </div>

                    {/* TRANSACTIONS TABLE & GOODS DIRECTORY */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Recent Transactions Card */}
                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                                    <p className="text-xs text-gray-500">Portions, sale amounts, and net profits</p>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                                    {transactions.length} records
                                </span>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm font-medium">No sales recorded yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Select a product on the left to record your first sale.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto pb-12 -mx-5 md:-mx-6 px-5 md:px-6">
                                    <table className="w-full text-sm text-left text-gray-500 min-w-[540px]">
                                        <thead className="text-xs text-gray-700 uppercase bg-[#E8F9FF] rounded-lg">
                                            <tr>
                                                <th className="px-4 py-3.5 font-semibold rounded-l-lg">Product & Portion</th>
                                                <th className="px-4 py-3.5 font-semibold">Date</th>
                                                <th className="px-4 py-3.5 font-semibold">Total Sale</th>
                                                <th className="px-4 py-3.5 font-semibold">Net Profit</th>
                                                <th className="px-4 py-3.5 font-semibold text-right rounded-r-lg">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-4 py-3.5 font-medium text-gray-900">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-900">{tx.items}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-600 text-xs">
                                                        <div className="flex flex-col">
                                                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                                                            <span className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-900 font-semibold">
                                                        ₦{tx.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-emerald-600 font-semibold">
                                                        ₦{tx.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right relative">
                                                        <button
                                                            onClick={() => setActiveDropdown(activeDropdown?.id === tx.id ? null : { type: 'transaction', id: tx.id })}
                                                            className="text-gray-400 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                        {activeDropdown?.id === tx.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                                <div className="absolute right-4 top-10 w-28 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 text-left">
                                                                    <button
                                                                        onClick={() => { setActiveDropdown(null); deleteTransaction(tx.id); }}
                                                                        className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
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

                        {/* Master Goods & Defined Units Directory */}
                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Boxes className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-base font-bold text-gray-900">Your Goods & Defined Units</h3>
                                </div>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    + Add Goods & Units
                                </button>
                            </div>

                            {products.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-2">
                                    <Boxes className="w-8 h-8 mx-auto text-gray-300" />
                                    <p className="text-sm font-semibold text-gray-700">No goods added yet.</p>
                                    <p className="text-xs text-gray-400">Click &quot;+ Add Goods &amp; Units&quot; to state your first product.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {products.map(p => (
                                        <div key={p.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-2.5 hover:border-gray-200 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                                                    <span className="text-[11px] text-gray-500">{p.variants?.length || 0} unit options</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenEditModal(p)}
                                                        title="Edit Good & Units"
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 bg-white rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors shadow-2xs"
                                                    >
                                                        <Pencil className="w-3 h-3 text-indigo-600" />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(p.id, p.name)}
                                                        title="Delete Good"
                                                        className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-lg border border-gray-200 hover:border-red-200 transition-colors shadow-2xs"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                {p.variants?.map(v => (
                                                    <span key={v.id} className="text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md font-medium">
                                                        {v.unit_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </div>

            {/* PRODUCT SETUP & EDIT MODAL */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900">
                                    {editingProduct ? `Edit "${editingProduct.name}"` : "State Your Goods & Units"}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {editingProduct 
                                        ? "Update the product name or add/remove its selling units." 
                                        : "Name your item and the portions/units it can be sold in."}
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-5">
                            
                            {/* Product Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rice, Sugar, Fabric, Palm Oil"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            {/* Quick Unit Presets */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Unit Presets</label>
                                    <span className="text-[11px] text-gray-400">Click to autofill unit options</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => applyUnitPreset('bags')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        🌾 Bags (Full, 1/2, 1/4)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyUnitPreset('weight')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        ⚖️ Weight (1kg, 1/2kg, 1/4kg)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyUnitPreset('pieces')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                    >
                                        📦 Pieces (Single, Pack, Carton)
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Unit Rows */}
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Available Units / Portions</label>
                                    <button
                                        type="button"
                                        onClick={addUnitRow}
                                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Unit
                                    </button>
                                </div>

                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {unitNames.map((unit, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder={`e.g. Full Bag, 1/2 Bag, Cup, Kg`}
                                                value={unit}
                                                onChange={(e) => updateUnitName(idx, e.target.value)}
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:border-indigo-500 outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeUnitRow(idx)}
                                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
                                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingProduct}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
                                >
                                    {isSavingProduct ? "Saving..." : (editingProduct ? "Update Good & Units" : "Save Goods & Units")}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
    )
}