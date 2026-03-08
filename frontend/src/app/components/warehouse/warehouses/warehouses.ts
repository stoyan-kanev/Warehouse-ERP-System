import {Component, OnInit} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {WarehouseCreation} from '../warehouse-creation/warehouse-creation';
import {Warehouse, WarehouseCreatePayload, WarehousesService} from '../warehouses.services';
import {StockLevel, StockLevelCreatePayload} from '../warehouse.types';
import {StockLevelsService} from '../stockLevel.service';
import {FormsModule} from '@angular/forms';
import {WarehouseAddProductDialog} from '../warehouse-add-product-dialog/warehouse-add-product-dialog';
import {DecimalPipe} from '@angular/common';
import {WarehouseDetailProductDialog} from '../warehouse-detail-product-dialog/warehouse-detail-product-dialog';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {ShipmentPayload, WarehouseShipForm} from '../../shipment/warehouse-ship-form/warehouse-ship-form';
import {ShipmentService} from '../../shipment/shipment.service';


@Component({
    selector: 'app-warehouses',
    imports: [
        MatButton,
        WarehouseCreation,
        FormsModule,
        DecimalPipe,
        WarehouseAddProductDialog,
        DecimalPipe,
        WarehouseDetailProductDialog,
        WarehouseShipForm,

    ],
    standalone: true,
    templateUrl: './warehouses.html',
    styleUrl: './warehouses.css',
})
export class WarehousesComponent implements OnInit {
    warehouses: Warehouse[] = [];
    selectedWarehouseId: number | null = null;
    availableWarehouses: Warehouse[] = [];
    skuQuery = '';
    private sku$ = new Subject<string>();
    private stockLevelsAll: StockLevel[] = [];

    stockLevels: StockLevel[] = [];
    isStockLoading = false;

    isCreateOpen = false;
    isSaving = false;

    isAddOpen = false;
    isAddSaving = false;

    isDetailsOpen = false;
    selectedStock: StockLevel | null = null;

    isEditOpen = false;
    isEditSaving = false;
    editingWarehouse: Warehouse | null = null;
    warehouseError: string | null = null;

    isShipmentOpen = false;


    errMessage = '';


    constructor(
        private warehousesService: WarehousesService,
        private stockLevelsService: StockLevelsService,
        private shipmentServices:ShipmentService
    ){}

    ngOnInit(): void {
        this.loadWarehouses();
        this.sku$
            .pipe(debounceTime(200), distinctUntilChanged())
            .subscribe((q) => {
                this.skuQuery = q;
                this.filterStockLevelsBySku();
            });

    }


    loadWarehouses(selectFirst = true): void {
        this.warehousesService.list(false).subscribe({
            next: (data) => {
                this.warehouses = data;

                if (selectFirst && this.selectedWarehouseId == null && this.warehouses.length) {
                    this.selectedWarehouseId = this.warehouses[0].id;
                    this.onWarehouseChange(this.selectedWarehouseId);
                    this.availableWarehouses = this.warehouses.filter(w=> w.id != this.selectedWarehouseId);

                }
            },
            error: (err) => console.error('Failed to load warehouses', err),
        });
    }

    onWarehouseChange(value: string | number): void {
        const id = Number(value);
        this.selectedWarehouseId = Number.isFinite(id) ? id : null;

        if (this.selectedWarehouseId) {
            this.clearSkuSearch();
            this.loadStockLevels(this.selectedWarehouseId);
            this.availableWarehouses = this.warehouses.filter(w=> w.id != this.selectedWarehouseId);

        } else {
            this.stockLevels = [];
        }
    }

    loadStockLevels(warehouseId: number): void {
        this.isStockLoading = true;

        this.stockLevelsService.listByWarehouse(warehouseId).subscribe({
            next: (rows) => {
                this.stockLevelsAll = rows;
                this.filterStockLevelsBySku();
                this.isStockLoading = false;
            },
            error: (err) => {
                console.error('Failed to load stocklevels', err);
                this.isStockLoading = false;
            },
        });
    }

    onSkuInput(value: string): void {
        this.sku$.next(value.trim());
    }

    applySkuSearch(): void {
        this.skuQuery = this.skuQuery.trim();
        this.filterStockLevelsBySku();
    }

    clearSkuSearch(): void {
        this.skuQuery = '';
        this.stockLevels = [...this.stockLevelsAll];
    }

    private filterStockLevelsBySku(): void {
        const q = this.skuQuery.trim();

        if (!q) {
            this.stockLevels = [...this.stockLevelsAll];
            return;
        }

        const exact = this.stockLevelsAll.filter(x => (x.product_sku || '').toLowerCase() === q.toLowerCase());
        if (exact.length) {
            this.stockLevels = exact;
            return;
        }

        this.stockLevels = this.stockLevelsAll.filter(x =>
            (x.product_sku || '').toLowerCase().includes(q.toLowerCase())
        );
    }

    openAddToWarehouseDialog(): void {
        if (!this.selectedWarehouseId) return;
        this.isAddOpen = true;
    }

    closeAddToWarehouseDialog(): void {
        this.isAddOpen = false;
    }

    submitAddToWarehouse(payload: StockLevelCreatePayload): void {
        if (!this.selectedWarehouseId) return;

        this.isAddSaving = true;

        this.stockLevelsService.createForWarehouse(this.selectedWarehouseId, payload).subscribe({
            next: (created) => {
                this.stockLevelsAll = [created, ...this.stockLevelsAll];
                this.filterStockLevelsBySku();
                this.isAddSaving = false;
                this.closeAddToWarehouseDialog();
            },
            error: (err) => {
                this.errMessage = err?.error?.sku || 'Failed to add product.';
                this.isAddSaving = false;
            },
        });
    }

    openEditWarehouse(): void {
        if (!this.selectedWarehouseId) return;

        const w = this.warehouses.find(x => x.id === this.selectedWarehouseId) || null;
        if (!w) return;

        this.editingWarehouse = w;
        this.warehouseError = null;
        this.isEditOpen = true;
    }

    closeEditWarehouse(): void {
        this.isEditOpen = false;
        this.isEditSaving = false;
        this.editingWarehouse = null;
        this.warehouseError = null;
    }

    submitEditWarehouse(payload: WarehouseCreatePayload): void {
        if (!this.editingWarehouse) return;

        this.isEditSaving = true;
        this.warehouseError = null;

        this.warehousesService.update(this.editingWarehouse.id, payload).subscribe({
            next: (updated) => {
                this.isEditSaving = false;

                // update local list
                this.warehouses = this.warehouses.map(w => w.id === updated.id ? updated : w);

                // keep selected
                this.selectedWarehouseId = updated.id;

                this.closeEditWarehouse();
            },
            error: (err) => {
                this.isEditSaving = false;
                // normalize error to string
                const raw = err?.error?.name?.[0] || err?.error?.location?.[0] || err?.error?.detail || err?.error?.error;
                this.warehouseError = Array.isArray(raw) ? raw[0] : (raw || 'Update failed.');
            },
        });
    }

    deactivateSelectedWarehouse(): void {
        if (!this.selectedWarehouseId) return;

        const w = this.warehouses.find(x => x.id === this.selectedWarehouseId);
        const label = w ? `${w.name} — ${w.location}` : `#${this.selectedWarehouseId}`;

        if (!confirm(`Deactivate warehouse ${label}?`)) return;

        this.warehousesService.deactivate(this.selectedWarehouseId).subscribe({
            next: () => {
                // remove from list locally
                this.warehouses = this.warehouses.filter(x => x.id !== this.selectedWarehouseId);

                // reset selection
                this.selectedWarehouseId = this.warehouses.length ? this.warehouses[0].id : null;

                // reload stock
                if (this.selectedWarehouseId) this.loadStockLevels(this.selectedWarehouseId);
                else this.stockLevels = [];

                // optional: if edit modal open
                this.closeEditWarehouse();
            },
            error: (err) => console.error('Failed to deactivate warehouse', err),
        });
    }

    openStockDetails(sl: StockLevel): void {
        this.selectedStock = sl;
        this.isDetailsOpen = true;
    }

    closeStockDetails(): void {
        this.isDetailsOpen = false;
        this.selectedStock = null;
    }

    removeFromWarehouse(sl: StockLevel): void {
        if (!confirm(`Remove ${sl.product_name} from this warehouse?`)) return;

        this.stockLevelsService.remove(sl.id).subscribe({
            next: () => {
                this.stockLevelsAll = this.stockLevelsAll.filter(x => x.id !== sl.id);
                this.filterStockLevelsBySku();
            },
            error: (err) => console.error('Failed to remove stocklevel', err),
        });
    }

    openCreate(): void {
        this.isCreateOpen = true;
    }

    closeCreate(): void {
        this.isCreateOpen = false;
    }

    onStockUpdated(updated: StockLevel): void {
        this.stockLevelsAll = this.stockLevelsAll.map(x => x.id === updated.id ? updated : x);
        this.filterStockLevelsBySku();
        this.selectedStock = updated;
    }

    createWarehouse(payload: WarehouseCreatePayload): void {
        this.isSaving = true;

        this.warehousesService.create(payload).subscribe({
            next: (created) => {
                this.isSaving = false;
                this.closeCreate();

                this.warehouses = [created, ...this.warehouses];
                this.selectedWarehouseId = created.id;
                this.clearSkuSearch();
                this.loadStockLevels(created.id);
            },
            error: (err) => {
                console.error('Failed to create warehouse', err);
                this.isSaving = false;
            },
        });
    }


    openCreateShipment() {
        this.isShipmentOpen = true;
    }

    closeShipForm(){
        this.isShipmentOpen = false;
    }

    createShipment($event: ShipmentPayload) {

            this.shipmentServices.createShipment($event).subscribe({
                next: () => {

                    this.closeShipForm();
                },
                error:(err) =>{
                    console.log(err)
                }
            })

    }
}
