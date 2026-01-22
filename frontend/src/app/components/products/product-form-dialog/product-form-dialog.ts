import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, Validators, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductService } from '../product.services';
import {NgIf} from '@angular/common';

@Component({
    selector: 'app-product-form-dialog',
    templateUrl: './product-form-dialog.html',
    styleUrls: ['./product-form-dialog.css'],
    imports: [
        ReactiveFormsModule,
        NgIf
    ]
})
export class ProductFormDialogComponent implements OnInit {
    form!: FormGroup;
    selectedFile: File | null = null;
    selectedFileName: string | null = null;




    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private dialogRef: MatDialogRef<ProductFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            sku: ['', Validators.required],
            name: ['', Validators.required],
            description: [''],
            unit: ['', Validators.required],
            price_sell: [ [Validators.required, Validators.min(0)]],
            price_buy: [ [Validators.required, Validators.min(0)]],
            is_active: [true]
        });
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

        // винаги пращай като string
        fd.append('sku', this.form.value.sku);
        fd.append('name', this.form.value.name);
        fd.append('description', this.form.value.description ?? '');
        fd.append('quantity',this.form.value.quantity)
        fd.append('unit', this.form.value.unit);
        fd.append('min_stock_level', String(this.form.value.min_stock_level));
        fd.append('price_sell', String(this.form.value.price_sell));
        fd.append('price_buy', String(this.form.value.price_buy));
        fd.append('is_active', String(this.form.value.is_active));

        if (this.selectedFile) {
            fd.append('image', this.selectedFile);
        }

        this.productService.createProduct(fd).subscribe({
            next: () => this.dialogRef.close('refresh'),
            error: err => console.error('Error creating product:', err)
        });
    }

    onCancel() {
        this.dialogRef.close();
    }
}
