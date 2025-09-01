"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSession } from "next-auth/react";

interface OrderItemAddon {
  id: number;
  addonId: number;
  price: number;
  menu: { name: string };
}

interface OrderItem {
  id: number;
  menuId: number;
  menu: { name: string };
  size?: { label: string };
  quantity: number;
  orderitemaddons: OrderItemAddon[];
}

interface Order {
  id: number;
  userId: number;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED" | "VOID";
  paymentMethod?: "CASH" | "CARD" | "GCASH" | "OTHER";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  orderitems: OrderItem[];
  users: { name: string; email: string };
}

type TimeRange = "DAILY" | "WEEKLY" | "MONTHLY";

export default function SalesPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("DAILY");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.users.name.toLowerCase().includes(search.toLowerCase()) ||
      order.users.email.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toString() === search;
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id: number) => {
    setExpandedOrders((prev) =>
      prev.includes(id) ? prev.filter((oid) => oid !== id) : [...prev, id]
    );
  };

  // --- Sales Analytics ---
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;

  const salesByStatus = ["PAID", "PENDING", "CANCELLED", "VOID"].map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  // --- Sales Over Time Grouping ---
  const groupKey = (date: Date): string => {
    if (timeRange === "DAILY") {
      return date.toLocaleDateString();
    }
    if (timeRange === "WEEKLY") {
      const firstDay = new Date(date);
      firstDay.setDate(date.getDate() - date.getDay());
      return `Week of ${firstDay.toLocaleDateString()}`;
    }
    if (timeRange === "MONTHLY") {
      return `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
    }
    return date.toLocaleDateString();
  };

  const salesOverTime = orders.reduce((acc: Record<string, number>, order) => {
    const date = new Date(order.createdAt);
    const key = groupKey(date);
    acc[key] = (acc[key] || 0) + order.total;
    return acc;
  }, {});

  const salesOverTimeData = Object.entries(salesOverTime).map(([date, total]) => ({
    date,
    total,
  }));

  // --- Top Selling Menu Items ---
  const menuSales: Record<string, number> = {};
  orders.forEach((order) =>
    order.orderitems.forEach((item) => {
      menuSales[item.menu.name] = (menuSales[item.menu.name] || 0) + item.quantity;
    })
  );
  const topMenuData = Object.entries(menuSales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // --- Payment Methods Pie ---
  const paymentCounts: Record<string, number> = {};
  orders.forEach((order) => {
    if (order.paymentMethod) {
      paymentCounts[order.paymentMethod] = (paymentCounts[order.paymentMethod] || 0) + 1;
    }
  });
  const paymentData = Object.entries(paymentCounts).map(([method, count]) => ({
    name: method,
    value: count,
  }));
  const COLORS = ["#3182ce", "#38a169", "#f6ad55", "#e53e3e"];

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (!session) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  if (session.user.role !== "ADMIN") {
    if (typeof window !== "undefined") {
      window.location.href = "/unauthorized";
    }
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Sales Management</h1>

        {/* --- Sales Preview Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-100 rounded-md text-center">
            <p className="text-gray-700">Total Sales</p>
            <p className="text-2xl font-bold text-blue-700">
              ₱{totalSales.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-green-100 rounded-md text-center">
            <p className="text-gray-700">Total Orders</p>
            <p className="text-2xl font-bold text-green-700">{totalOrders}</p>
          </div>
          <div className="p-4 bg-yellow-100 rounded-md text-center">
            <p className="text-gray-700">Orders by Status</p>
            {salesByStatus.map((s) => (
              <p key={s.status} className="text-yellow-700">
                {s.status}: {s.count}
              </p>
            ))}
          </div>
        </div>

        {/* --- Graphs --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-gray-300 rounded-md bg-white">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Sales Over Time</h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="border rounded-md px-2 py-1 text-sm"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3182ce" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 border border-gray-300 rounded-md bg-white">
            <h2 className="font-semibold mb-2">Top Selling Menu Items</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topMenuData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#38a169" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 border border-gray-300 rounded-md bg-white md:col-span-2">
            <h2 className="font-semibold mb-2">Payment Methods Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Orders Table --- */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by customer name, email, or order ID..."
            className="border border-gray-300 rounded-md px-3 py-1 w-full sm:max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded-md px-3 py-1 w-full sm:max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="VOID">Void</option>
          </select>
        </div>

        <div className="overflow-x-auto max-h-[600px] border border-gray-300 rounded-md">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="p-2 border-b text-left">Order ID</th>
                <th className="p-2 border-b text-left">Customer</th>
                <th className="p-2 border-b text-left">Status</th>
                <th className="p-2 border-b text-left">Payment</th>
                <th className="p-2 border-b text-left">Total</th>
                <th className="p-2 border-b text-left">Date</th>
                <th className="p-2 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer">
                    <td className="p-2 border-b">{order.id}</td>
                    <td className="p-2 border-b">{order.users.name}</td>
                    <td className="p-2 border-b">{order.status}</td>
                    <td className="p-2 border-b">{order.paymentMethod || "-"}</td>
                    <td className="p-2 border-b">₱{order.total.toFixed(2)}</td>
                    <td className="p-2 border-b">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 border-b">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => toggleExpand(order.id)}
                      >
                        {expandedOrders.includes(order.id) ? "Collapse" : "Expand"}
                      </button>
                    </td>
                  </tr>

                  {expandedOrders.includes(order.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="p-2 border-b">
                        <div className="pl-4">
                          <h3 className="font-semibold mb-2">Order Items</h3>
                          <table className="w-full border-collapse">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="p-1 border">Menu Item</th>
                                <th className="p-1 border">Size</th>
                                <th className="p-1 border">Qty</th>
                                <th className="p-1 border">Addons</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.orderitems.map((item) => (
                                <tr key={item.id}>
                                  <td className="p-1 border">{item.menu.name}</td>
                                  <td className="p-1 border">{item.size?.label || "-"}</td>
                                  <td className="p-1 border">{item.quantity}</td>
                                  <td className="p-1 border">
                                    {item.orderitemaddons.length > 0
                                      ? item.orderitemaddons
                                        .map((a) => `${a.menu.name} (₱${a.price})`)
                                        .join(", ")
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-2 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
