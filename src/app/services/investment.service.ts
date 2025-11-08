import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, Signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface Investment {
  _id?: string;
  company: string;
  date: string;
  full_amount: number;
}

export interface Withdrawal {
  _id?: string;
  company: string;
  date: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {
  private http = inject(HttpClient);
  private API = 'https://backend-porudzbine-vegnoa.fly.dev/api/investments';

  investments = signal<Investment[]>([]);
  withdrawals = signal<Withdrawal[]>([]);

  // Učitavanje podataka sa backend-a
  loadInvestments() {
    this.http.get<Investment[]>(this.API)
      .subscribe(data => this.investments.set(data));
  }

  loadWithdrawals() {
    this.http.get<Withdrawal[]>(`${this.API}/withdrawals`)
      .subscribe(data => this.withdrawals.set(data));
  }

  // Dodavanje nove investicije
  addInvestment(inv: Investment): Observable<Investment> {
    return this.http.post<Investment>(this.API, inv).pipe(
      tap(() => this.loadInvestments())
    );
  }

  // Dodavanje nove isplate
  addWithdrawal(wd: Withdrawal): Observable<Withdrawal> {
    return this.http.post<Withdrawal>(`${this.API}/withdrawal`, wd).pipe(
      tap(() => this.loadWithdrawals())
    );
  }
}
