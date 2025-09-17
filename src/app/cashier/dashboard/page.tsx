"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CashierLayout from "../components/CashierLayout";
import { 
  DollarSign, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users,
  RefreshCw,
  Eye,
  Calendar
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/app/admin/components/ui/Button";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  todayRevenue: number;
  todayOrders: number;
}

interface RecentOrder {
  id: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface TopSellingItem {
  name: string;
  sold: number;
  revenue: number;
}

export default function CashierDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    todayRevenue: 0,
    todayOrders: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topSellingItems, setTopSellingItems] = useState<TopSellingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session & role check
  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "CASHIER") {
      window.location.href = "/unauthorized";
    } else if (status === "unauthenticated") {
      window.location.href = "/";
    }
  }, [status, session]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stats
        const statsRes = await fetch("/api/cashier/dashboard");
        const statsData = await statsRes.json();
        
        if (statsRes.ok) {
          setStats(statsData);
        } else {
          setError(statsData.error || "Failed to fetch dashboard data");
        }

        // Fetch recent orders
        const ordersRes = await fetch("/api/orders");
        const ordersData = await ordersRes.json();
        
        if (ordersRes.ok && ordersData.success) {
          const recent = ordersData.orders
            .slice(0, 5)
            .map((order: any) => ({
              id: order.id,
              total: Number(order.total),
              status: order.status,
              paymentMethod: order.paymentMethod || "CASH",
              createdAt: order.createdAt,
              customerName: order.users?.name || "Unknown",
              items: order.orderitems?.map((item: any) => ({
                name: item.menu?.name || "Unknown Item",
                quantity: item.quantity,
              })) || [],
            }));
          setRecentOrders(recent);
        }

        // Fetch top selling items
        const topSellingRes = await fetch("/api/admin/dashboard?filter=today");
        const topSellingData = await topSellingRes.json();
        
        if (topSellingRes.ok && topSellingData.bestSellers?.today) {
          setTopSellingItems(topSellingData.bestSellers.today);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatNumber = (num: number) => num.toLocaleString();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "paid":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "bg-green-100 text-green-700";
      case "card":
        return "bg-purple-100 text-purple-700";
      case "gcash":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleViewOrders = () => {
    router.push("/cashier/orders");
  };

  const handleViewPOS = () => {
    router.push("/cashier/pos");
  };

  if (status === "loading" || loading) {
    return (
      <CashierLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-[#776B5D]" />
              <p className="text-[#776B5D]">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </CashierLayout>
    );
  }

  if (error) {
    return (
      <CashierLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-red-100 p-4 rounded-full">
                <RefreshCw className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">Error loading dashboard</p>
              <p className="text-[#776B5D]/70 text-sm text-center max-w-md">{error}</p>
              <Button onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="p-6 space-y-6">
        <PageHeader 
          title="Cashier Dashboard" 
          description="Overview of your sales and transactions"
          actions={
            <Button icon={RefreshCw} onClick={handleRefresh}>
              Refresh
            </Button>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Today's Revenue</p>
                <p className="font-bold text-[#776B5D] text-2xl">{formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Today's Orders</p>
                <p className="font-bold text-[#776B5D] text-2xl">{formatNumber(stats.todayOrders)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Completed Orders</p>
                <p className="font-bold text-[#776B5D] text-2xl">{formatNumber(stats.completedOrders)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[#776B5D]/70 text-sm">Average Order Value</p>
                <p className="font-bold text-[#776B5D] text-2xl">{formatCurrency(stats.averageOrderValue)}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleViewPOS} className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Open POS
          </Button>
          <Button variant="secondary" onClick={handleViewOrders} className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Orders
          </Button>
        </div>

        {/* Recent Orders and Top Selling Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#776B5D] text-lg">Recent Orders</h3>
              <Button variant="ghost" size="sm" onClick={handleViewOrders}>
                View All
              </Button>
            </div>
            <div className="space-y-3">
              <div className="mb-3">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search recent orders (id, name, payment)"
                  className="w-full px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D]"
                />
              </div>
              {recentOrders.filter(o => {
                if (!searchTerm.trim()) return true;
                const q = searchTerm.toLowerCase();
                return (
                  String(o.id).includes(q) ||
                  (o.customerName || '').toLowerCase().includes(q) ||
                  (o.paymentMethod || '').toLowerCase().includes(q)
                );
              }).length === 0 ? (
                <div className="py-8 text-[#776B5D]/70 text-center">
                  No recent orders found.
                </div>
              ) : (
                recentOrders.filter(o => {
                  if (!searchTerm.trim()) return true;
                  const q = searchTerm.toLowerCase();
                  return (
                    String(o.id).includes(q) ||
                    (o.customerName || '').toLowerCase().includes(q) ||
                    (o.paymentMethod || '').toLowerCase().includes(q)
                  );
                }).map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-[#F3EEEA]/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#776B5D]">#{order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#776B5D]/70">{order.customerName}</p>
                      <p className="text-xs text-[#776B5D]/50">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#776B5D]">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-[#776B5D]/50">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white shadow-sm p-6 rounded-xl">
            <h3 className="font-semibold text-[#776B5D] text-lg mb-4">Top Selling Items Today</h3>
            <div className="space-y-3">
              {topSellingItems.length === 0 ? (
                <div className="py-8 text-[#776B5D]/70 text-center">
                  No sales data available.
                </div>
              ) : (
                topSellingItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex justify-center items-center bg-[#776B5D] mr-3 rounded-full w-8 h-8 font-bold text-white text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-[#776B5D]">{item.name}</p>
                        <p className="text-[#776B5D]/70 text-sm">{item.sold} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#776B5D]">{formatCurrency(item.revenue || 0)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
}
