import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ProductService } from '../product.services';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-product-details',
    standalone: true,
    imports: [NgIf, ReactiveFormsModule],
    templateUrl: './product-details.html',
    styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
    form!: FormGroup;

    isEditing = false;
    private initialValue: any = null;

    selectedFile: File | null = null;
    selectedFileName: string | null = null;
    imagePreviewUrl: string | null = null;

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private dialogRef: MatDialogRef<ProductDetails>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            sku: ['', Validators.required],
            name: ['', Validators.required],
            description: [''],
            unit: ['', Validators.required],
            quantity: [0, [Validators.required, Validators.min(0)]],
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

            this.imagePreviewUrl = this.data?.image_url ?? null;
            this.selectedFileName = this.data?.image_name ?? null;
        }

        this.form.disable();
    }





    onCancel() {
        this.dialogRef.close();
    }
}
