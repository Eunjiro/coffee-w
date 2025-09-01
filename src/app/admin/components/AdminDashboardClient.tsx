"use client";

import useSWR from "swr";
import StatCard from "./StatCard";
import { PhilippinePeso, ShoppingCart, Star, AlertTriangle } from "lucide-react";
import AdminLayout from "./AdminLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Helper to format numbers as currency
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AdminDashboardClient() {
  const { data, isLoading } = useSWR("/api/admin/dashboard?filter=today", fetcher);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-4 md:p-6 shadow-md animate-pulse"
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

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Total Sales"
            icon={<PhilippinePeso size={20} className="text-[#776B5D]" />}
            valueToday={formatCurrency(data?.sales?.today || 0)}
            valueWeek={formatCurrency(data?.sales?.week || 0)}
            valueMonth={formatCurrency(data?.sales?.month || 0)}
            changePercent={data?.sales?.changePercent}
            iconBg="bg-[#EBE3D5]"
          />
          <StatCard
            title="Total Orders"
            icon={<ShoppingCart size={20} className="text-[#776B5D]" />}
            valueToday={data?.orders?.today || 0}
            valueWeek={data?.orders?.week || 0}
            valueMonth={data?.orders?.month || 0}
            iconBg="bg-[#EBE3D5]"
          />
          <StatCard
            title="Best Sellers"
            icon={<Star size={20} className="text-[#776B5D]" />}
            valueToday={data?.bestSellers?.today[0]?.name || "-"}
            valueWeek={data?.bestSellers?.week[0]?.name || "-"}
            valueMonth={data?.bestSellers?.month[0]?.name || "-"}
            iconBg="bg-[#EBE3D5]"
          />
          <StatCard
            title="Low Stock Items"
            icon={<AlertTriangle size={20} className="text-[#776B5D]" />}
            valueToday={data?.lowStock?.today?.length || 0}
            valueWeek={data?.lowStock?.week?.length || 0}
            valueMonth={data?.lowStock?.month?.length || 0}
            iconBg="bg-[#EBE3D5]"
          />
        </div>

        {/* Charts + Recent Orders */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.salesOverview || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter={(value) =>
                      `₱${Number(value).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label: string) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#776B5D"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 md:p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
            <ul className="divide-y divide-gray-200">
              {data?.recentOrders?.map((order: any) => (
                <li key={order.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-[#776B5D]">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {order.user?.name || "Guest"} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="font-semibold text-[#776B5D]">{formatCurrency(order.total)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
