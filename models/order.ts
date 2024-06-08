// models/order.ts
  export interface Order {
    id: string; // Unique identifier for the order
    name: string;
    member: string;
    source: string;
    owner: string;
    date: string; // ISO string format for simplicity
    state: 'new' | 'processing' | 'completed' | 'cancelled';
    paid: boolean;
  }
  