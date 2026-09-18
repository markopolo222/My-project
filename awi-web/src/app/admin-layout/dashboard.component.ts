import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
 
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <h1>Irányítópult</h1>
      <p class="subtitle">Üdv az Awi Hegesztés admin felületén.</p>
 
      <div class="stats" *ngIf="!loading">
        <div class="stat-card">
          <div class="stat-number">{{ newOrdersCount }}</div>
          <div class="stat-label">Új rendelés</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalOrdersCount }}</div>
          <div class="stat-label">Rendelés összesen</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ usersCount }}</div>
          <div class="stat-label">Felhasználó</div>
        </div>
      </div>
    </div>
  `,
 styles: [`
    h1 { font-family: 'Archivo Expanded', sans-serif; font-size: 26px; color: #201d1a; margin: 0 0 6px; }
    .subtitle { color: #4d5257; font-size: 15px; margin-bottom: 24px; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat-card {
      background: #fff; border: 1px solid #d9d2c3; border-radius: 4px;
      padding: 20px 26px; min-width: 140px;
    }
    .stat-number {
      font-family: 'Archivo Expanded', sans-serif; font-size: 32px;
      color: #e8672b; font-weight: 700;
    }
    .stat-label { color: #4d5257; font-size: 13px; margin-top: 4px; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = true;
  newOrdersCount = 0;
  totalOrdersCount = 0;
  usersCount = 0;
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    forkJoin({
      orders: this.http.get<any[]>('/api/orders'),
      users: this.http.get<any[]>('/api/users'),
    }).subscribe({
      next: ({ orders, users }) => {
        this.totalOrdersCount = orders.length;
        this.newOrdersCount = orders.filter((o) => o.status === 'uj').length;
        this.usersCount = users.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}