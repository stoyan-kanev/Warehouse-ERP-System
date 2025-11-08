import {Component, OnInit} from '@angular/core';
import {ProductService} from '../product.services';
import {Product} from '../product.types';
import {MatButton} from '@angular/material/button';
import {ProductFormDialogComponent} from '../product-form-dialog/product-form-dialog';
import {MatDialog} from '@angular/material/dialog';

@Component({
    selector: 'app-product-list',
    imports: [
        MatButton
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

    constructor(private productService: ProductService,private dialog: MatDialog) {}

    ngOnInit() {
        this.loadProducts();
    }

    loadProducts(page: number = 1) {
        if (page < 1) return;

        this.productService.loadProducts(page).subscribe(() => {
            this.currentPage = page;
        });
    }

    goPrev() {
        if (this.pagination.previous) {
            this.loadProducts(this.currentPage - 1);
        }
    }

    goNext() {
        if (this.pagination.next) {
            this.loadProducts(this.currentPage + 1);
        }
    }

    openAddProductDialog() {
        const dialogRef = this.dialog.open(ProductFormDialogComponent, {
            width: '400px',
            panelClass: 'product-dialog-panel'
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts();
            }
        });
    }
}
