import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../product.services';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {NgIf} from '@angular/common';

@Component({
    selector: 'app-edit-form-popup',
    standalone: true,
    imports: [ReactiveFormsModule, MatDialogModule, NgIf],
    templateUrl: './edit-form-popup.html',
    styleUrl: './edit-form-popup.css',
})
export class EditFormPopup implements OnInit {
    form!: FormGroup;
    isDelete = false;
    selectedFile: File | null = null;
    selectedFileName: string | null = null;

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
            quantity: ['', Validators.required],
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
                quantity: this.data.quantity,
                unit: this.data.unit,
                min_stock_level: this.data.min_stock_level,
                price_sell: this.data.price_sell,
                price_buy: this.data.price_buy,
                is_active: this.data.is_active,
            });
        }
    }
    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;

        this.selectedFile = file;
        this.selectedFileName = file ? file.name : null;
    }
    onSubmit() {
        if (this.form.invalid) return;

        const fd = new FormData();

        fd.append('sku', this.form.value.sku);
        fd.append('name', this.form.value.name);
        fd.append('description', this.form.value.description ?? '');
        fd.append('unit', this.form.value.unit);

        fd.append('quantity', String(this.form.value.quantity));

        fd.append('min_stock_level', String(this.form.value.min_stock_level));
        fd.append('price_sell', String(this.form.value.price_sell));
        fd.append('price_buy', String(this.form.value.price_buy));
        fd.append('is_active', String(this.form.value.is_active));

        if (this.selectedFile) {
            fd.append('image', this.selectedFile);
        }

        this.productService.editProduct(this.data.id, fd).subscribe({
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
