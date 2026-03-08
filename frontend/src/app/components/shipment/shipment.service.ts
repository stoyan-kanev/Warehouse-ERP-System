import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ShipmentService {
    private readonly baseUrl = `${environment.apiUrl}/api/v1/shipments/`;

    constructor(private http: HttpClient) {
    }


    createShipment(data: any) {

        return this.http.post(`${this.baseUrl}`, data, {withCredentials: true});
    }

}
