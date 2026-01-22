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

    ],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.css',
})
export class WarehousesComponent implements OnInit {
    warehouses: Warehouse[] = [];
    selectedWarehouseId: number | null = null;

    stockLevels: StockLevel[] = [];
    isStockLoading = false;

    isCreateOpen = false;
    isSaving = false;

    isAddOpen = false;
    isAddSaving = false;

    isDetailsOpen = false;
    selectedStock: StockLevel | null = null;

    constructor(private warehousesService: WarehousesService,private stockLevelsService: StockLevelsService) {}

    ngOnInit(): void {
        this.loadWarehouses();
    }

    loadWarehouses(selectFirst = true): void {
        this.warehousesService.list(false).subscribe({
            next: (data) => {
                this.warehouses = data;

                if (selectFirst && this.selectedWarehouseId == null && this.warehouses.length) {
                    this.selectedWarehouseId = this.warehouses[0].id;
                    this.onWarehouseChange(this.selectedWarehouseId);
                }
            },
            error: (err) => console.error('Failed to load warehouses', err),
        });
    }

    onWarehouseChange(value: string | number): void {
        const id = Number(value);
        this.selectedWarehouseId = Number.isFinite(id) ? id : null;

        if (this.selectedWarehouseId) {
            this.loadStockLevels(this.selectedWarehouseId);
        } else {
            this.stockLevels = [];
        }
    }

    loadStockLevels(warehouseId: number): void {
        this.isStockLoading = true;

        this.stockLevelsService.listByWarehouse(warehouseId).subscribe({
            next: (rows) => {
                this.stockLevels = rows;
                this.isStockLoading = false;
            },
            error: (err) => {
                console.error('Failed to load stocklevels', err);
                this.isStockLoading = false;
            },
        });
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
                this.stockLevels = [created, ...this.stockLevels];
                this.isAddSaving = false;
                this.closeAddToWarehouseDialog();
            },
            error: (err) => {
                console.error(err);
                this.isAddSaving = false;
            },
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
            next: () => this.stockLevels = this.stockLevels.filter(x => x.id !== sl.id),
            error: (err) => console.error('Failed to remove stocklevel', err),
        });
    }
    openCreate(): void {
        this.isCreateOpen = true;
    }

    closeCreate(): void {
        this.isCreateOpen = false;
    }

    createWarehouse(payload: WarehouseCreatePayload): void {
        this.isSaving = true;

        this.warehousesService.create(payload).subscribe({
            next: (created) => {
                this.isSaving = false;
                this.closeCreate();

                this.loadWarehouses(false);
                this.selectedWarehouseId = created.id;
                this.loadStockLevels(created.id);
            },
            error: (err) => {
                console.error('Failed to create warehouse', err);
                this.isSaving = false;
            },
        });
    }
}
