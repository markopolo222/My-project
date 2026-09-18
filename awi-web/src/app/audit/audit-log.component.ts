import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface AuditEntry {
  id: number;
  username: string;
  action: string;
  details: string;
  createdAt: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  entries: AuditEntry[] = [];
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<AuditEntry[]>('/api/audit').subscribe({
      next: (entries) => {
        this.entries = entries;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nem sikerült betölteni a naplót (csak admin láthatja).';
        this.loading = false;
      },
    });
  }
}