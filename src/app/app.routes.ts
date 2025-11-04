import { Routes } from '@angular/router';
import { OrdersComponent } from './components/orders/orders.component';
import { SalesTechniquesComponent } from './components/sales-techniques/sales-techniques.component';

export const routes: Routes = [
  { path: '', component: OrdersComponent },
  { path: 'sales_techniques', component: SalesTechniquesComponent },
  { path: '**', redirectTo: '' }
];
