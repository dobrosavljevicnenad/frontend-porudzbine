import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6 text-gray-800">Porudžbine</h1>

      <!-- Forma za novu porudžbinu -->
      <form (ngSubmit)="addOrder()" class="bg-white p-6 rounded-lg shadow-md mb-10 space-y-4">
        <h2 class="text-xl font-semibold text-gray-700">Dodaj novu porudžbinu</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input [(ngModel)]="newOrder.firstName" name="firstName" placeholder="Ime" required
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.lastName" name="lastName" placeholder="Prezime" required
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.contactPlace" name="contactPlace" placeholder="Kontakt mesto"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.klimaDimensions" name="klimaDimensions" placeholder="Dimenzije klime"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.maskDimensions" name="maskDimensions" placeholder="Dimenzije maske"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.deadline" name="deadline" type="date" placeholder="Rok"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.maskModel" name="maskModel" placeholder="Model maske"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.address" name="address" placeholder="Adresa"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.phone" name="phone" placeholder="Telefon"
            class="border p-2 rounded w-full" />
          <select [(ngModel)]="newOrder.treatment" name="treatment" class="border p-2 rounded w-full">
            <option value="plastifikacija">Plastifikacija</option>
            <option value="farbanje">Farbanje</option>
          </select>
          <input [(ngModel)]="newOrder.shade" name="shade" placeholder="Boja/ton"
            class="border p-2 rounded w-full" />
          <input [(ngModel)]="newOrder.price" name="price" type="number" placeholder="Cena"
            class="border p-2 rounded w-full" />
        </div>

        <textarea [(ngModel)]="newOrder.comment" name="comment" placeholder="Komentar"
          class="border p-2 rounded w-full"></textarea>

        <button type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">Dodaj porudžbinu</button>
      </form>

      <!-- Lista porudžbina -->
      <div class="grid gap-6">
        <div *ngFor="let o of orders" class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-lg font-bold text-gray-700">{{ o.firstName }} {{ o.lastName }}</h3>
            <button (click)="deleteOrder(o._id)"
              class="text-red-600 hover:text-red-800 font-semibold">Obriši</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
            <div><span class="font-semibold">Kontakt mesto:</span> {{ o.contactPlace || '-' }}</div>
            <div><span class="font-semibold">Dimenzije klime:</span> {{ o.klimaDimensions || '-' }}</div>
            <div><span class="font-semibold">Dimenzije maske:</span> {{ o.maskDimensions || '-' }}</div>
            <div><span class="font-semibold">Rok:</span> {{ o.deadline | date:'mediumDate' }}</div>
            <div><span class="font-semibold">Model maske:</span> {{ o.maskModel || '-' }}</div>
            <div><span class="font-semibold">Adresa:</span> {{ o.address || '-' }}</div>
            <div><span class="font-semibold">Telefon:</span> {{ o.phone || '-' }}</div>
            <div><span class="font-semibold">Tretman:</span> {{ o.treatment }}</div>
            <div><span class="font-semibold">Boja/ton:</span> {{ o.shade || '-' }}</div>
            <div><span class="font-semibold">Cena:</span> {{ o.price ? (o.price + ' RSD') : '-' }}</div>
            <div class="col-span-2"><span class="font-semibold">Komentar:</span> {{ o.comment || '-' }}</div>
            <div class="col-span-2 text-right text-gray-400 text-sm">
              Kreirano: {{ o.createdAt | date:'short' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
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
}
