import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.services';
import { Product } from '../product.types';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { DecimalPipe, NgIf } from '@angular/common';
import { ProductFormDialogComponent } from '../product-form-dialog/product-form-dialog';
import { EditFormPopup } from '../edit-form-popup/edit-form-popup';
import { ProductDetails } from '../product-details/product-details';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [MatButton, DecimalPipe, MatDialogModule, NgIf],
    templateUrl: './product-list.html',
    styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
    currentPage = 1;

    skuQuery = '';
    private sku$ = new Subject<string>();

    filteredProducts: Product[] = [];

    isSearching = false;
    searchError: string | null = null;

    get products(): Product[] {
        return this.productService.products;
    }

    get pagination() {
        return this.productService.pagination;
    }

    constructor(private productService: ProductService, private dialog: MatDialog) {}

    ngOnInit(): void {
        this.loadProducts();

        this.sku$
            .pipe(debounceTime(200), distinctUntilChanged())
            .subscribe((q) => {
                this.skuQuery = q;

                if (!this.skuQuery) {
                    this.clearSkuSearch();
                    return;
                }

                this.searchBySku();
            });
    }

    loadProducts(page: number = 1): void {
        if (page < 1) return;

        this.productService.loadProducts(page).subscribe({
            next: () => {
                this.currentPage = page;

                if (!this.skuQuery) {
                    this.filteredProducts = [...this.products];
                }
            },
            error: (err) => console.error('Failed to load products', err),
        });
    }

    onSkuInput(value: string): void {
        this.sku$.next((value ?? '').trim());
    }

    applySkuSearch(): void {
        this.skuQuery = this.skuQuery.trim();

        if (!this.skuQuery) {
            this.clearSkuSearch();
            return;
        }

        this.searchBySku();
    }

    clearSkuSearch(): void {
        this.skuQuery = '';
        this.isSearching = false;
        this.searchError = null;

        this.filteredProducts = [...this.products];
    }

    private searchBySku(): void {
        const sku = this.skuQuery.trim();
        if (!sku) return;

        this.isSearching = true;
        this.searchError = null;

        this.productService.searchBySku(sku).subscribe({
            next: (product) => {
                this.filteredProducts = [product];
                this.isSearching = false;
            },
            error: (err) => {
                if (err?.status === 404 || err?.status === 400) {
                    this.filteredProducts = [];
                    this.searchError = `No product found with SKU: ${sku}`;
                } else {
                    this.filteredProducts = [];
                    this.searchError = 'Search failed. Try again.';
                }
                this.isSearching = false;
            },
        });
    }

    openAddProductDialog(): void {
        const dialogRef = this.dialog.open(ProductFormDialogComponent, {
            width: '720px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            panelClass: 'product-dialog-panel',
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts(this.currentPage);
                if (this.skuQuery) this.searchBySku();
            }
        });
    }

    openEditDialog(product: Product): void {
        const dialogRef = this.dialog.open(EditFormPopup, {
            width: '720px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            panelClass: 'erp-dialog',
            data: product,
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts(this.currentPage);
                if (this.skuQuery) this.searchBySku();
            }
        });
    }

    openDetailDialog(product: Product): void {
        const dialogRef = this.dialog.open(ProductDetails, {
            width: '1520px',
            maxWidth: '92vw',
            maxHeight: '95vh',
            panelClass: 'erp-detail-dialog',
            data: product,
        });

        dialogRef.afterClosed().subscribe((result: 'refresh' | undefined) => {
            if (result === 'refresh') {
                this.loadProducts(this.currentPage);
                if (this.skuQuery) this.searchBySku();
            }
        });
    }
}
