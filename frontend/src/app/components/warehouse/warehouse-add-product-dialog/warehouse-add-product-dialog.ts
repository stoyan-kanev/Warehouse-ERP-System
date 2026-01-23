import { Component, EventEmitter, Input, Output } from '@angular/core';
import {FormBuilder, Validators, ReactiveFormsModule, FormGroup} from '@angular/forms';

export type AddToWarehousePayload = {
    sku: string;
    quantity: string;
    min_stock_level: string;
};
@Component({
  selector: 'app-warehouse-add-product-dialog',
    imports: [
        ReactiveFormsModule
    ],
    standalone: true,

    templateUrl: './warehouse-add-product-dialog.html',
  styleUrl: './warehouse-add-product-dialog.css',
})
export class WarehouseAddProductDialog {
    @Input() isSaving = false;
    @Input() errorMessage: string | null = null;
    @Output() clearError = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() submitForm = new EventEmitter<AddToWarehousePayload>();

    form!:FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            sku: ['', [Validators.required, Validators.minLength(1)]],
            quantity: ['0.00', [Validators.required]],
            min_stock_level: ['0.00', [Validators.required]],
        });
    }
    onAnyFieldInput(): void {
        if (this.errorMessage) this.clearError.emit();
    }
    isInvalid(name: 'sku' | 'quantity' | 'min_stock_level') {
        const c = this.form.get(name);
        return !!c && c.invalid && (c.dirty || c.touched);
    }

    onCancel() {
        this.cancel.emit();
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const v = this.form.value;

        this.submitForm.emit({
            sku: String(v.sku ?? '').trim(),
            quantity: String(v.quantity ?? '0.00'),
            min_stock_level: String(v.min_stock_level ?? '0.00'),
        });
    }
}
