import { Component, Inject, OnInit } from '@angular/core';
import {FormBuilder, Validators, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductService } from '../product.services';

@Component({
    selector: 'app-product-form-dialog',
    templateUrl: './product-form-dialog.html',
    styleUrls: ['./product-form-dialog.css'],
    imports: [
        ReactiveFormsModule
    ]
})
export class ProductFormDialogComponent implements OnInit {
    form!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private productService: ProductService,
        private dialogRef: MatDialogRef<ProductFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            name: ['', Validators.required],
            sku: [''],
            price: [0, [Validators.required, Validators.min(0)]],
            description: [''],
            category: [''],
        });
    }

    onSubmit() {
        if (this.form.invalid) return;

        this.productService.createProduct(this.form.value).subscribe({
            next: () => this.dialogRef.close('refresh'),
            error: (err) => console.error(err),
        });
    }

    onCancel() {
        this.dialogRef.close();
    }
}
