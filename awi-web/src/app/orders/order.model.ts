export interface Order {
    id: string;
    customerName: string;
    phone: string;
    email: string;
    description: string;
    status: 'uj' | 'folyamatban' | 'kesz' | 'lemondva';
    dueDate: string;
    internalNote: string;
    attachmentUrl: string;
    createdAt: string;
}

export type NewOrder = Omit<Order, 'id' | 'createdAt' >;