export interface ProductVariant {
    id: string;
    product_id: string;
    user_id?: string;
    unit_name: string; // e.g. "Full Bag", "1/2 Bag", "1/4 Bag", "Kg", "Single Piece"
    cost_price: number;
    selling_price: number;
    stock_equivalent: number; // fraction of base unit deducted, e.g. 1.0, 0.5, 0.25
    created_at?: string;
}

export interface Product {
    id: string;
    user_id?: string;
    name: string; // e.g. "Rice", "Fabric", "Sugar"
    stock: number; // master stock
    unit_label?: string; // e.g. "Bags", "Kg", "Pcs"
    variants?: ProductVariant[];
    created_at?: string;
}

export interface salesItem {
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    totalPrice: number;
    totalProfit: number;
}

export interface salesTransaction {
    id: string;
    date: string;
    items: string;
    totalAmount: number;
    totalProfit: number;
    user_id?: string;
    product_id?: string;
    product_name?: string;
    variant_name?: string;
    quantity?: number;
    unit_price?: number;
    cost_price?: number;
}

export interface ProductAnalytics {
    name: string;
    revenue: number;
    profit: number;
    salesCount: number;
    unitsSold: number;
    revenuePercentage: number;
    profitPercentage: number;
}