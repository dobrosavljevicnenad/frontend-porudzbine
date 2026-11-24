import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type OrderStatus = 'PORUCENO' | 'ISECENO' | 'PLASTIFICIRANO' | 'ISPORUCENO';
export type MaskType = 'klima' | 'radijator';

export interface Order {
  _id?: string;
  firstName: string;
  lastName: string;
  maskType?: MaskType;
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
  status?: OrderStatus;
  comment?: string;
  imageBase64?: string; // zastarelo polje, ostavljeno zbog starih porudžbina
  images?: string[];
  createdAt?: string;
}

// Odgovor servera kad porudžbina pređe u ISPORUCENO — porudžbina se briše
// i njena količina se dodaje u mesečnu statistiku.
export interface OrderDeliveredResponse {
  delivered: true;
  deletedOrderId: string;
  monthly: { month: string; count: number };
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

  updateOrder(id: string, data: Partial<Order>): Observable<Order | OrderDeliveredResponse> {
    return this.http.put<Order | OrderDeliveredResponse>(`${this.apiUrl}/${id}`, data);
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order | OrderDeliveredResponse> {
    return this.http.put<Order | OrderDeliveredResponse>(`${this.apiUrl}/${id}`, { status });
  }

  updateStock(newValue: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/stock`, { availableBoards: newValue });
  }

  getMonthlyDeliveries(): Observable<{ month: string; count: number }[]> {
    return this.http.get<{ month: string; count: number }[]>(`${this.apiUrl}/monthly-deliveries`);
  }

  updateMonthlyDelivery(month: string, count: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/monthly-deliveries/${month}`, { count });
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
