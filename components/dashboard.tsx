'use client'

import { supabase } from "@/libs/supabase"
import { Product, ProductVariant, salesTransaction, ProductAnalytics } from "@/types"
import { useEffect, useState, useMemo } from "react"
import { 
    MoreVertical, 
    Trash2, 
    Plus, 
    ChevronDown, 
    ChevronUp, 
    Package, 
    Layers, 
    Calculator, 
    AlertCircle, 
    CheckCircle2, 
    X, 
    TrendingUp, 
    DollarSign, 
    ShoppingBag, 
    Boxes, 
    Sparkles,
    Copy,
    Check
} from "lucide-react"
import Link from "next/link"

interface PortionRow {
    unit_name: string;
    cost_price: number | '';
    selling_price: number | '';
    stock_equivalent: number | '';
}

export default function Dashboard() {
    // Data State
    const [products, setProducts] = useState<Product[]>([])
    const [transactions, setTransactions] = useState<salesTransaction[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [tableNotice, setTableNotice] = useState<boolean>(false)
    const [copiedSql, setCopiedSql] = useState<boolean>(false)

    // Quick Record Sale Form State (Zero Typing Flow)
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [selectedVariantId, setSelectedVariantId] = useState<string>('')
    const [quantity, setQuantity] = useState<number | ''>(1)
    const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [activeDropdown, setActiveDropdown] = useState<{ type: 'transaction', id: string } | null>(null)

    // Breakdown Accordion States for Metric Cards
    const [showRevenueBreakdown, setShowRevenueBreakdown] = useState<boolean>(false)
    const [showProfitBreakdown, setShowProfitBreakdown] = useState<boolean>(false)

    // Modal State for "State Your Goods & Units" (Product Onboarding/Creation)
    const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false)
    const [newProductName, setNewProductName] = useState<string>('')
    const [newMasterStock, setNewMasterStock] = useState<number | ''>(50)
    const [newUnitLabel, setNewUnitLabel] = useState<string>('Bags')
    const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false)
    const [portions, setPortions] = useState<PortionRow[]>([
        { unit_name: 'Full Bag', cost_price: 70000, selling_price: 80000, stock_equivalent: 1.0 },
        { unit_name: '1/2 Bag', cost_price: 35000, selling_price: 42000, stock_equivalent: 0.5 },
        { unit_name: '1/4 Bag', cost_price: 17500, selling_price: 22000, stock_equivalent: 0.25 },
    ])

    // Load initial data
    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                // 1. Fetch Transactions
                const { data: dbTransaction, error: tranError } = await supabase
                    .from('transactions')
                    .select('*')
                    .order('date', { ascending: false })
                
                if (tranError) throw tranError

                if (dbTransaction) {
                    const formattedTransactions: salesTransaction[] = dbTransaction.map((t: any) => ({
                        id: String(t.id),
                        date: t.date,
                        items: t.items || `${t.product_name || 'Item'} (${t.variant_name || 'Standard'}): ${t.quantity || 1}`,
                        totalAmount: Number(t.total_amount) || 0,
                        totalProfit: Number(t.total_profit) || 0,
                        product_id: t.product_id,
                        product_name: t.product_name,
                        variant_name: t.variant_name,
                        quantity: Number(t.quantity) || 1,
                        unit_price: Number(t.unit_price) || 0,
                        cost_price: Number(t.cost_price) || 0
                    }))
                    setTransactions(formattedTransactions)
                }

                // 2. Fetch Products & Variants
                try {
                    const { data: dbProducts, error: prodError } = await supabase
                        .from('products')
                        .select('*, product_variants(*)')
                        .order('created_at', { ascending: false })

                    if (prodError) {
                        // Check if tables don't exist yet
                        if (prodError.message?.includes('relation') || prodError.message?.includes('does not exist')) {
                            setTableNotice(true)
                            setFallbackProducts()
                        } else {
                            throw prodError
                        }
                    } else if (dbProducts && dbProducts.length > 0) {
                        const formattedProducts: Product[] = dbProducts.map((p: any) => ({
                            id: String(p.id),
                            name: p.name,
                            stock: Number(p.stock) || 0,
                            unit_label: p.unit_label || 'Units',
                            variants: (p.product_variants || []).map((v: any) => ({
                                id: String(v.id),
                                product_id: String(v.product_id),
                                unit_name: v.unit_name,
                                cost_price: Number(v.cost_price) || 0,
                                selling_price: Number(v.selling_price) || 0,
                                stock_equivalent: Number(v.stock_equivalent) || 1.0,
                            }))
                        }))
                        setProducts(formattedProducts)
                        
                        // Auto-select first product & variant
                        if (formattedProducts.length > 0) {
                            setSelectedProductId(formattedProducts[0].id)
                            if (formattedProducts[0].variants && formattedProducts[0].variants.length > 0) {
                                setSelectedVariantId(formattedProducts[0].variants[0].id)
                            }
                        }
                    } else {
                        // Table exists but is empty
                        setProducts([])
                    }
                } catch (prodErr: any) {
                    console.warn('Could not load products from Supabase, applying local fallback:', prodErr)
                    setTableNotice(true)
                    setFallbackProducts()
                }

            } catch (err: any) {
                console.error('Error loading data from Supabase:', err)
                setError(err.message || 'Failed to fetch data from Supabase')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Fallback sample products for instant interactive testing if database tables aren't created yet
    function setFallbackProducts() {
        const sampleProducts: Product[] = [
            {
                id: 'prod-rice-01',
                name: 'Premium Basmati Rice',
                stock: 45,
                unit_label: 'Bags',
                variants: [
                    { id: 'v-rice-1', product_id: 'prod-rice-01', unit_name: 'Full Bag (50kg)', cost_price: 70000, selling_price: 82000, stock_equivalent: 1.0 },
                    { id: 'v-rice-2', product_id: 'prod-rice-01', unit_name: '1/2 Bag (25kg)', cost_price: 35000, selling_price: 43000, stock_equivalent: 0.5 },
                    { id: 'v-rice-3', product_id: 'prod-rice-01', unit_name: '1/4 Bag (12.5kg)', cost_price: 17500, selling_price: 23000, stock_equivalent: 0.25 },
                ]
            },
            {
                id: 'prod-sugar-02',
                name: 'Refined White Sugar',
                stock: 30,
                unit_label: 'Bags',
                variants: [
                    { id: 'v-sugar-1', product_id: 'prod-sugar-02', unit_name: 'Full Bag', cost_price: 65000, selling_price: 74000, stock_equivalent: 1.0 },
                    { id: 'v-sugar-2', product_id: 'prod-sugar-02', unit_name: '1/2 Bag', cost_price: 33000, selling_price: 39000, stock_equivalent: 0.5 },
                    { id: 'v-sugar-3', product_id: 'prod-sugar-02', unit_name: '1/4 Bag', cost_price: 17000, selling_price: 21000, stock_equivalent: 0.25 },
                ]
            },
            {
                id: 'prod-oil-03',
                name: 'Pure Palm Oil',
                stock: 60,
                unit_label: 'Jerrycans',
                variants: [
                    { id: 'v-oil-1', product_id: 'prod-oil-03', unit_name: '25L Jerrycan', cost_price: 28000, selling_price: 34000, stock_equivalent: 1.0 },
                    { id: 'v-oil-2', product_id: 'prod-oil-03', unit_name: '5L Gallon', cost_price: 6000, selling_price: 8000, stock_equivalent: 0.2 },
                    { id: 'v-oil-3', product_id: 'prod-oil-03', unit_name: '1L Bottle', cost_price: 1300, selling_price: 1800, stock_equivalent: 0.04 },
                ]
            }
        ]
        setProducts(sampleProducts)
        setSelectedProductId(sampleProducts[0].id)
        setSelectedVariantId(sampleProducts[0].variants![0].id)
    }

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
            setIsProductModalOpen(true)
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

    // Live Calculations
    const qty = typeof quantity === 'number' ? quantity : (Number(quantity) || 0)
    const unitPrice = activeVariant ? activeVariant.selling_price : 0
    const costPrice = activeVariant ? activeVariant.cost_price : 0
    const stockEquivalent = activeVariant ? activeVariant.stock_equivalent : 1.0

    const liveTotalAmount = Math.round(qty * unitPrice * 100) / 100
    const liveTotalProfit = Math.round(qty * (unitPrice - costPrice) * 100) / 100
    const liveStockDeduction = Number((qty * stockEquivalent).toFixed(4))
    const liveRemainingStock = activeProduct ? Number((activeProduct.stock - liveStockDeduction).toFixed(2)) : 0

    // Grand Totals
    const totalRevenue = transactions.reduce((acc, t) => acc + t.totalAmount, 0)
    const totalProfit = transactions.reduce((acc, t) => acc + t.totalProfit, 0)
    const totalSalesCount = transactions.length

    // Per-Product Analytics Breakdown
    const productAnalytics: ProductAnalytics[] = useMemo(() => {
        const statsMap = new Map<string, { revenue: number; profit: number; salesCount: number; unitsSold: number }>()

        // Ensure all registered products have an entry
        for (const p of products) {
            statsMap.set(p.name.toLowerCase().trim(), { revenue: 0, profit: 0, salesCount: 0, unitsSold: 0 })
        }

        // Aggregate from transactions
        for (const tx of transactions) {
            let pName = tx.product_name || ''
            if (!pName && tx.items) {
                const match = tx.items.match(/^([^(:]+)/)
                pName = match ? match[1].trim() : tx.items.split(':')[0].trim()
            }
            if (!pName) pName = 'Other Items'

            const key = pName.toLowerCase().trim()
            const current = statsMap.get(key) || { revenue: 0, profit: 0, salesCount: 0, unitsSold: 0 }
            current.revenue += Number(tx.totalAmount) || 0
            current.profit += Number(tx.totalProfit) || 0
            current.salesCount += 1
            current.unitsSold += Number(tx.quantity) || 1
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

    // Preset Quantity Helpers
    const presetQuantities = [
        { label: '1/4', value: 0.25 },
        { label: '1/2', value: 0.5 },
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '3', value: 3 },
        { label: '5', value: 5 },
    ]

    // Delete Transaction
    async function deleteTransaction(id: string) {
        if (!confirm('Are you sure you want to delete this transaction?')) return
        try {
            const parsedId = isNaN(Number(id)) ? id : Number(id)
            const { data, error } = await supabase.from('transactions').delete().eq('id', parsedId).select()
            if (error) throw error

            setTransactions(prev => prev.filter(t => t.id !== id))
            alert('Transaction deleted successfully')
        } catch (err: any) {
            console.error('Delete error:', err)
            // If local fallback item
            setTransactions(prev => prev.filter(t => t.id !== id))
            alert('Transaction removed.')
        }
    }

    // Submit Quick Record Sale (Zero Typing)
    async function handleRecordSale(e: React.FormEvent) {
        e.preventDefault()

        if (!activeProduct || !activeVariant) {
            alert('Please select a valid product and portion variant.')
            return
        }

        if (qty <= 0) {
            alert('Please specify a quantity greater than zero.')
            return
        }

        setIsSubmitting(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id || null

            const itemsString = `${activeProduct.name} (${activeVariant.unit_name}): ${qty}`

            const payload: any = {
                date: new Date(transactionDate).toISOString(),
                items: itemsString,
                total_amount: liveTotalAmount,
                total_profit: liveTotalProfit,
                product_id: activeProduct.id.startsWith('prod-') ? null : activeProduct.id,
                product_name: activeProduct.name,
                variant_name: activeVariant.unit_name,
                quantity: qty,
                unit_price: unitPrice,
                cost_price: costPrice,
            }

            if (userId) {
                payload.user_id = userId
            }

            const { data, error: txError } = await supabase.from('transactions').insert([payload]).select()

            let newTxId = Math.random().toString()
            if (!txError && data && data[0]) {
                newTxId = String(data[0].id)
            }

            // Deduct master stock in Supabase if not fallback
            if (!activeProduct.id.startsWith('prod-')) {
                const nextStock = Math.max(0, liveRemainingStock)
                await supabase.from('products').update({ stock: nextStock }).eq('id', activeProduct.id)
            }

            // Update local state immediately
            const newTx: salesTransaction = {
                id: newTxId,
                date: new Date(transactionDate).toISOString(),
                items: itemsString,
                totalAmount: liveTotalAmount,
                totalProfit: liveTotalProfit,
                product_id: activeProduct.id,
                product_name: activeProduct.name,
                variant_name: activeVariant.unit_name,
                quantity: qty,
                unit_price: unitPrice,
                cost_price: costPrice
            }

            setTransactions(prev => [newTx, ...prev])

            // Deduct local product stock
            setProducts(prev => prev.map(p => {
                if (p.id === activeProduct.id) {
                    return { ...p, stock: Math.max(0, liveRemainingStock) }
                }
                return p
            }))

            // Reset quantity to 1
            setQuantity(1)
            alert(`Sale recorded! ${activeProduct.name} (${activeVariant.unit_name}) × ${qty} for ₦${liveTotalAmount.toLocaleString()}`)
        } catch (err: any) {
            console.error('Record sale error:', err)
            alert(err.message || 'Failed to record sale.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Preset loaders for the Product Creator Modal
    function applyPortionPreset(type: 'bags' | 'kg' | 'pieces') {
        if (type === 'bags') {
            setNewUnitLabel('Bags')
            setPortions([
                { unit_name: 'Full Bag', cost_price: 70000, selling_price: 80000, stock_equivalent: 1.0 },
                { unit_name: '1/2 Bag', cost_price: 35000, selling_price: 42000, stock_equivalent: 0.5 },
                { unit_name: '1/4 Bag', cost_price: 17500, selling_price: 22000, stock_equivalent: 0.25 },
            ])
        } else if (type === 'kg') {
            setNewUnitLabel('Kg')
            setPortions([
                { unit_name: '1 Kg', cost_price: 3000, selling_price: 3800, stock_equivalent: 1.0 },
                { unit_name: '1/2 Kg (500g)', cost_price: 1500, selling_price: 2000, stock_equivalent: 0.5 },
                { unit_name: '1/4 Kg (250g)', cost_price: 800, selling_price: 1100, stock_equivalent: 0.25 },
            ])
        } else if (type === 'pieces') {
            setNewUnitLabel('Pieces')
            setPortions([
                { unit_name: 'Standard Unit', cost_price: 5000, selling_price: 6500, stock_equivalent: 1.0 },
                { unit_name: 'Pack of 5', cost_price: 24000, selling_price: 30000, stock_equivalent: 5.0 },
            ])
        }
    }

    function addPortionRow() {
        setPortions(prev => [
            ...prev,
            { unit_name: '', cost_price: '', selling_price: '', stock_equivalent: 1.0 }
        ])
    }

    function removePortionRow(index: number) {
        if (portions.length <= 1) {
            alert('A product must have at least one portion variant.')
            return
        }
        setPortions(prev => prev.filter((_, i) => i !== index))
    }

    function updatePortionField(index: number, field: keyof PortionRow, value: any) {
        setPortions(prev => prev.map((p, i) => {
            if (i === index) {
                return { ...p, [field]: value }
            }
            return p
        }))
    }

    // Save New Product & Portions ("State Your Goods & Units")
    async function handleSaveNewProduct(e: React.FormEvent) {
        e.preventDefault()

        if (!newProductName.trim()) {
            alert('Please enter a product name (e.g. Rice, Fabric, Sugar).')
            return
        }

        const validPortions = portions.filter(p => p.unit_name.trim() !== '' && Number(p.selling_price) >= 0)
        if (validPortions.length === 0) {
            alert('Please configure at least one portion with a name and selling price.')
            return
        }

        setIsSavingProduct(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id

            let createdProductId = `prod-${Date.now()}`
            const createdVariants: ProductVariant[] = []

            if (userId && !tableNotice) {
                // 1. Insert Master Product
                const { data: prodData, error: prodErr } = await supabase
                    .from('products')
                    .insert([
                        {
                            name: newProductName.trim(),
                            stock: Number(newMasterStock) || 0,
                            unit_label: newUnitLabel.trim() || 'Units',
                            user_id: userId
                        }
                    ])
                    .select()

                if (prodErr) throw prodErr
                createdProductId = String(prodData[0].id)

                // 2. Insert Portions/Variants
                const variantsToInsert = validPortions.map(p => ({
                    product_id: createdProductId,
                    user_id: userId,
                    unit_name: p.unit_name.trim(),
                    cost_price: Number(p.cost_price) || 0,
                    selling_price: Number(p.selling_price) || 0,
                    stock_equivalent: Number(p.stock_equivalent) || 1.0
                }))

                const { data: varData, error: varErr } = await supabase
                    .from('product_variants')
                    .insert(variantsToInsert)
                    .select()

                if (varErr) throw varErr

                if (varData) {
                    varData.forEach((v: any) => {
                        createdVariants.push({
                            id: String(v.id),
                            product_id: createdProductId,
                            unit_name: v.unit_name,
                            cost_price: Number(v.cost_price) || 0,
                            selling_price: Number(v.selling_price) || 0,
                            stock_equivalent: Number(v.stock_equivalent) || 1.0
                        })
                    })
                }
            } else {
                // Local state creation
                validPortions.forEach((p, idx) => {
                    createdVariants.push({
                        id: `v-${Date.now()}-${idx}`,
                        product_id: createdProductId,
                        unit_name: p.unit_name.trim(),
                        cost_price: Number(p.cost_price) || 0,
                        selling_price: Number(p.selling_price) || 0,
                        stock_equivalent: Number(p.stock_equivalent) || 1.0
                    })
                })
            }

            const newProductObj: Product = {
                id: createdProductId,
                name: newProductName.trim(),
                stock: Number(newMasterStock) || 0,
                unit_label: newUnitLabel.trim() || 'Units',
                variants: createdVariants
            }

            setProducts(prev => [newProductObj, ...prev])
            setSelectedProductId(createdProductId)
            if (createdVariants.length > 0) {
                setSelectedVariantId(createdVariants[0].id)
            }

            // Close modal & reset form
            setIsProductModalOpen(false)
            setNewProductName('')
            setNewMasterStock(50)
            applyPortionPreset('bags')
            alert(`"${newProductObj.name}" with ${createdVariants.length} portion variants created successfully!`)
        } catch (err: any) {
            console.error('Failed to create product:', err)
            alert(err.message || 'Failed to save product in database.')
        } finally {
            setIsSavingProduct(false)
        }
    }

    function copySqlSchema() {
        const sql = `-- Run this in your Supabase SQL Editor:
create table if not exists public.products (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    stock numeric not null default 0,
    unit_label text default 'Units',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.product_variants (
    id uuid default gen_random_uuid() primary key,
    product_id uuid references public.products(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    unit_name text not null,
    cost_price numeric not null default 0,
    selling_price numeric not null default 0,
    stock_equivalent numeric not null default 1.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.transactions enable row level security;

create policy "Users can manage products" on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage variants" on public.product_variants for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`
        navigator.clipboard.writeText(sql)
        setCopiedSql(true)
        setTimeout(() => setCopiedSql(false), 3000)
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
        const isAuthError = error.toLowerCase().includes('log in') || error.toLowerCase().includes('login') || error.toLowerCase().includes('session') || error.toLowerCase().includes('unauthorized')
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
                
                {/* Notice if tables need migration */}
                {tableNotice && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <div className="text-sm">
                                <span className="font-semibold">Interactive Demo Mode Active:</span> To save custom goods and variants permanently to Supabase, run the SQL schema migration.
                            </div>
                        </div>
                        <button 
                            onClick={copySqlSchema}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg hover:bg-amber-100/60 transition-colors shadow-xs"
                        >
                            {copiedSql ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                            {copiedSql ? "Copied SQL!" : "Copy Supabase SQL"}
                        </button>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Sales & Analytics Overview</h1>
                        <p className="mt-1 text-sm text-gray-600">Track multi-portion sales, master inventory, and profit margins with zero typing.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsProductModalOpen(true)}
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

                {/* Main Content Grid: Zero-Typing Quick Sale Form on left, Transactions on right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                    
                    {/* ZERO-TYPING QUICK RECORD SALE FORM */}
                    <div className="lg:col-span-1">
                        <form onSubmit={handleRecordSale} className="bg-white p-5 md:p-7 rounded-2xl shadow-sm border border-gray-200 space-y-5">
                            
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Quick Record Sale</h2>
                                    <p className="text-xs text-gray-500">Zero-typing cascaded checkout</p>
                                </div>
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Calculator className="w-4 h-4" />
                                </div>
                            </div>

                            {/* 1. Product Dropdown */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Select Product</label>
                                    {activeProduct && (
                                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                            Stock: {activeProduct.stock} {activeProduct.unit_label || 'Units'}
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => handleProductChange(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                                    >
                                        {products.length === 0 && (
                                            <option value="">No products found (Create one below)</option>
                                        )}
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.stock} {p.unit_label || 'Units'} available)
                                            </option>
                                        ))}
                                        <option value="__ADD_NEW__" className="text-indigo-600 font-bold">+ State New Goods & Units...</option>
                                    </select>
                                </div>
                            </div>

                            {/* 2. Portion / Variant Dropdown */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Portion / Unit Sold</label>
                                    {activeVariant && (
                                        <span className="text-[11px] text-gray-500">
                                            Deducts {activeVariant.stock_equivalent} master unit
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedVariantId}
                                        onChange={(e) => setSelectedVariantId(e.target.value)}
                                        disabled={!activeProduct || !activeProduct.variants || activeProduct.variants.length === 0}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none disabled:opacity-50"
                                    >
                                        {activeProduct?.variants?.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.unit_name} — ₦{v.selling_price.toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 3. Auto-Populated Read-Only Price Fields */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[11px] uppercase font-bold text-gray-400 block tracking-wider">Selling Price</span>
                                    <span className="text-base font-bold text-gray-900">₦{unitPrice.toLocaleString()}</span>
                                    <span className="text-[10px] text-gray-400 block">per portion</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[11px] uppercase font-bold text-gray-400 block tracking-wider">Cost Price</span>
                                    <span className="text-base font-bold text-gray-600">₦{costPrice.toLocaleString()}</span>
                                    <span className="text-[10px] text-emerald-600 font-semibold block">
                                        +₦{(unitPrice - costPrice).toLocaleString()} profit/unit
                                    </span>
                                </div>
                            </div>

                            {/* 4. Quantity Selector (Fractional Presets + Number Input) */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">Quantity</label>
                                
                                {/* Quick Preset Buttons (1/4, 1/2, 1, 2, 3, 5) */}
                                <div className="grid grid-cols-6 gap-1.5">
                                    {presetQuantities.map((preset) => {
                                        const isSelected = qty === preset.value
                                        return (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => setQuantity(preset.value)}
                                                className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                    isSelected 
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Custom Numeric Decimal Input */}
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Or type custom e.g. 0.25, 1.5, 4"
                                        className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    />
                                </div>
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

                            {/* 6. Live Financial & Stock Calculation Summary Card */}
                            <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-600 font-medium">Total Sale Value:</span>
                                    <span className="font-extrabold text-sm text-indigo-950">
                                        ₦{liveTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-emerald-800 font-medium">Net Profit:</span>
                                    <span className="font-bold text-emerald-700">
                                        ₦{liveTotalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {activeProduct && (
                                    <div className="pt-2 border-t border-indigo-200/50 flex justify-between items-center text-[11px] text-gray-500">
                                        <span>Stock deduction:</span>
                                        <span className="font-semibold text-gray-800">
                                            -{liveStockDeduction} {activeProduct.unit_label} (Left: {liveRemainingStock})
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 7. Submit Action Button with Async Loading & Prevent Duplicate */}
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
                                        <span>Record Sale Now</span>
                                    </>
                                )}
                            </button>

                        </form>
                    </div>

                    {/* TRANSACTIONS TABLE & INVENTORY QUICK GLANCE */}
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
                                                            {tx.quantity && (
                                                                <span className="text-[11px] text-gray-400">Qty: {tx.quantity}</span>
                                                            )}
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

                        {/* Master Products & Variants Directory */}
                        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Boxes className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-base font-bold text-gray-900">Your Master Goods & Defined Portions</h3>
                                </div>
                                <button
                                    onClick={() => setIsProductModalOpen(true)}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    + Add Product
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {products.map(p => (
                                    <div key={p.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                                                <span className="text-xs text-gray-500">Master Stock: {p.stock} {p.unit_label || 'Units'}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700">
                                                {p.variants?.length || 0} portions
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {p.variants?.map(v => (
                                                <span key={v.id} className="text-[11px] bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md font-medium">
                                                    {v.unit_name} (₦{v.selling_price.toLocaleString()})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* PRODUCT CREATION MODAL ("State Your Goods & Units") */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900">State Your Goods & Units</h3>
                                <p className="text-xs text-gray-500">Configure base items, master stock, and fractional selling portions.</p>
                            </div>
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewProduct} className="space-y-6">
                            
                            {/* Base Item Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Royal Basmati Rice, Granulated Sugar, Cotton Fabric"
                                        value={newProductName}
                                        onChange={(e) => setNewProductName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Master Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        placeholder="e.g. 50"
                                        value={newMasterStock}
                                        onChange={(e) => setNewMasterStock(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Preset Buttons for Quick Portion Setup */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Portion Presets</label>
                                    <span className="text-[11px] text-gray-400">Click to autofill standard unit portions</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => applyPortionPreset('bags')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        🌾 Grain / Bags (Full, 1/2, 1/4)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPortionPreset('kg')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        ⚖️ Metric / Weight (1kg, 500g, 250g)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyPortionPreset('pieces')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                    >
                                        📦 Single Piece / Pack
                                    </button>
                                </div>
                            </div>

                            {/* Portions / Variants Dynamic Rows */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Defined Selling Portions</label>
                                    <button
                                        type="button"
                                        onClick={addPortionRow}
                                        className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Another Portion
                                    </button>
                                </div>

                                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                    {portions.map((portion, idx) => (
                                        <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-12 gap-2.5 items-center">
                                            
                                            {/* Portion Name */}
                                            <div className="col-span-4">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Portion (e.g. 1/2 Bag)"
                                                    value={portion.unit_name}
                                                    onChange={(e) => updatePortionField(idx, 'unit_name', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:border-indigo-500 outline-none"
                                                />
                                            </div>

                                            {/* Cost Price */}
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Cost Price"
                                                    value={portion.cost_price}
                                                    onChange={(e) => updatePortionField(idx, 'cost_price', e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:border-indigo-500 outline-none"
                                                />
                                            </div>

                                            {/* Selling Price */}
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    required
                                                    placeholder="Selling Price"
                                                    value={portion.selling_price}
                                                    onChange={(e) => updatePortionField(idx, 'selling_price', e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:border-indigo-500 outline-none"
                                                />
                                            </div>

                                            {/* Stock Multiplier / Delete Button */}
                                            <div className="col-span-2 flex items-center gap-1.5 justify-end">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.001"
                                                    title="Fraction deducted from master stock (e.g. 1.0, 0.5, 0.25)"
                                                    value={portion.stock_equivalent}
                                                    onChange={(e) => updatePortionField(idx, 'stock_equivalent', e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="w-12 px-1 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-center text-gray-600 focus:border-indigo-500 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePortionRow(idx)}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingProduct}
                                    className="px-6 py-2.5 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
                                >
                                    {isSavingProduct ? "Saving Product..." : "Save Product & Portions"}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
    )
}