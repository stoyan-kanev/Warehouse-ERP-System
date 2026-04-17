export interface WarehouseMini {
    id: number;
    name: string;
    location: string;

}

export interface ProductMini {
    id: number;
    name: string;
    sku: string;
}

export interface UserMini {
    id: number;
    username: string;
}

export interface ShipmentItem {
    id: number;
    product: ProductMini;
    quantity: string;
    unit: 'PCS' | 'KG' | 'L';
    unit_label: string;
}

export interface Shipment {
    id: number;
    shipment_type: 'TRANSFER' | 'OUTBOUND';
    shipment_type_label: string;
    status: 'DRAFT' | 'SENT' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
    status_label: string;
    from_warehouse: WarehouseMini;
    to_warehouse: WarehouseMini | null;
    destination_address: string | null;
    notes: string;
    created_by: UserMini | null;
    dispatched_at: string | null;
    received_at: string | null;
    created_at: string;
    updated_at: string;
    items: ShipmentItem[];
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
export interface ShipmentPayload {
    from_warehouse: number;
    destination_type: 'warehouse' | 'client';
    to_warehouse_id: number | null;
    client_address: string | null;
    notes: string;
    items: Array<{
        sku: string;
        qty: number;
        unit: string;
    }>;
}
