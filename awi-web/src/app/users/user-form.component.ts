import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';

export type UserRole = 'admin' | 'editor' | 'viewer';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  isEditMode = false;
  userId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  form: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  } = {
    name: '',
    email: '',
    role: 'viewer',
    password: '',
  };

  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.isEditMode = true;
      this.loadUser(this.userId);
    }
  }

  loadUser(id: string): void {
    this.loading = true;
    this.error = null;

    this.userService.getById(id).subscribe({
      next: (user) => {
        this.form = {
          name: user.name || '',
          email: user.email || '',
          role: (user.role as UserRole) || 'viewer',
          password: '',
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Hiba a felhasználó betöltésekor:', err);
        this.error = 'Nem sikerült betölteni a felhasználó adatait.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSubmit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.saving = true;
    this.error = null;

    const request$ = this.isEditMode && this.userId
      ? this.userService.update(this.userId, this.form)
      : this.userService.create(this.form);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        console.error('Hiba a mentés során:', err);
        this.error = 'A mentés nem sikerült. Ellenőrizd a megadott adatokat!';
        this.saving = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }
}