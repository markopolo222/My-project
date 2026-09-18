import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { User } from './user.model';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  error: string | null = null;

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a felhasználókat.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  confirmDelete(user: User): void {
    if (!this.isAdmin) return;

    const confirmed = window.confirm(`Biztosan törlöd: ${user.name}?`);
    if (!confirmed) return;

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'A törlés nem sikerült, próbáld újra. Csak admin törölhet felhasználót.';
        this.cdr.detectChanges();
      },
    });
  }

  // Szerződés PDF letöltése
  downloadContract(user: User): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.userService.downloadContract(user.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `szerzodes_${user.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Hiba a PDF letöltésekor:', err);
        alert('Nem sikerült letölteni a szerződést.');
      },
    });
  }
}