import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { PaginatedResponse, Shipment, ShipmentPayload, WarehouseMini } from '../shipment.type';
import { ShipmentService } from '../shipment.service';
import { WarehouseShipForm } from '../warehouse-ship-form/warehouse-ship-form';
import { StockLevel } from '../../warehouse/warehouse.types';
import {Warehouse, WarehousesService} from '../../warehouse/warehouses.services';
import {StockLevelsService} from '../../warehouse/stockLevel.service';

@Component({
    selector: 'app-shipment-list',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, DatePipe, WarehouseShipForm],
    templateUrl: './shipment-list.html',
    styleUrl: './shipment-list.css'
})
export class ShipmentListComponent implements OnInit {
    shipments: Shipment[] = [];
    loading = false;

    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 0;

    errorMessage = '';

    selectedShipment: Shipment | null = null;
    isEditOpen = false;

    warehouses: Warehouse[] = [];
    editStocks: StockLevel[] = [];
    editStocksLoading = false;

    editWarehouses: Array<{ id: number; name: string; location: string }> = [];

    constructor(
        private shipmentService: ShipmentService,
        private warehousesService: WarehousesService,
        private stockLevelsService: StockLevelsService
    ) {}

    ngOnInit(): void {
        this.loadShipments();
        this.loadWarehouses();
    }

    loadShipments(page: number = 1): void {
        this.loading = true;
        this.errorMessage = '';

        this.shipmentService.getShipments(page, this.pageSize).subscribe({
            next: (res: PaginatedResponse<Shipment>) => {
                this.shipments = res.results;
                this.totalCount = res.count;
                this.currentPage = page;
                this.totalPages = Math.ceil(res.count / this.pageSize);
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading shipments:', err);
                this.errorMessage = 'Failed to load shipments.';
                this.loading = false;
            }
        });
    }

    loadWarehouses(): void {
        this.warehousesService.list(false).subscribe({
            next: (data) => {
                this.warehouses = data;
            },
            error: (err) => {
                console.error('Failed to load warehouses', err);
            }
        });
    }

    loadStocksForWarehouse(warehouseId: number): void {
        this.editStocksLoading = true;

        this.stockLevelsService.listByWarehouse(warehouseId).subscribe({
            next: (rows) => {
                this.editStocks = rows;
                this.editStocksLoading = false;
            },
            error: (err) => {
                console.error('Failed to load stock levels', err);
                this.editStocks = [];
                this.editStocksLoading = false;
            }
        });
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.loadShipments(this.currentPage - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.loadShipments(this.currentPage + 1);
        }
    }

    getWarehouseName(warehouse: Shipment['from_warehouse'] | Shipment['to_warehouse']): string {
        if (!warehouse) return '-';
        if (typeof warehouse === 'number') return `#${warehouse}`;
        return warehouse.name;
    }

    getWarehouseAdress(warehouse: WarehouseMini | null): string {
        if (!warehouse) return '-';
        return warehouse.location;
    }

    getStatusClass(status: string): string {
        return `status-${status.toLowerCase()}`;
    }

    getTypeClass(type: string): string {
        return `type-${type.toLowerCase()}`;
    }

    formatShipmentStatus(status: string): string {
        return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    formatShipmentType(type: string): string {
        return type.charAt(0) + type.slice(1).toLowerCase();
    }

    getProductLabel(product: any): string {
        if (!product) return '-';
        if (typeof product === 'number') return `Product #${product}`;
        return product.name || product.sku || `Product #${product.id}`;
    }

    dispatchShipment(shipment: Shipment): void {
        this.shipmentService.dispatchShipment(shipment.id).subscribe({
            next: (updated) => this.replaceShipmentInList(updated),
            error: (err) => this.handleError(err)
        });
    }

    receiveShipment(shipment: Shipment): void {
        this.shipmentService.receiveShipment(shipment.id).subscribe({
            next: (updated) => this.replaceShipmentInList(updated),
            error: (err) => this.handleError(err)
        });
    }

    cancelShipment(shipment: Shipment): void {
        this.shipmentService.cancelShipment(shipment.id).subscribe({
            next: (updated) => this.replaceShipmentInList(updated),
            error: (err) => this.handleError(err)
        });
    }

    editShipment(shipment: Shipment): void {
        this.selectedShipment = shipment;
        this.isEditOpen = true;
        this.editStocks = [];
        this.editWarehouses = this.warehouses.filter(w => w.id !== shipment.from_warehouse.id);

        this.loadStocksForWarehouse(shipment.from_warehouse.id);
    }

    replaceShipmentInList(updated: Shipment): void {
        this.shipments = this.shipments.map(item =>
            item.id === updated.id ? updated : item
        );
    }

    onCloseEdit(): void {
        this.isEditOpen = false;
        this.selectedShipment = null;
        this.editStocks = [];
        this.editWarehouses = [];
    }

    onUpdateShipment(payload: ShipmentPayload): void {
        if (!this.selectedShipment) return;

        this.shipmentService.updateShipment(this.selectedShipment.id, payload).subscribe({
            next: (updated) => {
                this.replaceShipmentInList(updated);
                this.onCloseEdit();
            },
            error: (err) => {
                this.handleError(err);
            }
        });
    }

    handleError(err: any): void {
        console.error(err);
        this.errorMessage =
            err?.error?.items?.[0] ||
            err?.error?.status ||
            err?.error?.detail ||
            'Operation failed.';
    }

    canEdit(shipment: Shipment): boolean {
        return shipment.status === 'DRAFT';
    }

    canCancel(shipment: Shipment): boolean {
        return shipment.status === 'DRAFT';
    }

    canDispatch(shipment: Shipment): boolean {
        return shipment.status === 'DRAFT';
    }

    canReceive(shipment: Shipment): boolean {
        return shipment.status === 'SENT' || shipment.status === 'IN_TRANSIT';
    }

    getEditWarehouses(): Warehouse[] {
        if (!this.selectedShipment) return this.warehouses;
        return this.warehouses.filter(w => w.id !== this.selectedShipment!.from_warehouse.id);
    }
}
