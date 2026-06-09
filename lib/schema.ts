import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    stockItems: i.entity({
      brand: i.string(),
      buyPrice: i.number(),
      sellPrice: i.number(),
      qty: i.number(),
      dateAdded: i.string(),
      supplier: i.string(),
      lowStockThreshold: i.number(),
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
      stockItemId: i.string(),
    }),
    returns: i.entity({
      brand: i.string(),
      color: i.string(),
      size: i.string(),
      qty: i.number(),
      reason: i.string(),
      date: i.string(),
      saleId: i.string(),
      stockItemId: i.string(),
    }),
    users: i.entity({
      name: i.string(),
      pin: i.string(),
      role: i.string(),
      canSell: i.boolean(),
      canViewStock: i.boolean(),
      canViewDebts: i.boolean(),
      canViewSales: i.boolean(),
      canViewExpenses: i.boolean(),
    }),
    expenses: i.entity({
      amount: i.number(),
      category: i.string(),
      description: i.string(),
      date: i.string(),
    }),
    settings: i.entity({
      key: i.string(),
      value: i.string(),
    }),
  },
  links: {
    salesStockItem: {
      forward: { on: 'sales', has: 'one', label: 'stockItem' },
      reverse: { on: 'stockItems', has: 'many', label: 'sales' },
    },
  },
});

type _AppSchema = typeof _schema;
type AppSchema = _AppSchema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

export type PaymentMethod = 'Cash' | 'Bank' | 'Phone (MoMo)';
export type UserRole = 'employer' | 'employee';
export type ExpenseCategory = 'Rent' | 'Stock Purchase' | 'Utilities' | 'Salary' | 'Other';

export const DAILY_TARGET_SETTING_ID = 'mpenzi-daily-target';

export interface AppUser {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  canSell: boolean;
  canViewStock: boolean;
  canViewDebts: boolean;
  canViewSales: boolean;
  canViewExpenses: boolean;
}

export interface StockItem {
  id: string;
  /** Display name of the shoe type (e.g. "Nike Air sneakers"). Stored as `brand` for backwards compatibility. */
  brand: string;
  buyPrice: number;
  sellPrice: number;
  qty: number;
  dateAdded?: string;
  supplier?: string;
  lowStockThreshold?: number;
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

export interface ReturnRecord {
  id: string;
  brand?: string;
  color?: string;
  size?: string;
  qty?: number;
  reason?: string;
  date?: string;
  saleId?: string;
  stockItemId?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
}
