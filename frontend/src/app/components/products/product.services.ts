import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment';
import {PaginatedProducts, PaginatedResponse, Product} from './product.types';
import {Observable, tap} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private apiUrl = `${environment.apiUrl}/api/v1/products`;
    private apiUrlProductList = `${environment.apiUrl}/api/v1/products-list`

    private _products: Product[] = [];
    private _pagination = { count: 0, next: null as string | null, previous: null as string | null };

    get products(): Product[] {
        return this._products;
    }

    get pagination() {
        return this._pagination;
    }
    constructor(private http: HttpClient) {}

    loadProducts(page: number = 1): Observable<PaginatedProducts> {
        return this.http
            .get<PaginatedProducts>(`${this.apiUrlProductList}?page=${page}`, { withCredentials: true })
            .pipe(
                tap((response) => {
                    this._products = response.results;
                    this._pagination = {
                        count: response.count,
                        next: response.next,
                        previous: response.previous,
                    };
                })
            );
    }

    createProduct(data: FormData) {
        return this.http.post(`${this.apiUrl}/create`, data, {
            withCredentials: true,
        });
    }
    editProduct(id: number, fd: FormData) {
        return this.http.put(`${this.apiUrl}/${id}`, fd, { withCredentials: true });
    }
    deleteProduct(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`, {
            withCredentials: true,
        },)
    }

}
