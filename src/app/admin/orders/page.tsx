"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "../../admin/components/ui/ConfirmDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    TableContainer,
} from "../../admin/components/ui/Table";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Eye,
    ArrowLeft,
    Printer,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import AdminLayout from "../components/AdminLayout";

const showConfirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) => {
        if (window.confirm(message)) resolve(true);
        else resolve(false);
    });

const showSuccess = (title: string, message: string) => {
    toast.success(`${title}: ${message}`);
};

const showError = (title: string, message: string) => {
    toast.error(`${title}: ${message}`);
};

const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;

interface Order {
    id: number;
    userId: number;
    total: number;
    status: "PENDING" | "PAID" | "COMPLETED" | "CANCELLED" | "VOID";
    paymentMethod?: "CASH" | "CARD" | "GCASH" | "OTHER";
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
    orderitems: {
        id: number;
        menuId: number;
        menu: { name: string };
        sizes?: { label: string; price?: number };
        quantity: number;
        orderitemaddons: {
            id: number;
            addonId: number;
            price: number;
            menu: { name: string };
        }[];
    }[];
    users: { name: string; email: string };
}

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [statusFilter, setStatusFilter] = useState<
        "PENDING" | "COMPLETED" | "CANCELLED"
    >("PENDING");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => { } });
    const router = useRouter();

    // ✅ Fetch Orders
    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            if (data.success) setOrders(data.orders);
        } catch {
            toast.error("Failed to fetch orders");
        }
    };

    // ✅ Order Actions
    const handlePayOrder = async (orderId: number) => {
        const run = async () => {
            try {
                const res = await fetch("/api/orders/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.success) {
                    setOrders((prev) =>
                        prev.map((o) => (o.id === orderId ? { ...o, status: "PAID" } : o))
                    );
                    showSuccess("Order paid", "The order has been marked as paid.");
                } else showError("Failed to mark order as paid", data.error || "");
            } catch {
                showError("Something went wrong", "Failed to mark order as paid");
            }
        };
        setConfirmState({ open: true, title: "Mark as Paid", message: "Are you sure you want to mark this order as paid?", onConfirm: () => { setConfirmState(s => ({ ...s, open: false })); run(); } });
    };

    const handleCompleteOrder = async (orderId: number) => {
        const run = async () => {
            try {
                const res = await fetch("/api/orders/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.success) {
                    setOrders((prev) =>
                        prev.map((o) =>
                            o.id === orderId ? { ...o, status: "COMPLETED" } : o
                        )
                    );
                    showSuccess("Order completed", "The order has been marked as completed.");
                } else showError("Failed to complete the order", data.error || "");
            } catch {
                showError("Something went wrong", "Failed to complete the order");
            }
        };
        setConfirmState({ open: true, title: "Complete Order", message: "Are you sure you want to mark this order as completed?", onConfirm: () => { setConfirmState(s => ({ ...s, open: false })); run(); } });
    };

    const handleCancelOrder = async (orderId: number) => {
        const run = async () => {
            try {
                const res = await fetch("/api/orders/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.success) {
                    setOrders((prev) =>
                        prev.map((o) =>
                            o.id === orderId ? { ...o, status: "CANCELLED" } : o
                        )
                    );
                    showSuccess("Order canceled", "The order has been canceled.");
                } else showError("Failed to cancel the order", data.error || "");
            } catch {
                showError("Something went wrong", "Failed to cancel the order");
            }
        };
        setConfirmState({ open: true, title: "Cancel Order", message: "Are you sure you want to cancel this order?", onConfirm: () => { setConfirmState(s => ({ ...s, open: false })); run(); } });
    };

    // ✅ Filter Orders
    const filteredOrders = useMemo(() => {
        const pool = statusFilter === "PENDING"
            ? orders.filter(o => o.status === "PENDING" || o.status === "PAID")
            : orders.filter(o => o.status === statusFilter);
        if (!searchTerm.trim()) return pool;
        const q = searchTerm.trim().toLowerCase();
        return pool.filter(o => {
            const idMatch = String(o.id).includes(q);
            const nameMatch = (o.users?.name || "").toLowerCase().includes(q);
            const payMatch = (o.paymentMethod || "").toLowerCase().includes(q);
            const itemsMatch = o.orderitems.some(i => (i.menu?.name || "").toLowerCase().includes(q));
            return idMatch || nameMatch || payMatch || itemsMatch;
        });
    }, [orders, statusFilter, searchTerm]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    if (status === "loading") return <p>Loading session...</p>;
    if (!session || session.user.role !== "ADMIN") {
        router.push("/unauthorized");
        return null;
    }

    // ✅ Detail View
    if (selectedOrder) {
        const order = selectedOrder;
        return (
            <AdminLayout>
                <div className="bg-[#F3EEEA] p-8 h-full overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedOrder(null)}
                                className="flex gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                            <div>
                                <h1 className="font-bold text-[#776B5D] text-2xl">
                                    Order #{order.id}
                                </h1>
                                <p className="text-[#776B5D]/70 mt-1">
                                    Cashier: {order.users.name} •{" "}
                                    {new Date(order.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => window.print()}
                            className="flex gap-2"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </Button>
                    </div>

                    <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Table>
                                <TableHeader>
                                    <tr>
                                        <TableCell header>Item</TableCell>
                                        <TableCell header>Size</TableCell>
                                        <TableCell header>Qty</TableCell>
                                        <TableCell header>Unit Price</TableCell>
                                        <TableCell header>Total</TableCell>
                                    </tr>
                                </TableHeader>
                                <TableBody>
                                    {order.orderitems.map((item) => {
                                        const base = Number(item.sizes?.price || 0);
                                        const addons = item.orderitemaddons.reduce(
                                            (sum, a) => sum + Number(a.price || 0),
                                            0
                                        );
                                        const unit = base + addons;
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.menu.name}</div>
                                                    {item.orderitemaddons.length > 0 && (
                                                        <div className="text-[#776B5D]/70 text-sm">
                                                            Addons:{" "}
                                                            {item.orderitemaddons
                                                                .map((a) => a.menu.name)
                                                                .join(", ")}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{item.sizes?.label || "—"}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{formatCurrency(unit)}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(unit * item.quantity)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* ✅ Order Summary */}
                        <div className="bg-white shadow-sm p-6 rounded-xl flex flex-col gap-4">
                            <h3 className="font-semibold text-[#776B5D] text-lg">Summary</h3>
                            <div className="space-y-2 text-[#776B5D]">
                                <div className="flex justify-between">
                                    <span>Total</span>
                                    <span>{formatCurrency(order.total)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment</span>
                                    <span>{order.paymentMethod || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status</span>
                                    <span className="capitalize">{order.status}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {order.status === "PENDING" && (
                                    <>
                                        <Button onClick={() => handlePayOrder(order.id)}>
                                            Mark Paid
                                        </Button>
                                        <Button
                                            onClick={() => handleCancelOrder(order.id)}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                                {order.status === "PAID" && (
                                    <>
                                        <Button onClick={() => handleCompleteOrder(order.id)}>
                                            Complete
                                        </Button>
                                        <Button
                                            onClick={() => handleCancelOrder(order.id)}
                                            variant="secondary"
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // ✅ List View
    return (
        <AdminLayout>
            <div className="bg-[#F3EEEA] p-8 h-full overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="font-bold text-[#776B5D] text-2xl lg:text-3xl">
                            Recent Orders
                        </h1>
                        <p className="text-[#776B5D]/70 mt-1">
                            Review pending and completed orders. Confirm to complete or cancel
                            if needed.
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-1" /> Print
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                    {([
                        { key: "PENDING", label: "Pending", Icon: Clock, count: orders.filter(o => o.status === "PENDING" || o.status === "PAID").length },
                        { key: "COMPLETED", label: "Completed", Icon: CheckCircle2, count: orders.filter(o => o.status === "COMPLETED").length },
                        { key: "CANCELLED", label: "Cancelled", Icon: XCircle, count: orders.filter(o => o.status === "CANCELLED").length },
                    ] as const).map(({ key, label, Icon, count }) => (
                        <div
                            key={key}
                            className="flex justify-center items-center bg-white p-2 rounded-xl"
                        >
                            <button
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-normal transition-colors duration-150 w-full h-full ${statusFilter === key
                                    ? "bg-[#776B5D] text-[#F3EEEA]"
                                    : "bg-transparent text-[#776B5D]"
                                    }`}
                                onClick={() => setStatusFilter(key)}
                            >
                                <Icon
                                    className="w-5 h-5"
                                    color={statusFilter === key ? "#F3EEEA" : "#776B5D"}
                                />
                                <span className="capitalize">{label}</span>
                                <span
                                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusFilter === key
                                        ? "bg-[#F3EEEA] text-[#776B5D]"
                                        : "bg-[#B0A695]/20 text-[#776B5D]"
                                        }`}
                                >
                                    {count}
                                </span>
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search orders, cashier, items, payment"
                            className="px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D]"
                        />
                    </div>
                </div>


                {/* Orders Table */}
                <TableContainer scrollable className="max-h-[55vh]">
                    <Table>
                        <TableHeader sticky>
                            <tr>
                                <TableCell header>Order ID</TableCell>
                                <TableCell header>Cashier</TableCell>
                                <TableCell header>Items</TableCell>
                                <TableCell header>Total</TableCell>
                                <TableCell header>Payment</TableCell>
                                <TableCell header>Status</TableCell>
                                <TableCell header>Actions</TableCell>
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order, idx) => (
                                <TableRow key={order.id} index={idx} alternating hover className="transition-colors">
                                    <TableCell
                                        className="underline cursor-pointer"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        #{order.id}
                                    </TableCell>
                                    <TableCell>{order.users.name}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {order.orderitems.slice(0, 2).map((i, idx) => (
                                                <div key={idx}>
                                                    {i.quantity}x {i.menu.name}
                                                </div>
                                            ))}
                                            {order.orderitems.length > 2 && (
                                                <div className="text-[#776B5D]/70">
                                                    +{order.orderitems.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {formatCurrency(order.total)}
                                    </TableCell>
                                    <TableCell>{order.paymentMethod || "—"}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "COMPLETED"
                                                ? "bg-green-100 text-green-700"
                                                : order.status === "PAID"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : order.status === "PENDING"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> View
                                            </Button>
                                            {order.status === "PENDING" && (
                                                <>
                                                    <Button size="sm" onClick={() => handlePayOrder(order.id)}>
                                                        Mark Paid
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                            {order.status === "PAID" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleCompleteOrder(order.id)}
                                                    >
                                                        Complete
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <ConfirmDialog
                    open={confirmState.open}
                    title={confirmState.title}
                    message={confirmState.message}
                    onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
                    onConfirm={confirmState.onConfirm}
                />

                {/* Empty State */}
                {filteredOrders.length === 0 && (
                    <div className="flex flex-col justify-center items-center bg-white mt-4 p-8 border border-dashed border-[#B0A695] rounded-xl text-center">
                        <div className="font-semibold text-[#776B5D] text-lg">
                            No orders found
                        </div>
                        <div className="text-[#776B5D]/70">
                            Try switching to a different status filter.
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
