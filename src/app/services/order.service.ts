import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  _id?: string;
  firstName: string;
  lastName: string;
  contactPlace?: string;
  klimaDimensions?: string;
  maskDimensions?: string;
  deadline?: string;
  maskModel?: string;
  address?: string;
  phone?: string;
  treatment?: 'plastifikacija' | 'farbanje';
  shade?: string;
  price?: number;
  comment?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'https://backend-porudzbine-vegnoa.fly.dev/api/orders';

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
