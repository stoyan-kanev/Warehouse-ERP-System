import { Component, OnInit } from '@angular/core';
import {DatePipe, NgClass, NgFor, NgIf} from '@angular/common';
import {PaginatedResponse, Shipment, WarehouseMini} from '../shipment.type';
import {ShipmentService} from '../shipment.service';

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

    constructor(private shipmentService: ShipmentService) {}

    ngOnInit(): void {
        this.loadShipments();
    }

    loadShipments(page: number = 1): void {
        this.loading = true;

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

    getWarehouseName(warehouse: Shipment['from_warehouse'] | Shipment['to_warehouse']): string {
        if (!warehouse) return '-';
        if (typeof warehouse === 'number') return `#${warehouse}`;
        return warehouse.name;
    }

    getWarehouseAdress(warehouse: WarehouseMini | null): string {
        if(!warehouse) return '-'
        return warehouse.location;
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'DRAFT':
                return 'status-draft';
            case 'SENT':
                return 'status-sent';
            case 'IN_TRANSIT':
                return 'status-in-transit';
            case 'RECEIVED':
                return 'status-received';
            case 'CANCELLED':
                return 'status-cancelled';
            default:
                return '';
        }
    }

    getTypeClass(type: string): string {
        switch (type) {
            case 'TRANSFER':
                return 'type-transfer';
            case 'OUTBOUND':
                return 'type-outbound';
            default:
                return '';
        }
    }

    formatShipmentStatus(status: string): string {
        switch (status) {
            case 'DRAFT':
                return 'Draft';
            case 'SENT':
                return 'Sent';
            case 'IN_TRANSIT':
                return 'In transit';
            case 'RECEIVED':
                return 'Received';
            case 'CANCELLED':
                return 'Cancelled';
            default:
                return status;
        }
    }

    formatShipmentType(type: string): string {
        switch (type) {
            case 'TRANSFER':
                return 'Transfer';
            case 'OUTBOUND':
                return 'Outbound';
            default:
                return type;
        }
    }

    getProductLabel(product: any): string {
        if (!product) return '-';

        if (typeof product === 'number') {
            return `Product #${product}`;
        }

        return product.name || product.sku || `Product #${product.id}`;
    }
}
