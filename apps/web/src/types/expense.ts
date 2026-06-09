export interface Expense {
  id: string;
  userId: string;
  item: string;
  category: string;
  amount: number;
  quantity: number;
  unit: string;
  pricePerKg: number;
  purchasedAt: string;
}
