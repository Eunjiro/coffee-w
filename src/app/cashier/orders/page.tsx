"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Ensure this Button component exists and has the correct prop types
import { Table, TableBody, TableCell, TableHeader, TableRow, TableContainer } from "../../admin/components/ui/Table";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import CashierLayout from "../components/CashierLayout";

// Utility functions for success and error handling (similar to swal functionality)
const showConfirm = (title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
        if (window.confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
};

const showSuccess = (title: string, message: string) => {
    toast.success(`${title}: ${message}`);
};

const showError = (title: string, message: string) => {
    toast.error(`${title}: ${message}`);
};

// Format currency function
const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
};

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
        size?: { label: string };
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
    const [statusFilter, setStatusFilter] = useState<"PENDING" | "PAID" | "COMPLETED" | "CANCELLED" | "VOID">("PENDING");
    const router = useRouter();

    // Fetch orders from the backend
    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            const data = await res.json();
            if (data.success) setOrders(data.orders);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to fetch orders");
        }
    };

    // Handle status filter change
    const handleFilterChange = (filter: "PENDING" | "PAID" | "COMPLETED" | "CANCELLED" | "VOID") => {
        setStatusFilter(filter);
    };

    // Pay an order
    const handlePayOrder = async (orderId: number) => {
        const confirm = await showConfirm("Mark as Paid", "Are you sure you want to mark this order as paid?");
        if (confirm) {
            try {
                const res = await fetch("/api/orders/pay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.success) {
                    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "PAID" } : order)));
                    showSuccess("Order paid", "The order has been marked as paid.");
                } else {
                    showError("Failed to mark order as paid", data.error);
                }
            } catch (error) {
                showError("Something went wrong", "Failed to mark order as paid");
            }
        }
    };

    // Complete an order
    const handleCompleteOrder = async (orderId: number) => {
        const confirm = await showConfirm("Complete Order", "Are you sure you want to mark this order as completed?");
        if (confirm) {
            try {
                const res = await fetch("/api/orders/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.success) {
                    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "COMPLETED" } : order)));
                    showSuccess("Order completed", "The order has been marked as completed.");
                } else {
                    showError("Failed to complete the order", data.error);
                }
            } catch (error) {
                showError("Something went wrong", "Failed to complete the order");
            }
        }
    };

    // Cancel an order
    const handleCancelOrder = async (orderId: number) => {
        const confirm = await showConfirm("Cancel Order", "Are you sure you want to cancel this order?");
        if (confirm) {
            try {
                const res = await fetch("/api/orders/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.success) {
                    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "CANCELLED" } : order)));
                    showSuccess("Order canceled", "The order has been canceled.");
                } else {
                    showError("Failed to cancel the order", data.error);
                }
            } catch (error) {
                showError("Something went wrong", "Failed to cancel the order");
            }
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval); // Clear interval when component unmounts
    }, []);

    if (status === "loading") return <p>Loading session...</p>;
    if (!session || session.user.role !== "CASHIER") {
        router.push("/unauthorized");
        return null;
    }

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => order.status === statusFilter);
    }, [orders, statusFilter]);

    return (
        <CashierLayout>
            <div className="p-6 space-y-4">
                <h1 className="text-2xl font-bold">Orders</h1>
                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    {["PENDING", "PAID", "COMPLETED", "CANCELLED", "VOID"].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "outline" : "secondary"}
                            onClick={() => handleFilterChange(status as "PENDING" | "PAID" | "COMPLETED" | "CANCELLED" | "VOID")}
                            className="flex gap-2 items-center"
                        >
                            {status === "PENDING" && <Clock className="w-5 h-5" />}
                            {status === "PAID" && <CheckCircle2 className="w-5 h-5" />}
                            {status === "COMPLETED" && <CheckCircle2 className="w-5 h-5" />}
                            {status === "CANCELLED" && <XCircle className="w-5 h-5" />}
                            {status === "VOID" && <XCircle className="w-5 h-5" />}
                            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                        </Button>
                    ))}
                </div>

                {/* Orders Table */}
                <TableContainer>
                    <Table>
                        <TableHeader>
                            <tr>
                                <TableCell header>Order ID</TableCell>
                                <TableCell header>Customer</TableCell>
                                <TableCell header>Items</TableCell>
                                <TableCell header>Total</TableCell>
                                <TableCell header>Payment</TableCell>
                                <TableCell header>Status</TableCell>
                                <TableCell header>Actions</TableCell>
                            </tr>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell>#{order.id}</TableCell>
                                    <TableCell>{order.users.name}</TableCell>
                                    <TableCell>
                                        {order.orderitems.slice(0, 2).map((item, idx) => (
                                            <div key={idx}>
                                                {item.quantity}x {item.menu.name}
                                                {item.size && ` (${item.size.label})`}
                                                {item.orderitemaddons.length > 0 && (
                                                    <div className="text-sm text-gray-600">
                                                        + {item.orderitemaddons.map(addon => addon.menu.name).join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.orderitems.length > 2 && <span>+{order.orderitems.length - 2} more</span>}
                                    </TableCell>
                                    <TableCell>{formatCurrency(order.total)}</TableCell>
                                    <TableCell>{order.paymentMethod || "—"}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                order.status === "COMPLETED" ? "bg-green-100 text-green-700" : 
                                                order.status === "PAID" ? "bg-blue-100 text-blue-700" :
                                                order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : 
                                                "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {order.status === "PENDING" && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handlePayOrder(order.id)}
                                                    className="mr-2"
                                                >
                                                    Mark Paid
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleCancelOrder(order.id)}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                        {order.status === "PAID" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCompleteOrder(order.id)}
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </CashierLayout>
    );
}
