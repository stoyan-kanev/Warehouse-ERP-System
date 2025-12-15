export interface Product {
    id: number;
    sku: string;
    name: string;
    description: string;
    unit: string;
    quantity: number;
    min_stock_level: number;
    price_sell: number;
    price_buy: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;

    image?: string | null;
    image_url?: string | null;
}

export interface PaginatedProducts {
    count: number;
    next: string | null;
    previous: string | null;
    results: Product[];
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
