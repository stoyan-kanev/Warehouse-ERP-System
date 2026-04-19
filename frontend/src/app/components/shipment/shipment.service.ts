import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {PaginatedResponse, Shipment, ShipmentPayload} from './shipment.type';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ShipmentService {
    private readonly apiUrl = `${environment.apiUrl}/api/v1`;

    constructor(private http: HttpClient) {
    }

    getShipments(
        page: number = 1,
        pageSize: number = 10,
        search: string = ''
    ): Observable<PaginatedResponse<Shipment>> {
        let url = `${this.apiUrl}/shipments/?page=${page}&page_size=${pageSize}`;

        if (search.trim()) {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        return this.http.get<PaginatedResponse<Shipment>>(url);
    }

    getShipmentById(id: number): Observable<Shipment> {
        return this.http.get<Shipment>(`${this.apiUrl}/shipments/${id}/`);
    }

    createShipment(payload: ShipmentPayload): Observable<Shipment> {
        return this.http.post<Shipment>(`${this.apiUrl}/shipments/`, payload);
    }

    updateShipment(id: number, payload: ShipmentPayload): Observable<Shipment> {
        return this.http.put<Shipment>(`${this.apiUrl}/shipments/${id}/`, payload);
    }

    patchShipment(id: number, payload: Partial<ShipmentPayload>): Observable<Shipment> {
        return this.http.patch<Shipment>(`${this.apiUrl}/shipments/${id}/`, payload);
    }

    dispatchShipment(id: number): Observable<Shipment> {
        return this.http.post<Shipment>(`${this.apiUrl}/shipments/${id}/mark-sent/`, {});
    }

    receiveShipment(id: number): Observable<Shipment> {
        return this.http.post<Shipment>(`${this.apiUrl}/shipments/${id}/receive/`, {});
    }

    cancelShipment(id: number): Observable<Shipment> {
        return this.http.post<Shipment>(`${this.apiUrl}/shipments/${id}/cancel/`, {});
    }

}
