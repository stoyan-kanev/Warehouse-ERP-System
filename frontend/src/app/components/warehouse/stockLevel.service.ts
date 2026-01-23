import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {Paginated, StockLevel, StockLevelCreatePayload} from './warehouse.types';



@Injectable({ providedIn: 'root' })
export class StockLevelsService {
    private readonly API = environment.apiUrl.replace(/\/+$/, '');
    private readonly baseUrl = `${this.API}/api/v1/stocklevels/`;

    constructor(private http: HttpClient) {}

    listByWarehouse(warehouseId: number): Observable<StockLevel[]> {
        const params = new HttpParams().set('warehouse', String(warehouseId));

        return this.http
            .get<Paginated<StockLevel>>(this.baseUrl, { params, withCredentials: true })
            .pipe(map((res) => res.results));
    }

    createForWarehouse(warehouseId: number, payload: StockLevelCreatePayload): Observable<StockLevel> {
        const params = new HttpParams().set('warehouse', String(warehouseId));

        return this.http.post<StockLevel>(this.baseUrl, payload, { params, withCredentials: true });
    }

    update(id: number, payload: { quantity: string; min_stock_level: string }) {
        return this.http.patch<StockLevel>(`${this.baseUrl}${id}/`, payload, { withCredentials: true });
    }


    remove(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${id}/`, { withCredentials: true });
    }
}
