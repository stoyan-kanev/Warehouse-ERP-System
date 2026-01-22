import {Component, OnInit} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {WarehouseCreation} from '../warehouse-creation/warehouse-creation';
import {Warehouse, WarehouseCreatePayload, WarehousesService} from '../warehouses.services';

@Component({
  selector: 'app-warehouses',
    imports: [
        MatButton,
        WarehouseCreation,

    ],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.css',
})
export class WarehousesComponent implements OnInit {
    warehouses: Warehouse[] = [];
    selectedWarehouseId: number | null = null;

    isCreateOpen = false;
    isSaving = false;

    constructor(private warehousesService: WarehousesService) {}

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
        console.log('Selected warehouse:', this.selectedWarehouseId);
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
                this.loadWarehouses();


                this.isSaving = false;
                this.closeCreate();
            },
            error: (err) => {
                console.error('Failed to create warehouse', err);
                this.isSaving = false;
            },
        });
    }
}
