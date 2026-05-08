import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  editingOrder: Order | null = null;
  newOrder: Partial<Order> = { deadline: '', treatment: 'plastifikacija'};
  filterTura: number | null = null;

  totalBoards = 0;
  editingBoards = false;
  newBoardsValue: number = 0;

  isDarkMode = false;

  pasteText = '';

  parseAndFill() {
    const map: Record<string, string> = {};

    this.pasteText.split('\n').forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const rawKey = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (rawKey) map[this.normalizeKey(rawKey)] = value;
    });

    const get = (...keys: string[]): string => {
      for (const k of keys) {
        const v = map[this.normalizeKey(k)];
        if (v !== undefined) return v;
      }
      return '';
    };

    // Konvertuj datum MM/DD/YYYY → YYYY-MM-DD
    let deadline = this.newOrder.deadline || '';
    const dateStr = get('Datum');
    if (dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [m, d, y] = parts;
        deadline = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }

    const shade = get('Boja / ton', 'Boja/ton', 'Boja') || get('Plastifikacija');
    const treatmentRaw = get('Plastifikacija');
    const treatment: 'plastifikacija' | 'farbanje' = treatmentRaw
      ? 'plastifikacija'
      : get('Farbanje')
      ? 'farbanje'
      : (this.newOrder.treatment || 'plastifikacija');

    const turaStr = get('Tura');
    const quantityStr = get('Količina', 'Kolicina');
    const priceStr = get('Cena (RSD)', 'Cena');

    this.newOrder = {
      ...this.newOrder,
      firstName: get('Ime') || this.newOrder.firstName || '',
      lastName: get('Prezime') || this.newOrder.lastName || '',
      contactPlace: get('Kontakt mesto') || this.newOrder.contactPlace || '',
      tura: turaStr ? Number(turaStr) : this.newOrder.tura,
      quantity: quantityStr ? Number(quantityStr) : this.newOrder.quantity,
      klimaDimensions: get('Dimenzije klime') || this.newOrder.klimaDimensions || '',
      maskDimensions: get('Dimenzije maske') || this.newOrder.maskDimensions || '',
      maskModel: get('Model maske') || this.newOrder.maskModel || '',
      deadline,
      address: get('Adresa') || this.newOrder.address || '',
      phone: get('Telefon') || this.newOrder.phone || '',
      treatment,
      shade,
      price: priceStr ? Number(priceStr) : this.newOrder.price,
      comment: get('Komentar') || this.newOrder.comment || '',
    };

    this.pasteText = '';
  }

  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private readonly MONTHS = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];

  get monthlyStats() {
    const statsMap = new Map<string, { profit: number; boards: number; year: number; month: number }>();

    for (const order of this.orders) {
      if (!order.createdAt) continue;
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!statsMap.has(key)) {
        statsMap.set(key, { profit: 0, boards: 0, year: d.getFullYear(), month: d.getMonth() });
      }
      const s = statsMap.get(key)!;
      s.profit += order.profit || 0;
      s.boards += order.quantity || 0;
    }

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;

    if (!statsMap.has(currentKey)) {
      statsMap.set(currentKey, { profit: 0, boards: 0, year: now.getFullYear(), month: now.getMonth() });
    }

    return Array.from(statsMap.entries())
      .sort((a, b) => {
        const [ay, am] = a[0].split('-').map(Number);
        const [by, bm] = b[0].split('-').map(Number);
        return by !== ay ? by - ay : bm - am;
      })
      .map(([key, stat]) => ({
        label: key === currentKey
          ? `Trenutni mesec (${this.MONTHS[stat.month]})`
          : this.MONTHS[stat.month],
        profit: stat.profit,
        boards: stat.boards,
        isCurrent: key === currentKey
      }));
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    const body = document.body;

    if (this.isDarkMode) {
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark');
    }

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);

    this.newOrder.deadline = futureDate.toISOString().split('T')[0];

    this.loadOrders();
    this.loadStock();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(orders => this.orders = orders);
  }

  loadStock(){
    this.orderService.getStock().subscribe(stock => {
      this.totalBoards = stock.availableBoards;
      this.newBoardsValue = stock.availableBoards;
    })
  }

  get filteredOrders(): Order[] {
    if (this.filterTura === null) return this.orders;
    return this.orders.filter(o => o.tura === this.filterTura);
  }

  addOrder() {
    if (!this.newOrder.firstName) return;

    this.orderService.createOrder(this.newOrder as Order).subscribe(order => {
      this.orders.unshift(order); // dodaje order na pocetak orders liste

      this.loadStock();

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

  enableEditBoards(){
    this.editingBoards = true;
  }

  saveBoards() {
    this.orderService.updateStock(this.newBoardsValue).subscribe(updated => {
      this.totalBoards = updated.availableBoards;
      this.editingBoards = false;
    });
  }


}
