import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  _id?: string;
  firstName: string;
  lastName: string;
  tura: number;
  quantity: number;
  contactPlace?: string;
  klimaDimensions?: string;
  maskDimensions?: string;
  maskModel?: string;
  city?: string;
  address?: string;
  phone?: string;
  treatment?: 'plastifikacija' | 'farbanje';
  shade?: string;
  price?: number;
  profit?: number;
  comment?: string;
  imageBase64?: string;
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

  getStock(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stock`);
  }

  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  updateOrder(id: string, data: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${id}`, data);
  }

  updateStock(newValue: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/stock`, { availableBoards: newValue });
  }

  getMonthlyProfits(): Observable<{ month: string; profit: number }[]> {
    return this.http.get<{ month: string; profit: number }[]>(`${this.apiUrl}/monthly-profits`);
  }

  updateMonthlyProfit(month: string, profit: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/monthly-profits/${month}`, { profit });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
