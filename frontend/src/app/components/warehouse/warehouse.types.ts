export type StockLevel = {
    id: number;
    product: number;
    sku: string;
    product_name: string;
    product_unit: string;
    price_sell: string;
    price_buy: string;

    warehouse: number;
    warehouse_name: string;

    quantity: string;
    min_stock_level: string;
    updated_at: string;
};

export type StockLevelCreatePayload = {
    sku:string;
    quantity: string;
    min_stock_level: string;
};

export type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };
