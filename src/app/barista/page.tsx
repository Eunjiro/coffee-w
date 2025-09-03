"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import BaristaLayout from "./components/BaristaLayout";

interface Addon {
  id: number;
  price: number;
  menu: { id: number; name: string };
}

interface OrderItem {
  id: number;
  quantity: number;
  menu: { id: number; name: string };
  orderitemaddons: Addon[];
}

interface Order {
  id: number;
  total: number;
  createdAt: string;
  orderitems: OrderItem[];
}

export default function BaristaPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(true); // only for first load

  // Fetch pending orders
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/pending");
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const newOrders = data.orders.filter((o: Order) => !existingIds.has(o.id));
          return [...prev, ...newOrders];
        });
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setInitialLoading(false); // only hide loading after first fetch
    }
  };

  // Mark order as completed
  const markCompleted = async (orderId: number) => {
    try {
      const res = await fetch("/api/orders/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error("Failed to mark order completed:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") return <p>Loading session...</p>;
  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }
  if (session.user.role !== "BARISTA") {
    if (typeof window !== "undefined") window.location.href = "/unauthorized";
    return null;
  }
  if (initialLoading) return <div className="p-4">Loading orders...</div>;

  return (
    <BaristaLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Pending Orders</h1>

        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <span>Order #{order.id}</span>
              <span className="font-semibold">Total: ₱{order.total}</span>
            </div>
            <div className="mb-2">
              {order.orderitems.map((item) => (
                <div key={item.id} className="ml-2 mb-1">
                  <p>
                    {item.quantity}x {item.menu.name}
                  </p>
                  {item.orderitemaddons.length > 0 && (
                    <ul className="ml-4 list-disc text-sm text-gray-600">
                      {item.orderitemaddons.map((addon) => (
                        <li key={addon.id}>
                          + {addon.menu.name} (₱{addon.price})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => markCompleted(order.id)}
              className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
            >
              Mark Completed
            </button>
          </div>
        ))}
      </div>
    </BaristaLayout>
  );
}
