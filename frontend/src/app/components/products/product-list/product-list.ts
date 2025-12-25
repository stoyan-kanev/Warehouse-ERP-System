import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.services';
import { Product } from '../product.types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import {DecimalPipe, NgIf} from '@angular/common';
import { ProductFormDialogComponent } from '../product-form-dialog/product-form-dialog';
import { EditFormPopup } from '../edit-form-popup/edit-form-popup';
import {ProductDetails} from '../product-details/product-details';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [
        MatButton,
        DecimalPipe,
        MatDialogModule,
        NgIf
    ],
    templateUrl: './product-list.html',
    styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
    currentPage = 1;

    get products(): Product[] {
        return this.productService.products;
    }

    get pagination() {
        return this.productService.pagination;
    }

    constructor(
        private productService: ProductService,
        private dialog: MatDialog
    ) {}

    ngOnInit() {
        this.loadProducts();
    }

    loadProducts(page: number = 1) {
        if (page < 1) return;

        this.productService.loadProducts(page).subscribe(() => {
            this.currentPage = page;
        });
    }

    openAddProductDialog() {
        const dialogRef = this.dialog.open(ProductFormDialogComponent, {
            width: '720px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            panelClass: 'product-dialog-panel'
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts(this.currentPage);
            }
        });
    }

    openEditDialog(product: Product) {
        const dialogRef = this.dialog.open(EditFormPopup, {
            width: '720px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            panelClass: 'erp-dialog',
            data: product
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts(this.currentPage);
            }
        });
    }

    openDetailDialog(product: Product) {
        const dialogRef = this.dialog.open(ProductDetails, {
            width: '1520px',
            maxWidth: '92vw',
            maxHeight: '95vh',
            panelClass: 'erp-detail-dialog',
            data: product
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts(this.currentPage);
            }
        });
    }
}
