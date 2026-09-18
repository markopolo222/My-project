export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    createdAt: string;
}

export type NewUser = Omit<User, 'id' | 'createdAt'>;
