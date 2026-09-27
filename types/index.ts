export interface product{
    id: string;
    name: string;
    price: number;
    costPrice: number;
    stock: number;
}
export interface salesItem{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number
}

export interface salesTransaction{
    id: string;
    date: string;
    items: string;
    totalAmount: number;
    totalProfit: number;
}