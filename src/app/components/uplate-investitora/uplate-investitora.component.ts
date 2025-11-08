import { Component, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestmentService, Investment, Withdrawal } from '../../services/investment.service'
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-uplate-investitora',
  standalone: true,
  imports: [FormsModule, CommonModule, DecimalPipe, RouterLink],
  templateUrl: './uplate-investitora.component.html',
  styleUrl: './uplate-investitora.component.scss'
})
export class UplateInvestitoraComponent {
  constructor(public investmentService: InvestmentService) {
    this.investmentService.loadInvestments();
    this.investmentService.loadWithdrawals();
  }

  // 📥 Form modeli
  newInvestment = { company: '', date: this.getToday(), full_amount: 0 };
  newWithdrawal = { company: '', date: this.getToday(), amount: 0 };

  getToday(): string {
    return new Date().toISOString().split('T')[0]; // format YYYY-MM-DD
  }


  // 🔹 Computed signal za remaining_amount
  remainingAmounts = computed(() =>
    this.investmentService.investments().map(inv => {
      const totalWithdrawn = this.investmentService.withdrawals()
        .filter(w => w.company === inv.company)
        .reduce((sum, w) => sum + w.amount, 0);
      return { ...inv, remaining_amount: Math.max(inv.full_amount - totalWithdrawn, 0) };
    })
  );

  // ➕ Dodaj uplatu
  addInvestment() {
    const date = this.newInvestment.date || new Date().toISOString().split('T')[0];

    this.investmentService.addInvestment({
      company: this.newInvestment.company,
      date,
      full_amount: Number(this.newInvestment.full_amount)
    }).subscribe(() => this.newInvestment = { company: '', date: '', full_amount: 0 });
  }

  // ➖ Dodaj isplatu
  addWithdrawal() {
    if (!this.newWithdrawal.company) return;
    const date = this.newWithdrawal.date || new Date().toISOString().split('T')[0];

    this.investmentService.addWithdrawal({
      company: this.newWithdrawal.company,
      date,
      amount: Number(this.newWithdrawal.amount)
    }).subscribe(() => this.newWithdrawal = { company: '', date: '', amount: 0 });
  }

  // 🔹 Ukupni iznosi
  totalInvested = computed(() =>
    this.investmentService.investments().reduce((sum, inv) => sum + inv.full_amount, 0)
  );

  totalWithdrawn = computed(() =>
    this.investmentService.withdrawals().reduce((sum, wd) => sum + wd.amount, 0)
  );

  totalRemaining = computed(() =>
    this.remainingAmounts().reduce((sum, inv) => sum + inv.remaining_amount, 0)
  );

  // 🔹 Lista firmi za dropdown kod isplate
  get companies() {
    return Array.from(new Set(this.investmentService.investments().map(i => i.company))).sort((a, b) => a.localeCompare(b));
  }
}
