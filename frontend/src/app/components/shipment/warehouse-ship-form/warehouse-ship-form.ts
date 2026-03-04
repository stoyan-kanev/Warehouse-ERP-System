import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StockLevel } from '../../warehouse/warehouse.types';
import {NgForOf, NgIf} from '@angular/common';

type ShipProductVM = {
    sku: string; // UNIQUE KEY
    name: string;
    unit: string;
    stockQty: number;
    minStockLevel: number;
    priceSell: number;
    priceBuy: number;
    warehouseId: number;
    warehouseName: string;
};

type ShipItemVM = ShipProductVM & { qty: number };

export type ShipmentPayload = {
    destination_type: 'warehouse' | 'client';
    to_warehouse_id: number | null;
    client_address: string | null;
    items: Array<{ sku: string; qty: number }>;
};

@Component({
    selector: 'app-warehouse-ship-form',
    imports: [FormsModule, NgIf, NgForOf],
    templateUrl: './warehouse-ship-form.html',
    styleUrl: './warehouse-ship-form.css',
})
export class WarehouseShipForm implements OnChanges {
    @Input() stocks: StockLevel[] | undefined;

    // Optional: pass available warehouses from parent (for "To warehouse" selection)
    @Input() warehouses: Array<{ id: number; name: string ,location:string}> = [];

    @Output() close = new EventEmitter<void>();
    @Output() submitShipment = new EventEmitter<ShipmentPayload>();

    // Destination
    destinationType: 'warehouse' | 'client' = 'warehouse';
    toWarehouseId: number | null = null;
    clientAddress = '';

    // Product search dropdown
    productSearch = '';
    dropdownOpen = false;
    activeIndex = 0;

    products: ShipProductVM[] = [];
    filteredProducts: ShipProductVM[] = [];

    // Items
    items: ShipItemVM[] = [];

    ngOnChanges(): void {
        this.rebuildProductsFromStocks();
        this.applyFilter();
    }

    onClose() {
        this.close.emit();
    }

    setDestination(type: 'warehouse' | 'client') {
        this.destinationType = type;

        // reset irrelevant field
        if (type === 'warehouse') {
            this.clientAddress = '';
        } else {
            this.toWarehouseId = null;
        }
    }

    /** Build unique products list from stocks using SKU as the key */
    private rebuildProductsFromStocks() {
        const src = this.stocks ?? [];

        // Merge by SKU (in case duplicates exist)
        const map = new Map<string, ShipProductVM>();

        for (const s of src) {
            const sku = (s.product_sku ?? '').trim();
            if (!sku) continue;

            const stockQty = Number(s.quantity) || 0;
            const minStock = Number(s.min_stock_level) || 0;

            const vm: ShipProductVM = {
                sku,
                name: s.product_name ?? '',
                unit: s.product_unit ?? '',
                stockQty,
                minStockLevel: minStock,
                priceSell: Number(s.price_sell) || 0,
                priceBuy: Number(s.price_buy) || 0,
                warehouseId: Number(s.warehouse) || 0,
                warehouseName: s.warehouse_name ?? '',
            };

            const existing = map.get(sku);
            if (!existing) {
                map.set(sku, vm);
            } else {
                // Sum quantity if same SKU appears multiple times
                map.set(sku, { ...existing, stockQty: existing.stockQty + stockQty });
            }
        }

        this.products = Array.from(map.values());

        // Debug: uncomment if needed
        // console.log('STOCKS:', src.length, 'PRODUCTS:', this.products.length, this.products.map(p => p.sku));
    }

    openDropdown() {
        this.dropdownOpen = true;
        this.activeIndex = 0;
        this.applyFilter();
    }

    closeDropdown() {
        this.dropdownOpen = false;
        this.activeIndex = 0;
    }

    onComboBlur(ev: FocusEvent) {
        const related = ev.relatedTarget as HTMLElement | null;
        if (related && related.closest('.dropdown')) return;
        this.closeDropdown();
    }

    onSearchChange() {
        if (!this.dropdownOpen) this.openDropdown();
        this.applyFilter();
    }

    private applyFilter() {
        const s = this.productSearch.trim().toLowerCase();
        const base = this.products;

        const filtered = !s
            ? base
            : base.filter(p =>
                p.sku.toLowerCase().includes(s) ||
                p.name.toLowerCase().includes(s)
            );

        // Safety: don't render huge lists
        this.filteredProducts = filtered.slice(0, 80);
        this.activeIndex = 0;
    }

    onSearchKeyDown(e: KeyboardEvent) {
        if (!this.dropdownOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.activeIndex = Math.min(this.activeIndex + 1, this.filteredProducts.length - 1);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.activeIndex = Math.max(this.activeIndex - 1, 0);
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const p = this.filteredProducts[this.activeIndex];
            if (p) this.selectProduct(p);
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.closeDropdown();
        }
    }

    /** Add/merge item by SKU */
    selectProduct(p: ShipProductVM) {
        const idx = this.items.findIndex(x => x.sku === p.sku);

        if (idx !== -1) {
            const it = this.items[idx];
            it.qty = Math.min(it.qty + 1, it.stockQty || 999999);
        } else {
            // If stock is 0, still allow adding? Decide here:
            // - If you want to block: if (p.stockQty <= 0) return;
            this.items.push({ ...p, qty: Math.min(1, p.stockQty || 1) });
        }

        this.productSearch = '';
        this.applyFilter();

        // keep dropdown open for rapid adding
        // if you prefer close: this.closeDropdown();
    }

    incQty(i: number) {
        const it = this.items[i];
        if (!it) return;
        it.qty = Math.min(it.qty + 1, it.stockQty || 999999);
    }

    decQty(i: number) {
        const it = this.items[i];
        if (!it) return;
        it.qty = Math.max(1, it.qty - 1);
    }

    setQty(i: number, raw: string) {
        const it = this.items[i];
        if (!it) return;

        const n = Number(raw);

        if (!Number.isFinite(n)) return;

        const rounded = Math.round(n * 100) / 100;
        const clamped = Math.max(0, rounded);

        it.qty = Math.min(clamped, it.stockQty || 999999);
    }

    removeItem(i: number) {
        this.items.splice(i, 1);
    }

    canSubmit(): boolean {
        if (this.items.length === 0) return false;

        if (this.destinationType === 'warehouse') {
            return this.toWarehouseId !== null;
        }

        return this.clientAddress.trim().length >= 10;
    }

    onSubmit() {
        if (!this.canSubmit()) return;

        const payload: ShipmentPayload = {
            destination_type: this.destinationType,
            to_warehouse_id: this.destinationType === 'warehouse' ? this.toWarehouseId : null,
            client_address: this.destinationType === 'client' ? this.clientAddress.trim() : null,
            items: this.items.map(it => ({
                sku: it.sku,
                qty: it.qty,
            })),
        };

        this.submitShipment.emit(payload);
    }

    /** Optional helpers for template */
    isLowStock(p: ShipProductVM): boolean {
        return p.stockQty < p.minStockLevel;
    }
}
