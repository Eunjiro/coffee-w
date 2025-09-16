'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Download, RefreshCw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import AdminLayout from '../components/AdminLayout';

type SaleItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type Sale = {
  id: string;
  orderId: string;
  customerName: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'cash' | 'gcash';
  status: 'completed' | 'refunded' | 'cancelled';
  timestamp: Date;
};

type TopSellingItem = {
  name: string;
  quantity: number;
  revenue: number;
};

type RevenueByHour = {
  hour: string;
  revenue: number;
  orders: number;
};

type RevenueByDay = {
  date: string;
  revenue: number;
  orders: number;
};

type PaymentMethodBreakdown = {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
};

type Analytics = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: TopSellingItem[];
  revenueByHour: RevenueByHour[];
  revenueByDay: RevenueByDay[];
  paymentMethodBreakdown: PaymentMethodBreakdown[];
};

const Sales: React.FC = () => {
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedStatus] = useState<'all' | 'completed' | 'refunded' | 'cancelled'>('completed');

  // Fetch sales data from the API based on selected filters
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const res = await fetch(`/api/admin/sales/orders?dateRange=${dateRange}&status=${selectedStatus}`);
        const data = await res.json();

        // Log the response data for debugging
        console.log('API Response:', data);

        // Check if data is an array
        if (Array.isArray(data)) {
          setSalesData(data);
        } else {
          console.error('Sales data is not an array:', data);
          setSalesData([]); // Handle the case where the data is not in an array
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        setSalesData([]); // Handle the case of a failed API call
      }
    };

    fetchSalesData();
  }, [dateRange, selectedStatus]);

  const generateAnalytics = (sales: Sale[]): Analytics => {
    if (!Array.isArray(sales)) {
      console.error('Expected sales to be an array, but received:', sales);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        revenueByHour: [],
        revenueByDay: [],
        paymentMethodBreakdown: [],
      };
    }

    const completedSales = sales.filter((sale) => sale.status === 'completed');
    const totalRevenue = completedSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
    const totalOrders = completedSales.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top selling items
    const itemCounts = new Map<string, TopSellingItem>();
    completedSales.forEach((sale) => {
      sale.items.forEach((item: SaleItem) => {
        const key = item.name;
        if (itemCounts.has(key)) {
          const existing = itemCounts.get(key)!;
          existing.quantity += item.quantity;
          existing.revenue += item.unitPrice * item.quantity;
        } else {
          itemCounts.set(key, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.unitPrice * item.quantity,
          });
        }
      });
    });
    const topSellingItems = Array.from(itemCounts.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Revenue by hour
    const revenueByHour: RevenueByHour[] = Array.from({ length: 24 }, (_, hour) => {
      const hourSales = completedSales.filter((sale) => sale.timestamp.getHours() === hour);
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        revenue: hourSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0),
        orders: hourSales.length,
      };
    });

    // Revenue by day (last 7 days)
    const revenueByDay: RevenueByDay[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const daySales = completedSales.filter((sale) =>
        sale.timestamp.toDateString() === date.toDateString()
      );
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: daySales.reduce((sum: number, sale: Sale) => sum + sale.total, 0),
        orders: daySales.length,
      };
    });

    // Payment method breakdown
    const paymentMethods: Array<'cash' | 'gcash'> = ['cash', 'gcash'];
    const paymentMethodBreakdown: PaymentMethodBreakdown[] = paymentMethods.map((method) => {
      const methodSales = completedSales.filter((sale) => sale.paymentMethod === method);
      const revenue = methodSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
      return {
        method: method.charAt(0).toUpperCase() + method.slice(1),
        count: methodSales.length,
        revenue,
        percentage: totalOrders > 0 ? (methodSales.length / totalOrders) * 100 : 0,
      };
    });

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topSellingItems,
      revenueByHour,
      revenueByDay,
      paymentMethodBreakdown,
    };
  };

  const analytics = useMemo(() => generateAnalytics(salesData), [salesData]);

  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  const formatNumber = (num: number) => num.toLocaleString();

  const actions = (
    <>
      <Button variant="secondary" icon={Download}>
        Export
      </Button>
      <Button icon={RefreshCw}>
        Refresh
      </Button>
    </>
  );

  return (
    <AdminLayout>
    <div className="bg-[#F3EEEA] p-8 h-full overflow-y-auto custom-scrollbar">
      <PageHeader title="Sales Analytics" description="View detailed sales reports and analytics" actions={actions} />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {['all', 'today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                dateRange === range ? 'bg-[#776B5D] text-[#F3EEEA]' : 'bg-white text-[#776B5D] hover:bg-[#B0A695]/20'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-[#776B5D]/70 text-sm">Total Sales</p>
              <p className="font-bold text-[#776B5D] text-2xl">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-[#776B5D]/70 text-sm">Total Orders</p>
              <p className="font-bold text-[#776B5D] text-2xl">{formatNumber(analytics.totalOrders)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-[#776B5D]/70 text-sm">Best Seller</p>
              <p className="font-bold text-[#776B5D] text-2xl">{analytics.topSellingItems[0]?.name || 'N/A'}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2 mb-8">
        <div className="bg-white shadow-sm p-6 rounded-xl">
          <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Revenue by Day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B0A695" />
                <XAxis dataKey="date" stroke="#776B5D" />
                <YAxis stroke="#776B5D" />
                <Tooltip contentStyle={{ backgroundColor: '#F3EEEA', border: '1px solid #B0A695', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#776B5D" fill="#776B5D" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm p-6 rounded-xl">
          <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Top Selling Items</h3>
          <div className="space-y-4">
            {analytics.topSellingItems.length === 0 ? (
              <div className="py-8 text-[#776B5D]/70 text-center">No sales data.</div>
            ) : (
              analytics.topSellingItems.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex justify-center items-center bg-[#776B5D] mr-3 rounded-full w-8 h-8 font-bold text-white text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#776B5D]">{item.name}</p>
                      <p className="text-[#776B5D]/70 text-sm">{item.quantity} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#776B5D]">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Section */}
      <div className="bg-white shadow-sm p-6 rounded-xl">
        <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-[#B0A695]/20 border-b">
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Order ID</th>
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Customer</th>
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Items</th>
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Total</th>
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Payment</th>
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Status</th>
                <th className="px-4 py-3 font-medium text-[#776B5D] text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {salesData
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10)
                .map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#F3EEEA]/50 border-[#B0A695]/10 border-b">
                    <td className="px-4 py-3 font-medium text-[#776B5D]">{sale.orderId}</td>
                    <td className="px-4 py-3 text-[#776B5D]">{sale.customerName}</td>
                    <td className="px-4 py-3 text-[#776B5D]">
                      <div className="flex flex-col">
                        {sale.items.slice(0, 2).map((item, index) => (
                          <span key={index} className="text-sm">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {sale.items.length > 2 && (
                          <span className="text-[#776B5D]/70 text-sm">
                            +{sale.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#776B5D]">{formatCurrency(sale.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {sale.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : sale.status === 'refunded'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#776B5D]/70 text-sm">
                      {format(sale.timestamp, 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default Sales;
