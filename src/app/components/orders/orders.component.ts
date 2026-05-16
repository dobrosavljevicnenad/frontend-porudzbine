import { Component, OnInit, HostListener } from '@angular/core';
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
  newOrder: Partial<Order> = { treatment: 'plastifikacija' };
  filterTura: number | null = null;
  groupBy: 'none' | 'city' | 'shade' = 'none';

  totalBoards = 0;
  editingBoards = false;
  newBoardsValue: number = 0;

  monthlyProfits: { month: string; profit: number }[] = [];
  editingProfitMonth: string | null = null;
  editingProfitValue: number = 0;

  sablonVisible = false;
  readonly sablonText =
`Ime:
Prezime:
Kontakt mesto: /
Tura: 1
Količina: 1
Dimenzije klime: /
Dimenzije maske:
Model maske:
Grad:
Adresa:
Telefon:
Plastifikacija:
Boja / ton:
Cena (RSD):
Komentar: /`;

  sablonKopiran = false;

  copySablon() {
    navigator.clipboard.writeText(this.sablonText).then(() => {
      this.sablonKopiran = true;
      setTimeout(() => this.sablonKopiran = false, 2000);
    });
  }

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
      city: get('Grad') || this.newOrder.city || '',
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
    const boardsMap = new Map<string, number>();
    for (const order of this.orders) {
      if (!order.createdAt) continue;
      const d = new Date(order.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      boardsMap.set(key, (boardsMap.get(key) || 0) + (order.quantity || 0));
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const allMonths = new Set<string>([currentMonth]);
    for (const [k] of boardsMap) allMonths.add(k);
    for (const p of this.monthlyProfits) allMonths.add(p.month);

    const profitMap = new Map(this.monthlyProfits.map(p => [p.month, p.profit]));

    return Array.from(allMonths)
      .sort((a, b) => b.localeCompare(a))
      .map(month => {
        const mon = parseInt(month.split('-')[1], 10);
        return {
          month,
          label: month === currentMonth
            ? `Trenutni mesec (${this.MONTHS[mon - 1]})`
            : this.MONTHS[mon - 1],
          profit: profitMap.get(month) || 0,
          boards: boardsMap.get(month) || 0,
          isCurrent: month === currentMonth
        };
      });
  }

  startEditProfit(month: string, profit: number) {
    this.editingProfitMonth = month;
    this.editingProfitValue = profit;
  }

  saveProfit() {
    if (!this.editingProfitMonth) return;
    this.orderService.updateMonthlyProfit(this.editingProfitMonth, this.editingProfitValue)
      .subscribe(updated => {
        const idx = this.monthlyProfits.findIndex(p => p.month === updated.month);
        if (idx >= 0) {
          this.monthlyProfits[idx] = updated;
        } else {
          this.monthlyProfits.push(updated);
        }
        this.editingProfitMonth = null;
      });
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

    this.loadOrders();
    this.loadStock();
    this.loadMonthlyProfits();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(orders => this.orders = orders);
  }

  loadMonthlyProfits() {
    this.orderService.getMonthlyProfits().subscribe(profits => this.monthlyProfits = profits);
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

  get groupedOrders(): { key: string; orders: Order[] }[] {
    if (this.groupBy === 'none') {
      return [{ key: '', orders: this.filteredOrders }];
    }

    const map = new Map<string, Order[]>();
    for (const order of this.filteredOrders) {
      const key = this.groupBy === 'city'
        ? (order.city?.trim() || 'Bez grada')
        : (order.shade?.trim() || 'Bez boje');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(order);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'sr'))
      .map(([key, orders]) => ({ key, orders }));
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

  get eo(): Order { return this.editingOrder!; }

  @HostListener('window:paste', ['$event'])
  onGlobalPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          if (this.editingOrder) {
            this.editingOrder.imageBase64 = reader.result as string;
          } else {
            this.newOrder.imageBase64 = reader.result as string;
          }
        };
        reader.readAsDataURL(file);
        event.preventDefault();
        break;
      }
    }
  }

  onImageSelected(event: Event, target: 'new' | 'edit') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (target === 'new') {
        this.newOrder.imageBase64 = reader.result as string;
      } else if (this.editingOrder) {
        this.editingOrder.imageBase64 = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(target: 'new' | 'edit') {
    if (target === 'new') {
      this.newOrder.imageBase64 = undefined;
    } else if (this.editingOrder) {
      this.editingOrder.imageBase64 = undefined;
    }
  }

  trackByMonth(_: number, stat: { month: string }): string {
    return stat.month;
  }

  trackByGroupKey(_: number, group: { key: string; orders: Order[] }): string {
    return group.key;
  }

  trackByOrderId(_: number, order: Order): string {
    return order._id ?? '';
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
