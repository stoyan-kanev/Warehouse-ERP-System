import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../product.services';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-edit-form-popup',
    standalone: true,
    imports: [ReactiveFormsModule, MatDialogModule],
    templateUrl: './edit-form-popup.html',
    styleUrl: './edit-form-popup.css',
})
export class EditFormPopup implements OnInit {
    form!: FormGroup;
    isDelete = false;
    constructor(
        private formBuilder: FormBuilder,
        private productService: ProductService,
        private dialogRef: MatDialogRef<EditFormPopup>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {
        this.form = this.formBuilder.group({
            sku: ['', Validators.required],
            name: ['', Validators.required],
            description: [''],
            unit: ['', Validators.required],
            min_stock_level: [0, [Validators.required, Validators.min(0)]],
            price_sell: [0, [Validators.required, Validators.min(0)]],
            price_buy: [0, [Validators.required, Validators.min(0)]],
            is_active: [true],
        });

        if (this.data) {
            this.form.patchValue({
                sku: this.data.sku,
                name: this.data.name,
                description: this.data.description,
                unit: this.data.unit,
                min_stock_level: this.data.min_stock_level,
                price_sell: this.data.price_sell,
                price_buy: this.data.price_buy,
                is_active: this.data.is_active,
            });
        }
    }

    onSubmit() {
        if (this.form.invalid) return;
        this.productService.editProduct(this.data.id, this.form.value).subscribe({
            next: () => this.dialogRef.close('refresh'),
            error: (err) => console.error('Error updating product:', err),
        });
    }

    onCancel() {
        this.dialogRef.close();
    }

    onDelete() {
        this.isDelete = confirm('Are you sure?',);
        if (this.isDelete) {
            this.productService.deleteProduct(this.data.id).subscribe({
                next: () => this.dialogRef.close('refresh'),
                error: (err) => console.error('Error deleting product:', err),
            })
        }
    }
}
