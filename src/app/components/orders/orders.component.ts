import { Component, OnInit, HostListener } from '@angular/core';
import { OrderService, Order, OrderStatus, OrderDeliveredResponse } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

function isDeliveredResponse(value: any): value is OrderDeliveredResponse {
  return !!value && value.delivered === true;
}

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
  newOrder: Partial<Order> = { treatment: 'plastifikacija', images: [] };
  filterTura: number | null = null;
  filterStatus: OrderStatus | null = null;
  groupBy: 'none' | 'city' | 'shade' = 'none';

  // Šablon za ChatGPT i Brzo popunjavanje su privremeno sakriveni.
  showQuickTools = false;

  readonly STATUSES: OrderStatus[] = ['PORUCENO', 'ISECENO', 'PLASTIFICIRANO', 'ISPORUCENO'];
  readonly STATUS_LABELS: Record<OrderStatus, string> = {
    PORUCENO: 'Poručeno',
    ISECENO: 'Isečeno',
    PLASTIFICIRANO: 'Plastificirano',
    ISPORUCENO: 'Isporučeno'
  };
  readonly STATUS_ACCENT: Record<OrderStatus, string> = {
    PORUCENO: 'accent-graphite',
    ISECENO: 'accent-blade',
    PLASTIFICIRANO: 'accent-resin',
    ISPORUCENO: 'accent-rust'
  };

  statusIndex(status?: OrderStatus): number {
    return this.STATUSES.indexOf(status || 'PORUCENO');
  }

  ticketCode(order: Order): string {
    return (order._id || '').slice(-4).toUpperCase();
  }

  totalBoards = 0;
  editingBoards = false;
  newBoardsValue: number = 0;

  monthlyDeliveries: { month: string; count: number }[] = [];
  editingDeliveryMonth: string | null = null;
  editingDeliveryValue: number = 0;

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
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const allMonths = new Set<string>([currentMonth]);
    for (const d of this.monthlyDeliveries) allMonths.add(d.month);

    const countMap = new Map(this.monthlyDeliveries.map(d => [d.month, d.count]));

    return Array.from(allMonths)
      .sort((a, b) => b.localeCompare(a))
      .map(month => {
        const mon = parseInt(month.split('-')[1], 10);
        return {
          month,
          label: month === currentMonth
            ? `Trenutni mesec (${this.MONTHS[mon - 1]})`
            : this.MONTHS[mon - 1],
          count: countMap.get(month) || 0,
          isCurrent: month === currentMonth
        };
      });
  }

  startEditDelivery(month: string, count: number) {
    this.editingDeliveryMonth = month;
    this.editingDeliveryValue = count;
  }

  saveDelivery() {
    if (!this.editingDeliveryMonth) return;
    this.orderService.updateMonthlyDelivery(this.editingDeliveryMonth, this.editingDeliveryValue)
      .subscribe(updated => {
        const idx = this.monthlyDeliveries.findIndex(d => d.month === updated.month);
        if (idx >= 0) {
          this.monthlyDeliveries[idx] = updated;
        } else {
          this.monthlyDeliveries.push(updated);
        }
        this.editingDeliveryMonth = null;
      });
  }

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
    this.loadStock();
    this.loadMonthlyDeliveries();
  }

  loadOrders() {
    this.orderService.getOrders().subscribe(orders => this.orders = orders);
  }

  loadMonthlyDeliveries() {
    this.orderService.getMonthlyDeliveries().subscribe(deliveries => this.monthlyDeliveries = deliveries);
  }

  loadStock(){
    this.orderService.getStock().subscribe(stock => {
      this.totalBoards = stock.availableBoards;
      this.newBoardsValue = stock.availableBoards;
    })
  }

  get filteredOrders(): Order[] {
    return this.orders.filter(o =>
      (this.filterTura === null || o.tura === this.filterTura) &&
      (this.filterStatus === null || o.status === this.filterStatus)
    );
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

      this.newOrder = { treatment: 'plastifikacija', tura: 1, quantity: 1, images: [] };
    });
  }

  deleteOrder(id?: string) {
    if (!id) return;
    this.orderService.deleteOrder(id).subscribe(() => {
      this.orders = this.orders.filter(o => o._id !== id);
    });
  }

  changeStatus(order: Order, status: OrderStatus) {
    if (!order._id || order.status === status) return;

    if (status === 'ISPORUCENO') {
      const confirmed = confirm(
        `Porudžbina za ${order.firstName} ${order.lastName} će biti uklonjena sa liste i dodata u broj isporučenih maski za ovaj mesec. Nastaviti?`
      );
      if (!confirmed) return;
    }

    const id = order._id;
    this.orderService.updateOrderStatus(id, status).subscribe(response => {
      if (isDeliveredResponse(response)) {
        this.orders = this.orders.filter(o => o._id !== id);
        this.loadMonthlyDeliveries();
      } else {
        this.orders = this.orders.map(o => o._id === response._id ? response : o);
      }
    });
  }

  get eo(): Order { return this.editingOrder!; }

  // Stare porudžbine su čuvale samo jednu sliku u imageBase64 — ovo ih
  // pretvara u niz da bi se prikazivale i uređivale na isti način kao nove.
  orderImages(o: Order): string[] {
    // "??" (a ne dužina niza) pravi razliku između "stara porudžbina bez
    // images polja" i "images polje postoji ali je namerno ispraznjeno".
    return o.images ?? (o.imageBase64 ? [o.imageBase64] : []);
  }

  // Slike se čuvaju kao base64 tekst unutar porudžbine, i CELA lista slika
  // se šalje na svako čuvanje — nesažete fotke (npr. sa telefona, nekoliko
  // MB svaka) zato čine da "Sačuvaj" traje sporo. Ovo ih pre dodavanja smanji
  // na razumnu rezoluciju/kvalitet da čuvanje ostane brzo.
  private compressImage(dataUrl: string, maxDim = 1600, quality = 0.85): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl); // ako ne uspe, zadrži original
      img.src = dataUrl;
    });
  }

  private addImageTo(target: 'new' | 'edit', dataUrl: string) {
    this.compressImage(dataUrl).then(compressed => {
      const bucket = target === 'new' ? this.newOrder : this.editingOrder;
      if (!bucket) return;
      if (!bucket.images) bucket.images = [];
      bucket.images.push(compressed);
    });
  }

  @HostListener('window:paste', ['$event'])
  onGlobalPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;
    const target: 'new' | 'edit' = this.editingOrder ? 'edit' : 'new';
    let handled = false;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;
        handled = true;
        const reader = new FileReader();
        reader.onload = () => this.addImageTo(target, reader.result as string);
        reader.readAsDataURL(file);
      }
    }
    if (handled) event.preventDefault();
  }

  onImageSelected(event: Event, target: 'new' | 'edit') {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => this.addImageTo(target, reader.result as string);
      reader.readAsDataURL(file);
    });
    input.value = ''; // omogućava ponovni izbor istog fajla
  }

  removeImage(target: 'new' | 'edit', index: number) {
    if (target === 'new') {
      this.newOrder.images?.splice(index, 1);
    } else if (this.editingOrder) {
      this.editingOrder.images?.splice(index, 1);
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
    const rawImages = this.orderImages(order);
    // Prikaži odmah (bez čekanja), a u pozadini sažmi postojeće slike —
    // ako su stare/velike, čuvanje će posle ovoga opet biti brzo.
    this.editingOrder = { ...order, images: rawImages.slice() };
    Promise.all(rawImages.map(img => this.compressImage(img))).then(compressed => {
      const current = this.editingOrder;
      if (current && current._id === order._id) {
        current.images = compressed;
      }
    });
  }

  cancelEdit() {
    this.editingOrder = null;
  }

  saveEdit() {
    if (!this.editingOrder?._id) return;

    if (this.editingOrder.status === 'ISPORUCENO') {
      const confirmed = confirm(
        `Porudžbina za ${this.editingOrder.firstName} ${this.editingOrder.lastName} će biti uklonjena sa liste i dodata u broj isporučenih maski za ovaj mesec. Nastaviti?`
      );
      if (!confirmed) return;
    }

    const id = this.editingOrder._id;
    this.orderService.updateOrder(id, this.editingOrder).subscribe(response => {
      if (isDeliveredResponse(response)) {
        this.orders = this.orders.filter(o => o._id !== id);
        this.loadMonthlyDeliveries();
      } else {
        this.orders = this.orders.map(o => o._id === response._id ? response : o);
      }
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
