import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../../services/order.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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

  // 👇 NOVA polja za chat
  isChatOpen = false;
  chatMessages: { role: 'user' | 'assistant', content: string }[] = [
    {
      role: 'assistant',
      content: 'Zdravo! Ja sam asistent za maske za klimu. Možeš da me pitaš o dimenzijama, rokovima izrade, cenama ili da mi opišeš klimu pa da ti pomognem oko maske. 🙂'
    }
  ];
  chatInput = '';
  isChatLoading = false;

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

  constructor(private orderService: OrderService, private http: HttpClient) {}

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
      this.loadOrders();
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


  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  sendChatMessage() {
    const text = this.chatInput?.trim();
    if (!text) return;

    // Dodaj user poruku u UI
    this.chatMessages.push({ role: 'user', content: text });
    this.chatInput = '';
    this.isChatLoading = true;

    // Ovde možeš da proslediš i kontekst (npr. trenutne porudžbine, stock...)
    const payload = {
      message: text,
      // primer: u budućnosti možeš da proslediš i neke podatke:
      context: {
        totalBoards: this.totalBoards,
        lastOrder: this.orders[0] || null
      }
    };

    // Backend ruta – promeni po želji putanju
    this.http
  .post<{ reply: string }>(
    'https:/localhost:3000/api/orders/chat-ai',
    payload
  )
  .subscribe({
    next: (res) => {
      this.chatMessages.push({
        role: 'assistant',
        content: res.reply || 'Nešto sam se zbunio, pokušaj ponovo 🙂',
      });
      this.isChatLoading = false;
    },
    error: (err) => {
      console.error(err);
      this.chatMessages.push({
        role: 'assistant',
        content:
          'Ups, desila se greška pri komunikaciji. Proveri da li backend radi ili pokušaj kasnije.',
      });
      this.isChatLoading = false;
    },
  });

  }



}
