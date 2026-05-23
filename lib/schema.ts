import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    stockItems: i.entity({
      brand: i.string(),
      color: i.string(),
      size: i.string(),
      buyPrice: i.number(),
      sellPrice: i.number(),
      qty: i.number(),
      dateAdded: i.string(),
    }),
    sales: i.entity({
      brand: i.string(),
      color: i.string(),
      size: i.string(),
      sellPrice: i.number(),
      buyPrice: i.number(),
      qty: i.number(),
      totalAmount: i.number(),
      amountPaid: i.number(),
      isPaid: i.boolean(),
      customerName: i.string(),
      paymentMethod: i.string(),
      date: i.string(),
      note: i.string(),
    }),
  },
  links: {
    salesStockItem: {
      forward: { on: 'sales', has: 'one', label: 'stockItem' },
      reverse: { on: 'stockItems', has: 'many', label: 'sales' },
    },
  },
});

// Extends the inferred type for better TypeScript intellisense
type _AppSchema = typeof _schema;
type AppSchema = _AppSchema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

export type PaymentMethod = 'Cash' | 'Bank' | 'Phone (MoMo)';

export interface StockItem {
  id: string;
  brand: string;
  color?: string;
  size?: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  dateAdded?: string;
}

export interface Sale {
  id: string;
  brand?: string;
  color?: string;
  size?: string;
  sellPrice?: number;
  buyPrice?: number;
  qty?: number;
  totalAmount?: number;
  amountPaid?: number;
  isPaid?: boolean;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  date?: string;
  stockItemId?: string;
  note?: string;
}
