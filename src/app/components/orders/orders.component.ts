import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports : [CommonModule, FormsModule],
  templateUrl: './orders.component.html', // HTML fajl
  styleUrls: ['./orders.component.scss']   // Stilovi (ako želiš poseban fajl)
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  editingOrder: Order | null = null;
  newOrder: Partial<Order> = { treatment: 'plastifikacija' };

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(orders => this.orders = orders);
  }

  addOrder() {
    if (!this.newOrder.firstName || !this.newOrder.lastName) return;
    this.orderService.createOrder(this.newOrder as Order).subscribe(order => {
      this.orders.unshift(order);
      this.newOrder = { treatment: 'plastifikacija' };
    });
  }

  deleteOrder(id?: string) {
    if (!id) return;
    this.orderService.deleteOrder(id).subscribe(() => {
      this.orders = this.orders.filter(o => o._id !== id);
    });
  }

  editOrder(order: Order) {
    this.editingOrder = { ...order };
  }

  cancelEdit() {
    this.editingOrder = null;
  }

  saveEdit() {
    if (!this.editingOrder?._id) return;
    this.orderService.updateOrder(this.editingOrder._id, this.editingOrder).subscribe(updated => {
      this.orders = this.orders.map(o => o._id === updated._id ? updated : o);
      this.editingOrder = null;
    });
  }
}
