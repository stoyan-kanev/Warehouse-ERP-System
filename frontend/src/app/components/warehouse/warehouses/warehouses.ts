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
    isCreateOpen = false;
    isSaving = false;
    warehouses: Warehouse[] = [];


    constructor(private warehousesService: WarehousesService) {}

    ngOnInit(): void {
        this.loadWarehouses();
    }

    loadWarehouses(): void {
        this.warehousesService.list(false).subscribe({
            next: (data) => (this.warehouses = data),
            error: (err) => console.error('Failed to load warehouses', err),
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
