import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

export type Warehouse = {
    id: number;
    name: string;
    location: string;
    is_active: boolean;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
};

export type WarehouseCreatePayload = {
    name: string;
    location: string;
    is_active: boolean;
};
type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

@Injectable({ providedIn: 'root' })
export class WarehousesService {
    private readonly baseUrl = `${environment.apiUrl}/api/v1/warehouses/`;

    constructor(private http: HttpClient) {}


    list(includeInactive = false): Observable<Warehouse[]> {
        let params = new HttpParams();
        if (includeInactive) params = params.set('include_inactive', 'true');

        return this.http
            .get<Paginated<Warehouse>>(this.baseUrl, { params, withCredentials: true })
            .pipe(map((res) => res.results));
    }

    create(payload: WarehouseCreatePayload): Observable<Warehouse> {
        return this.http.post<Warehouse>(this.baseUrl, payload, {
            withCredentials: true,
        });
    }

    update(id: number, payload: Partial<WarehouseCreatePayload>): Observable<Warehouse> {
        return this.http.patch<Warehouse>(`${this.baseUrl}${id}`, payload, {
            withCredentials: true,
        });
    }

    deactivate(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${id}`, {
            withCredentials: true,
        });
    }
}
