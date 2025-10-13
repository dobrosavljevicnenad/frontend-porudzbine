import { Routes } from '@angular/router';
import { OrdersComponent } from './components/orders/orders.component';

export const routes: Routes = [
  { path: '', component: OrdersComponent },
  { path: '**', redirectTo: '' }
];
