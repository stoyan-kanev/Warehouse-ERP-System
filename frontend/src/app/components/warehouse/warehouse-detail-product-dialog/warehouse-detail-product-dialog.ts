import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import {StockLevel} from '../warehouse.types';
import {DatePipe, DecimalPipe} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {StockLevelsService} from '../stockLevel.service';

@Component({
    selector: 'app-warehouse-detail-product-dialog',
    imports: [
        DatePipe,
        DecimalPipe,
        ReactiveFormsModule
    ],
    standalone: true,
    templateUrl: './warehouse-detail-product-dialog.html',
    styleUrl: './warehouse-detail-product-dialog.css',
})
export class WarehouseDetailProductDialog implements OnChanges{
    @Input() stock!: StockLevel;

    @Output() close = new EventEmitter<void>();
    @Output() updated = new EventEmitter<StockLevel>();

    form: FormGroup;
    isSaving = false;
    errorMessage: string | null = null;

    isEditing = false;

    constructor(private fb: FormBuilder, private stockLevelsService: StockLevelsService) {
        this.form = this.fb.group({
            quantity: ['0.00', [Validators.required]],
            min_stock_level: ['0.00', [Validators.required]],
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['stock']?.currentValue) return;

        // когато се отвори за нов продукт -> излизаме от edit mode
        this.isEditing = false;
        this.errorMessage = null;

        this.form.patchValue(
            {
                quantity: this.stock.quantity ?? '0.00',
                min_stock_level: this.stock.min_stock_level ?? '0.00',
            },
            { emitEvent: false }
        );
    }

    onClose(): void {
        this.close.emit();
    }

    enterEdit(): void {
        this.isEditing = true;
        this.errorMessage = null;

        // safety: sync form с current stock (ако е обновяван отвън)
        this.form.patchValue(
            {
                quantity: this.stock.quantity ?? '0.00',
                min_stock_level: this.stock.min_stock_level ?? '0.00',
            },
            { emitEvent: false }
        );
    }

    cancelEdit(): void {
        this.isEditing = false;
        this.errorMessage = null;

        // връщаме form-а към текущите стойности
        this.form.patchValue(
            {
                quantity: this.stock.quantity ?? '0.00',
                min_stock_level: this.stock.min_stock_level ?? '0.00',
            },
            { emitEvent: false }
        );
    }

    onSave(): void {
        if (!this.stock?.id) return;

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        this.errorMessage = null;

        const v = this.form.value;

        this.stockLevelsService
            .update(this.stock.id, {
                quantity: String(v.quantity ?? '0.00'),
                min_stock_level: String(v.min_stock_level ?? '0.00'),
            })
            .subscribe({
                next: (updatedRow) => {
                    this.isSaving = false;
                    this.isEditing = false;

                    this.updated.emit(updatedRow);
                },
                error: (err) => {
                    this.isSaving = false;

                    const raw =
                        err?.error?.detail ||
                        err?.error?.quantity ||
                        err?.error?.min_stock_level ||
                        err?.error?.error;

                    this.errorMessage = Array.isArray(raw) ? raw[0] : (raw || 'Update failed.');
                },
            });
    }
}
