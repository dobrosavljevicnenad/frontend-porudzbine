import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  editingOrder: Order | null = null;
  newOrder: Partial<Order> = { deadline: '', treatment: 'plastifikacija'};
  filterTura: number | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);

    this.newOrder.deadline = futureDate.toISOString().split('T')[0];
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(orders => this.orders = orders);
  }

  get filteredOrders(): Order[] {
    if (this.filterTura === null) return this.orders;
    return this.orders.filter(o => o.tura === this.filterTura);
  }

  addOrder() {
    if (!this.newOrder.firstName) return;

    this.orderService.createOrder(this.newOrder as Order).subscribe(order => {
      this.orders.unshift(order);
      this.newOrder = { treatment: 'plastifikacija', tura: 1, quantity: 1 };
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
