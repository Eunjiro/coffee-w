export interface TopSeller {
  name: string;
  sold: number;
  revenue?: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  threshold: number;
  unit: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  addons?: string[];
}

export interface RecentOrder {
  id: number;
  createdAt: string;
  status: "completed" | "refunded" | "cancelled" | string;
  items: OrderItem[];
  paymentMethod: string;
  total: number;
}

export interface DashboardData {
  sales: {
    today: number;
    week: number;
    month: number;
    yesterday: number;
  };
  orders: {
    today: number;
    week: number;
    month: number;
  };
  bestSellers: {
    today: TopSeller[];
  };
  lowStock: {
    today: LowStockItem[];
  };
  recentOrders: RecentOrder[];
  salesOverview: { date: string; total: number }[];
}
