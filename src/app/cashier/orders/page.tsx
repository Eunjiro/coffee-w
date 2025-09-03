"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
    status: string;
    createdAt: string;
    orderitems: OrderItem[];
    users: { name: string };
}

export default function CashierOrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/sales/orders");
            const data = await res.json();
            if (!data.error) setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const markPaid = async (orderId: number) => {
        try {
            const res = await fetch("/api/orders/pay", {
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
            console.error(err);
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
    if (session.user.role !== "CASHIER") {
        if (typeof window !== "undefined") window.location.href = "/unauthorized";
        return null;
    }

    if (loading) return <p>Loading orders...</p>;
    if (orders.length === 0) return <p>No pending orders.</p>;

    return (
        
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Orders</h1>
            {orders.map((order) => (
                <div key={order.id} className="border p-4 rounded shadow">
                    <div className="flex justify-between items-center mb-2">
                        <span>Order #{order.id} ({order.status})</span>
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
                    {order.status !== "PAID" && (
                        <button
                            onClick={() => markPaid(order.id)}
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                        >
                            Mark as Paid
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
