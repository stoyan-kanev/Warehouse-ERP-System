import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';

import { StockLevel } from '../../warehouse/warehouse.types';
import { Shipment, ShipmentPayload } from '../shipment.type';

type ShipProductVM = {
    sku: string;
    name: string;
    unit: string;
    stockQty: number; // max allowed in UI
    minStockLevel: number;
    priceSell: number;
    priceBuy: number;
    warehouseId: number;
    warehouseName: string;
};

type ShipItemVM = ShipProductVM & { qty: number };

@Component({
    selector: 'app-warehouse-ship-form',
    imports: [FormsModule, NgIf, NgForOf],
    templateUrl: './warehouse-ship-form.html',
    styleUrl: './warehouse-ship-form.css',
})
export class WarehouseShipForm implements OnChanges {
    @Input() stocks: StockLevel[] | undefined;
    @Input() selectedWarehouseId: number | null = null;
    @Input() warehouses: Array<{ id: number; name: string; location: string }> = [];

    @Input() editMode = false;
    @Input() initialData: Shipment | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() submitShipment = new EventEmitter<ShipmentPayload>();

    destinationType: 'warehouse' | 'client' = 'warehouse';
    toWarehouseId: number | null = null;
    clientAddress = '';
    notes = '';

    productSearch = '';
    dropdownOpen = false;
    activeIndex = 0;

    products: ShipProductVM[] = [];
    filteredProducts: ShipProductVM[] = [];
    items: ShipItemVM[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        this.rebuildProductsFromStocks();

        const initialDataChanged = !!changes['initialData'];
        const stocksChanged = !!changes['stocks'];

        if (this.editMode && this.initialData && (initialDataChanged || stocksChanged)) {
            this.fillFromShipment(this.initialData);
        } else if (!this.editMode && (changes['selectedWarehouseId'] || stocksChanged)) {
            this.cleanupInvalidItems();
        }

        this.applyFilter();
    }

    onClose(): void {
        this.close.emit();
    }

    setDestination(type: 'warehouse' | 'client'): void {
        this.destinationType = type;

        if (type === 'warehouse') {
            this.clientAddress = '';
        } else {
            this.toWarehouseId = null;
        }
    }

    private fillFromShipment(shipment: Shipment): void {
        this.selectedWarehouseId = shipment.from_warehouse.id;
        this.destinationType = shipment.shipment_type === 'TRANSFER' ? 'warehouse' : 'client';
        this.toWarehouseId = shipment.to_warehouse?.id ?? null;
        this.clientAddress = shipment.destination_address ?? '';
        this.notes = shipment.notes ?? '';

        const productMap = new Map(this.products.map(p => [p.sku, p]));

        this.items = shipment.items.map(item => {
            const currentQty = this.toSafeNumber(item.quantity);
            const currentProduct = productMap.get(item.product.sku);
            const availableNow = currentProduct?.stockQty ?? 0;

            return {
                sku: item.product.sku,
                name: item.product.name,
                unit: item.unit,
                stockQty: availableNow + currentQty,
                minStockLevel: currentProduct?.minStockLevel ?? 0,
                priceSell: currentProduct?.priceSell ?? 0,
                priceBuy: currentProduct?.priceBuy ?? 0,
                warehouseId: currentProduct?.warehouseId ?? shipment.from_warehouse.id,
                warehouseName: currentProduct?.warehouseName ?? shipment.from_warehouse.name,
                qty: currentQty,
            };
        });
    }

    private rebuildProductsFromStocks(): void {
        const src = this.stocks ?? [];
        const map = new Map<string, ShipProductVM>();

        for (const s of src) {
            const sku = (s.product_sku ?? '').trim();
            if (!sku) continue;

            const stockQty = this.toSafeNumber((s as any).available_quantity ?? s.quantity);
            const minStock = this.toSafeNumber(s.min_stock_level);

            const vm: ShipProductVM = {
                sku,
                name: (s.product_name ?? '').trim(),
                unit: (s.product_unit ?? '').trim(),
                stockQty,
                minStockLevel: minStock,
                priceSell: this.toSafeNumber(s.price_sell),
                priceBuy: this.toSafeNumber(s.price_buy),
                warehouseId: Number(s.warehouse) || 0,
                warehouseName: (s.warehouse_name ?? '').trim(),
            };

            const existing = map.get(sku);
            if (!existing) {
                map.set(sku, vm);
            } else {
                map.set(sku, {
                    ...existing,
                    stockQty: existing.stockQty + stockQty,
                });
            }
        }

        this.products = Array.from(map.values());
    }

    private cleanupInvalidItems(): void {
        if (this.items.length === 0) return;

        const productMap = new Map(this.products.map(p => [p.sku, p]));
        const nextItems: ShipItemVM[] = [];

        for (const item of this.items) {
            const latest = productMap.get(item.sku);
            if (!latest) continue;
            if (latest.stockQty <= 0) continue;

            nextItems.push({
                ...latest,
                qty: this.clampQty(item.qty, latest.stockQty),
            });
        }

        this.items = nextItems;
    }

    openDropdown(): void {
        this.dropdownOpen = true;
        this.activeIndex = 0;
        this.applyFilter();
    }

    closeDropdown(): void {
        this.dropdownOpen = false;
        this.activeIndex = 0;
    }

    onComboBlur(ev: FocusEvent): void {
        const related = ev.relatedTarget as HTMLElement | null;
        if (related && related.closest('.dropdown')) return;
        this.closeDropdown();
    }

    onSearchChange(): void {
        if (!this.dropdownOpen) {
            this.openDropdown();
        }
        this.applyFilter();
    }

    private applyFilter(): void {
        const search = this.productSearch.trim().toLowerCase();

        const filtered = !search
            ? this.products
            : this.products.filter((p) =>
                p.sku.toLowerCase().includes(search) ||
                p.name.toLowerCase().includes(search)
            );

        this.filteredProducts = filtered.slice(0, 80);
        this.activeIndex = 0;
    }

    onSearchKeyDown(e: KeyboardEvent): void {
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
            const product = this.filteredProducts[this.activeIndex];
            if (product) {
                this.selectProduct(product);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.closeDropdown();
        }
    }

    selectProduct(product: ShipProductVM): void {
        if (product.stockQty <= 0) return;

        const idx = this.items.findIndex((x) => x.sku === product.sku);

        if (idx !== -1) {
            const item = this.items[idx];
            item.qty = this.clampQty(item.qty + 1, item.stockQty);
        } else {
            this.items.push({
                ...product,
                qty: this.clampQty(1, product.stockQty),
            });
        }

        this.productSearch = '';
        this.applyFilter();
    }

    incQty(index: number): void {
        const item = this.items[index];
        if (!item) return;
        item.qty = this.clampQty(item.qty + 1, item.stockQty);
    }

    decQty(index: number): void {
        const item = this.items[index];
        if (!item) return;
        item.qty = this.clampQty(item.qty - 1, item.stockQty);
    }

    setQty(index: number, raw: string): void {
        const item = this.items[index];
        if (!item) return;

        const normalized = raw.replace(',', '.').trim();
        if (normalized === '' || normalized === '.' || normalized === '-')
            return;

        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) return;

        item.qty = this.clampQty(parsed, item.stockQty);
    }

    removeItem(index: number): void {
        this.items.splice(index, 1);
    }

    canSubmit(): boolean {
        if (this.selectedWarehouseId === null) return false;
        if (this.items.length === 0) return false;

        const hasInvalidItems = this.items.some((item) => {
            return !item.sku.trim() || !item.unit.trim() || item.qty <= 0 || item.qty > item.stockQty;
        });

        if (hasInvalidItems) return false;

        if (this.destinationType === 'warehouse') {
            if (this.toWarehouseId === null) return false;
            if (this.toWarehouseId === this.selectedWarehouseId) return false;
            return true;
        }

        return this.clientAddress.trim().length >= 3;
    }

    onSubmit(): void {
        if (!this.canSubmit() || this.selectedWarehouseId === null) return;

        const payload: ShipmentPayload = {
            from_warehouse: this.selectedWarehouseId,
            destination_type: this.destinationType,
            to_warehouse_id: this.destinationType === 'warehouse' ? this.toWarehouseId : null,
            client_address: this.destinationType === 'client' ? this.clientAddress.trim() : null,
            notes: this.notes.trim(),
            items: this.items.map((item) => ({
                sku: item.sku,
                qty: Number(item.qty.toFixed(2)),
                unit: item.unit,
            })),
        };

        this.submitShipment.emit(payload);
    }

    isLowStock(product: ShipProductVM): boolean {
        return product.stockQty < product.minStockLevel;
    }

    private clampQty(value: number, maxStock: number): number {
        const rounded = Math.round(value * 100) / 100;
        return Math.max(0.01, Math.min(rounded, maxStock));
    }

    private toSafeNumber(value: unknown): number {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }
}
