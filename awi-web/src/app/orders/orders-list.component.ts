import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Order } from './order.model';
import { OrderService } from './order.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.scss',
})
export class OrdersListComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error: string | null = null;
  expandedId: string | null = null;
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  statusLabels: Record<Order['status'], string> = {
    uj: 'Új',
    folyamatban: 'Folyamatban',
    kesz: 'Kész',
    lemondva: 'Lemondva',
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadOrders();
    } else {
      this.loading = false;
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    if (!this.authService.isLoggedIn()) {
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.orderService.getAll().subscribe({
      next: (orders) => {
        console.log('Sikeresen betöltött rendelések:', orders);
        this.orders = Array.isArray(orders) ? orders : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API hiba a rendelések lekérésekor:', err);
        if (err.status === 401) {
          this.error = 'A munkamenet lejárt. Kérjük, jelentkezz be újra!';
          this.authService.logout();
        } else {
          this.error = 'Nem sikerült betölteni a rendeléseket.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleExpand(order: Order): void {
    this.expandedId = this.expandedId === order.id ? null : order.id;
  }

  changeStatus(order: Order, status: Order['status']): void {
    this.orderService.updateDetails(order.id, { status }).subscribe({
      next: (updated) => (order.status = updated.status),
      error: () => (this.error = 'A státusz módosítása nem sikerült.'),
    });
  }

  saveDetails(order: Order): void {
    this.orderService
      .updateDetails(order.id, { dueDate: order.dueDate, internalNote: order.internalNote })
      .subscribe({
        next: () => {},
        error: () => (this.error = 'A mentés nem sikerült.'),
      });
  }

  onAttachmentSelected(order: Order, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.orderService.uploadAttachment(order.id, file).subscribe({
      next: (result) => (order.attachmentUrl = result.attachmentUrl),
      error: () => (this.error = 'A fájl feltöltése nem sikerült.'),
    });
  }

  downloadQuotePdf(order: Order): void {
    this.orderService.downloadQuotePdf(order.id).subscribe({
      next: (blob) => {
        // Explicit PDF MIME típus hozzárendelése
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const fileUrl = URL.createObjectURL(pdfBlob);

        // Átmeneti letöltő hivatkozás készítése és kattintás szimulálása
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `arajanlat_${order.customerName.replace(/\s+/g, '_')}_${order.id}.pdf`;
        document.body.appendChild(a);
        a.click();

        // Erőforrások felszabadítása
        document.body.removeChild(a);
        URL.revokeObjectURL(fileUrl);
      },
      error: (err) => {
        console.error('PDF letöltési hiba:', err);
        this.error = 'A PDF letöltése nem sikerült.';
      },
    });
  }

  exportCsv(): void {
    this.orderService.downloadExportCsv().subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const fileUrl = URL.createObjectURL(blob);
        a.href = fileUrl;
        a.download = `rendelesek_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(fileUrl);
      },
      error: (err) => {
        console.error('CSV export hiba:', err);
        this.error = 'A CSV exportálás nem sikerült.';
      },
    });
  }

  confirmDelete(order: Order): void {
    const confirmed = window.confirm(`Biztosan törlöd: ${order.customerName} rendelését?`);
    if (!confirmed) return;

    this.orderService.delete(order.id).subscribe({
      next: () => (this.orders = this.orders.filter((o) => o.id !== order.id)),
      error: () => (this.error = 'A törlés nem sikerült, próbáld újra.'),
    });
  }
}