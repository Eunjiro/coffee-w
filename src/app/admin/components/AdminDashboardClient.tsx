"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Star,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  RefreshCw
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";

// --------------------
// Types
// --------------------
interface TopSeller {
  name: string;
  sold: number;
  revenue?: number;
}

interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  threshold: number;
  unit: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  addons?: string[];
}

interface RecentOrder {
  id: number;
  createdAt: string;
  status: "completed" | "refunded" | "cancelled" | string;
  items: OrderItem[];
  paymentMethod: string;
  total: number;
}

interface SalesOverview {
  date: string;
  total: number;
}

interface DashboardData {
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
  salesOverview: SalesOverview[];
}

// --------------------
// Utils
// --------------------
const fetcher = (url: string): Promise<DashboardData> =>
  fetch(url).then((res) => res.json());

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// --------------------
// Component
// --------------------
export default function AdminDashboardClient() {
  const { data, isLoading } = useSWR<DashboardData>(
    "/api/admin/dashboard?filter=today",
    fetcher
  );
  const router = useRouter();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 md:p-6 shadow-md animate-pulse"
              >
                <div className="h-6 w-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-32 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const totalRevenueToday = data?.sales?.today || 0;
  const totalRevenueWeek = data?.sales?.week || 0;
  const totalRevenueMonth = data?.sales?.month || 0;
  const yesterdayRevenue = data?.sales?.yesterday || 0;

  const totalOrdersToday = data?.orders?.today || 0;
  const totalOrdersWeek = data?.orders?.week || 0;
  const totalOrdersMonth = data?.orders?.month || 0;

  const topSellers: TopSeller[] = data?.bestSellers?.today || [];
  const lowStockItems: LowStockItem[] = data?.lowStock?.today || [];
  const recentOrders: RecentOrder[] = data?.recentOrders || [];
  const salesOverview: SalesOverview[] = data?.salesOverview || [];

  const revenueChange = yesterdayRevenue
    ? ((totalRevenueToday - yesterdayRevenue) / yesterdayRevenue) * 100
    : 0;
  const revenueChangeClass =
    revenueChange >= 0 ? "text-green-600" : "text-red-600";
  const revenueChangeSign = revenueChange >= 0 ? "+" : "";

  const actions = <Button icon={RefreshCw}>Refresh</Button>;

  return (
    <AdminLayout>
      <div className="bg-[#F3EEEA] p-8 h-full overflow-y-auto custom-scrollbar">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          description="Here's what's happening with your business today."
          actions={actions}
        />

        {/* Key Metrics Cards */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Sales */}
          <div className="bg-white shadow-sm p-6 pb-0 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="mb-1 font-medium text-[#776B5D]/70 text-sm">
                  Total Sales
                </p>
                <p className="font-bold text-[#776B5D] text-3xl">
                  {formatCurrency(totalRevenueToday)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <TrendingUp className={`mr-1 w-4 h-4 ${revenueChangeClass}`} />
                <span className={`font-medium ${revenueChangeClass}`}>
                  {revenueChangeSign}
                  {revenueChange.toFixed(1)}% from yesterday
                </span>
              </div>
              <div className="text-[#776B5D]/70 text-sm">
                This week {formatCurrency(totalRevenueWeek)}
              </div>
              <div className="text-[#776B5D]/70 text-sm">
                This month {formatCurrency(totalRevenueMonth)}
              </div>
              <button
                onClick={() => router.push("/admin/sales")}
                className="font-medium text-[#776B5D] hover:text-[#776B5D]/80 text-sm"
              >
                View all sales
              </button>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="mb-1 font-medium text-[#776B5D]/70 text-sm">
                  Total Orders
                </p>
                <p className="font-bold text-[#776B5D] text-3xl">
                  {totalOrdersToday}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[#776B5D]/70 text-sm">
                This week {totalOrdersWeek}
              </div>
              <div className="text-[#776B5D]/70 text-sm">
                This month {totalOrdersMonth}
              </div>
              <button
                onClick={() => router.push("/admin/orders")}
                className="font-medium text-[#776B5D] hover:text-[#776B5D]/80 text-sm"
              >
                View all orders
              </button>
            </div>
          </div>

          {/* Best Seller */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="mb-1 font-medium text-[#776B5D]/70 text-sm">
                  Best Seller
                </p>
                <p className="flex items-center font-bold text-[#776B5D] text-2xl">
                  <Star className="mr-2 w-5 h-5 text-yellow-500" />
                  {topSellers[0]?.name || "-"}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="space-y-2">
              {topSellers.slice(1, 3).map((item, index) => (
                <div key={item.name} className="text-[#776B5D]/70 text-sm">
                  {index + 2}. {item.name} ({item.sold})
                </div>
              ))}
              <button
                onClick={() => router.push("/admin/sales")}
                className="font-medium text-[#776B5D] hover:text-[#776B5D]/80 text-sm"
              >
                View all sales
              </button>
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="mb-1 font-medium text-[#776B5D]/70 text-sm">
                  Low Stock Items
                </p>
                <p className="font-bold text-[#776B5D] text-3xl">
                  {lowStockItems.length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="space-y-2">
              {lowStockItems.length === 0 ? (
                <div className="py-4 text-center">
                  <CheckCircle className="mx-auto mb-2 w-12 h-12 text-green-500" />
                  <p className="text-[#776B5D]/70">
                    All items are well stocked!
                  </p>
                </div>
              ) : (
                lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-[#776B5D]/70 text-sm">
                    {item.name} {item.stock}/{item.threshold * 2} {item.unit}
                  </div>
                ))
              )}
              <button
                onClick={() => router.push("/admin/inventory")}
                className="font-medium text-[#776B5D] hover:text-[#776B5D]/80 text-sm"
              >
                View all Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="gap-6 grid grid-cols-1 lg:grid-cols-2 mb-8">
          {/* Weekly Sales Trend */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <h3 className="font-semibold text-[#776B5D] text-lg mb-4">
              Weekly Sales Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesOverview}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B0A695" />
                  <XAxis dataKey="date" stroke="#776B5D" />
                  <YAxis
                    stroke="#776B5D"
                    tickFormatter={(val) => `₱${val}`}
                  />
                  <Tooltip
                    formatter={(val) =>
                      formatCurrency(Array.isArray(val) ? val[0] : val)
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#776B5D"
                    fill="#776B5D"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">
              Top Selling Items Today
            </h3>
            <div className="space-y-4">
              {topSellers.length === 0 ? (
                <div className="py-8 text-[#776B5D]/70 text-center">
                  No sales data for today.
                </div>
              ) : (
                topSellers.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <div className="flex justify-center items-center bg-[#776B5D] mr-3 rounded-full w-8 h-8 font-bold text-white text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#776B5D]">{item.name}</p>
                        <p className="text-[#776B5D]/70 text-sm">
                          {item.sold} sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#776B5D]">
                        {formatCurrency(item.revenue ?? 0)}
                      </p>
                      <p className="text-[#776B5D]/70 text-sm">revenue</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow-sm mb-8 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#776B5D] text-lg">
              Recent Orders
            </h3>
            <button
              onClick={() => router.push("/admin/orders")}
              className="font-medium text-[#776B5D] hover:text-[#776B5D]/80 text-sm"
            >
              View All
            </button>
          </div>
          <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#F3EEEA] p-4 border border-[#B0A695]/20 hover:border-[#776B5D]/30 rounded-lg transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-[#776B5D] text-sm">
                      Order #{order.id}
                    </p>
                    <p className="text-[#776B5D]/70 text-xs">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : order.status === "refunded"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {order.status
                      ? order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)
                      : "-"}
                  </span>
                </div>
                <div className="space-y-2 mb-3">
                  {order.items?.slice(0, 2).map((item, i) => (
                    <div key={i} className="text-[#776B5D]/70 text-xs">
                      {item.quantity}x {item.name}
                      {item.addons && item.addons.length > 0 && (
                        <span className="text-[#776B5D]/50">
                          {" "}
                          +{item.addons.length} add-ons
                        </span>
                      )}
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <div className="text-[#776B5D]/70 text-xs">
                      +{order.items.length - 2} more items
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm text-[#776B5D]/70">
                  <span>{order.paymentMethod || "-"}</span>
                  <span className="font-semibold text-[#776B5D]">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
