import {Component, EventEmitter, Input, Output} from '@angular/core';
import {StockLevel} from '../warehouse.types';
import {DatePipe, DecimalPipe} from '@angular/common';

@Component({
    selector: 'app-warehouse-detail-product-dialog',
    imports: [
        DatePipe,
        DecimalPipe
    ],
    standalone: true,
    templateUrl: './warehouse-detail-product-dialog.html',
    styleUrl: './warehouse-detail-product-dialog.css',
})
export class WarehouseDetailProductDialog {
    @Input({required: true}) stock!: StockLevel;
    @Output() close = new EventEmitter<void>();

    onClose(): void {
        this.close.emit();
    }
}
