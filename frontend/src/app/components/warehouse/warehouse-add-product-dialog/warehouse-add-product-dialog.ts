import { Component, EventEmitter, Input, Output } from '@angular/core';
import {FormBuilder, Validators, ReactiveFormsModule, FormGroup} from '@angular/forms';

export type AddToWarehousePayload = {
    product: number;
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

    @Output() cancel = new EventEmitter<void>();
    @Output() submitForm = new EventEmitter<AddToWarehousePayload>();

    form!:FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            product: [null as number | null, [Validators.required, Validators.min(1)]],
            quantity: ['0.00', [Validators.required]],
            min_stock_level: ['0.00', [Validators.required]],
        });
    }

    isInvalid(name: 'product' | 'quantity' | 'min_stock_level') {
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
            product: Number(v.product),
            quantity: String(v.quantity ?? '0.00'),
            min_stock_level: String(v.min_stock_level ?? '0.00'),
        });
    }
}
