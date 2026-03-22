import { Component, OnInit } from '@angular/core';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { PaginatedResponse, Shipment, WarehouseMini } from '../shipment.type';
import { ShipmentService } from '../shipment.service';

@Component({
    selector: 'app-shipment-list',
    standalone: true,
    imports: [NgFor, NgIf, NgClass, DatePipe],
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

    constructor(private shipmentService: ShipmentService) {}

    ngOnInit(): void {
        this.loadShipments();
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

    // ===== UI HELPERS =====

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

    // ===== ACTIONS =====

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

    // placeholder за бъдещ edit modal
    editShipment(shipment: Shipment): void {
        console.log('Edit shipment', shipment);
    }

    replaceShipmentInList(updated: Shipment): void {
        this.shipments = this.shipments.map(item =>
            item.id === updated.id ? updated : item
        );
    }

    handleError(err: any): void {
        console.error(err);
        this.errorMessage =
            err?.error?.items?.[0] ||
            err?.error?.status ||
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
}
