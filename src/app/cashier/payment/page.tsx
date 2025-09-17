"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
    Banknote,
    Smartphone,
    ArrowLeft,
    CheckCircle,
    User,
    Receipt,
    Star
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoyaltyMember {
    id: string;
    name: string;
    phone: string;
    pointsAvailable: number;
}

interface CartItem {
    id: number;
    name: string;
    image?: string;
    selectedSize?: { label: string; price: number };
    quantity: number;
    selectedAddons?: { id: number; name: string; price: number }[];
    cartKey: string;
    price: number;
}

interface Reward {
    id: string;
    name: string;
    discount: number;
}

interface Addon {
    id: number;
    name: string;
    type: "ADDON" | "ITEM";
    basePrice: number;
    sizes?: { label: string; price: number }[];
}

interface OrderItem {
    id: number;
    name: string;
    image?: string;
    selectedSize: "small" | "medium" | "large";
    small_price?: number;
    medium_price?: number;
    large_price?: number;
    quantity: number;
    selectedAddons?: string[];
    orderId: string;
}

interface PaymentData {
    orderId: string;
    customerName: string;
    customerNotes: string;
    paymentMethod: "cash" | "gcash";
    amountPaid: number;
    change: number;
    subtotal: number;
    rewardsDiscount: number;
    tax: number;
    total: number;
    loyaltyMember?: LoyaltyMember;
    selectedRewards: Reward[];
    timestamp: Date;
}

interface PaymentProps {
    orderItems?: OrderItem[];
    onBack?: () => void;
    onPaymentComplete?: (paymentData: PaymentData) => void;
}

const Payment: React.FC<PaymentProps> = ({ orderItems: propOrderItems, onBack: propOnBack, onPaymentComplete: propOnPaymentComplete }) => {
    const router = useRouter();

    // --- State ---
    const [orderItems, setOrderItems] = useState<OrderItem[]>(propOrderItems || []);
    const [isLoading, setIsLoading] = useState(true);
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
    const [amountPaid, setAmountPaid] = useState("");
    const [loyaltySearch, setLoyaltySearch] = useState("");
    const [selectedLoyaltyMember, setSelectedLoyaltyMember] = useState<LoyaltyMember | null>(null);
    const [loyaltySearchResults, setLoyaltySearchResults] = useState<LoyaltyMember[]>([]);
    const [addonData, setAddonData] = useState<Addon[]>([]);
    const [selectedRewards, setSelectedRewards] = useState<Reward[]>([]);

    // --- Load cart from sessionStorage ---
    useEffect(() => {
        if (propOrderItems) {
            setIsLoading(false);
            return;
        }

        try {
            const cartData = typeof window !== "undefined" ? sessionStorage.getItem("cartItems") : null;
            if (cartData) {
                const parsedCart: CartItem[] = JSON.parse(cartData);
                const convertedOrderItems: OrderItem[] = parsedCart.map(item => {
                    const sizeLabel = item.selectedSize?.label?.toLowerCase() || "medium";
                    const sizePrice = item.selectedSize?.price || 0;
                    return {
                        id: item.id,
                        name: item.name,
                        image: item.image,
                        selectedSize: sizeLabel as "small" | "medium" | "large",
                        small_price: sizeLabel === "small" ? sizePrice : 0,
                        medium_price: sizeLabel === "medium" ? sizePrice : sizePrice,
                        large_price: sizeLabel === "large" ? sizePrice : 0,
                        quantity: item.quantity,
                        selectedAddons: item.selectedAddons?.map(addon => addon.name) || [],
                        orderId: item.cartKey,
                    };
                });
                setOrderItems(convertedOrderItems);
            }
        } catch (err) {
            console.error("Error parsing cart data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [propOrderItems]);

    // --- Load Addons ---
    useEffect(() => {
        const fetchAddons = async () => {
            try {
                const res = await fetch("/api/admin/menu");
                const data: Addon[] = await res.json();
                const addons = data.filter(a => a.type === "ADDON");
                setAddonData(addons);
            } catch (err) {
                console.error("Failed to load addons:", err);
            }
        };
        fetchAddons();
    }, []);

    // --- Totals ---
    const subtotal = useMemo(() => {
        return orderItems.reduce((sum, item) => {
            const basePrice = item.selectedSize === "small" ? item.small_price ?? 0
                : item.selectedSize === "large" ? item.large_price ?? 0
                : item.medium_price ?? 0;

            const addonsTotal = item.selectedAddons?.reduce((addonSum, name) => {
                const addon = addonData.find(a => a.name === name);
                return addonSum + (addon ? Number(addon.sizes?.[0]?.price ?? addon.basePrice) : 0);
            }, 0) ?? 0;

            return sum + (basePrice + addonsTotal) * item.quantity;
        }, 0);
    }, [orderItems, addonData]);

    const rewardsDiscount = useMemo(() => selectedRewards.reduce((sum, r) => sum + (r.discount || 0), 0), [selectedRewards]);
    const tax = useMemo(() => (subtotal - rewardsDiscount) * 0.12, [subtotal, rewardsDiscount]);
    const total = useMemo(() => subtotal - rewardsDiscount + tax, [subtotal, rewardsDiscount, tax]);
    const change = useMemo(() => Math.max(0, (parseFloat(amountPaid) || 0) - total), [amountPaid, total]);

    const formatPrice = (price: number) => `₱${price.toFixed(2)}`;

    // --- Handlers ---
    const handleBack = () => {
        if (propOnBack) return propOnBack();
        router.back();
    };

    const handlePaymentMethodChange = (method: "cash" | "gcash") => {
        setPaymentMethod(method);
        if (method !== "cash") setAmountPaid(total.toFixed(2));
        else setAmountPaid("");
    };

    const handleLoyaltySearch = async (term: string) => {
        setLoyaltySearch(term);
        if (!term.trim()) return setLoyaltySearchResults([]);

        try {
            const res = await fetch(`/api/loyaltyProxy/getBalance?phone=${term}`);
            const data = await res.json();
            if (!data.error) setLoyaltySearchResults([data]);
            else setLoyaltySearchResults([]);
        } catch (err) {
            console.error("Error searching loyalty members:", err);
            setLoyaltySearchResults([]);
        }
    };

    const handleSelectLoyaltyMember = (member: LoyaltyMember) => {
        setSelectedLoyaltyMember(member);
        setCustomerName(member.name);
        setLoyaltySearch(member.name);
        setLoyaltySearchResults([]);
    };

    const handleConfirmPayment = async () => {
        if (paymentMethod === "cash" && parseFloat(amountPaid) < total) {
            toast.error("Amount paid must be greater than or equal to total.");
            return;
        }

        try {
            const cartData = typeof window !== "undefined" ? sessionStorage.getItem("cartItems") : null;
            if (!cartData) return toast.error("Cart data not found.");

            const originalCart: CartItem[] = JSON.parse(cartData);
            const orderPayload = {
                cartItems: originalCart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    selectedSize: item.selectedSize || null,
                    selectedAddons: item.selectedAddons?.filter(a => a.id && a.price > 0) || []
                })),
                paymentMethod: paymentMethod.toUpperCase(),
                appliedReward: selectedRewards[0] || null,
            };

            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
            });

            const orderResult = await orderRes.json();
            if (!orderResult.success) return toast.error(orderResult.error || "Order creation failed.");

            // Mark as paid
            const payRes = await fetch("/api/orders/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: orderResult.orderRef }),
            });
            const payData = await payRes.json();
            if (!payData.success) return toast.error(payData.error || "Payment failed.");

            const paymentData: PaymentData = {
                orderId: orderResult.orderRef,
                customerName,
                customerNotes: "",
                paymentMethod,
                amountPaid: parseFloat(amountPaid) || total,
                change,
                subtotal,
                rewardsDiscount,
                tax,
                total,
                loyaltyMember: selectedLoyaltyMember || undefined,
                selectedRewards,
                timestamp: new Date(),
            };

            if (typeof window !== "undefined") sessionStorage.removeItem("cartItems");

            if (propOnPaymentComplete) propOnPaymentComplete(paymentData);
            else {
                toast.success("Payment completed successfully!");
                router.push("/cashier/orders");
            }

        } catch (err) {
            console.error("Payment error:", err);
            toast.error("Payment failed. Try again.");
        }
    };

    // --- Payment Methods ---
    const paymentMethods = [
        { value: "cash", label: "Cash", icon: Banknote },
        { value: "gcash", label: "GCash - Unavailable", icon: Smartphone, disabled: true }
    ];

    // --- Render Loading ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#776B5D] mx-auto mb-4"></div>
                    <p className="text-[#776B5D]">Loading payment page...</p>
                </div>
            </div>
        );
    }

    if (!orderItems.length) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Receipt className="w-16 h-16 text-[#776B5D]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#776B5D] mb-2">No items in cart</h3>
                    <p className="text-[#776B5D]/70 mb-4">Please add items to your cart first.</p>
                    <Button onClick={handleBack}>
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to POS
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex lg:flex-row flex-col bg-[#F3EEEA] w-full h-full overflow-hidden">
            {/* Left */}
            <div className="flex flex-col flex-1 p-4 lg:p-8 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" onClick={handleBack} className="mr-4">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Back to POS
                    </Button>
                    <PageHeader title="Payment" description="Review order and process payment" className="mb-0" />
                </div>

                {/* Order List */}
                <div className="bg-white shadow-sm mb-6 border border-[#B0A695]/20 rounded-xl">
                    <div className="p-6 border-b border-[#B0A695]/20">
                        <h3 className="flex items-center font-semibold text-[#776B5D] text-lg">
                            <Receipt className="mr-2 w-5 h-5" />
                            Order Summary
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {orderItems.map(item => {
                            const basePrice = item.selectedSize === "small" ? item.small_price ?? 0
                                : item.selectedSize === "large" ? item.large_price ?? 0
                                : item.medium_price ?? 0;

                            const addonsTotal = item.selectedAddons?.reduce((sum, name) => {
                                const addon = addonData.find(a => a.name === name);
                                return sum + (addon ? Number(addon.sizes?.[0]?.price ?? addon.basePrice) : 0);
                            }, 0) ?? 0;

                            const itemTotal = (basePrice + addonsTotal) * item.quantity;

                            return (
                                <div key={item.orderId} className="flex justify-between items-center bg-[#F3EEEA] p-4 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <Image
                                            src={item.image ?? "/placeholder.png"}
                                            alt={item.name}
                                            width={64}
                                            height={64}
                                            className="rounded-lg object-cover"
                                        />
                                        <div>
                                            <h4 className="font-medium text-[#776B5D]">{item.name}</h4>
                                            <p className="text-[#776B5D]/70 text-sm">
                                                {item.selectedSize.charAt(0).toUpperCase() + item.selectedSize.slice(1)}
                                                {item.selectedAddons?.length ? ` • +${item.selectedAddons.length} add-ons` : ""}
                                            </p>
                                            {item.selectedAddons?.length ? (
                                                <div className="mt-1 text-[#776B5D]/60 text-xs">{item.selectedAddons.join(", ")}</div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-[#776B5D]">{item.quantity}x {formatPrice(basePrice)}</div>
                                        {addonsTotal > 0 && <div className="text-[#776B5D]/70 text-sm">+{formatPrice(addonsTotal)}</div>}
                                        <div className="font-bold text-[#776B5D]">{formatPrice(itemTotal)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cashier Info & Loyalty */}
                <div className="bg-white shadow-sm p-6 border border-[#B0A695]/20 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="flex items-center font-semibold text-[#776B5D] text-lg">
                            <User className="mr-2 w-5 h-5" />
                            Cashier Information
                        </h3>
                        <Button variant="secondary" onClick={() => toast.info("Join Loyalty Program coming soon")}>
                            <Star className="mr-2 w-4 h-4" />
                            Join Loyalty Program
                        </Button>
                    </div>

                    <label className="block text-sm font-medium text-[#776B5D] mb-2">Loyalty Search</label>
                    <div className="relative">
                        <Input
                            value={loyaltySearch}
                            onChange={e => handleLoyaltySearch(e.target.value)}
                            placeholder="Search by name or phone"
                        />
                        {loyaltySearchResults.length > 0 && (
                            <div className="absolute z-10 bg-white border border-[#B0A695] rounded-lg w-full max-h-60 overflow-y-auto shadow-lg mt-1">
                                {loyaltySearchResults.map(member => (
                                    <div key={member.id} className="cursor-pointer hover:bg-[#F3EEEA] p-3 border-b last:border-b-0"
                                        onClick={() => handleSelectLoyaltyMember(member)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-[#776B5D]">{member.name}</div>
                                                <div className="text-[#776B5D]/70 text-sm">{member.phone}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    LOYALTY
                                                </div>
                                                <div className="mt-1 text-[#776B5D]/70 text-sm">{member.pointsAvailable} pts</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-col bg-white shadow-lg border-[#B0A695] border-t lg:border-t-0 lg:border-l w-full lg:w-[400px] h-full">
                <div className="flex flex-shrink-0 justify-between items-center p-6 pb-4">
                    <h2 className="font-bold text-[#776B5D] text-xl">Payment Summary</h2>
                </div>
                <hr className="border-[#B0A695]" />

                <div className="flex flex-col px-6 py-4 h-full overflow-y-auto custom-scrollbar">
                    {/* Totals */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-[#776B5D]"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                        {rewardsDiscount > 0 && <div className="flex justify-between text-blue-600"><span>Rewards Discount</span><span>-{formatPrice(rewardsDiscount)}</span></div>}
                        <div className="flex justify-between text-[#776B5D]"><span>Tax (12%)</span><span>{formatPrice(tax)}</span></div>
                        <hr className="border-[#B0A695]/20" />
                        <div className="flex justify-between font-bold text-[#776B5D] text-xl"><span>Total</span><span>{formatPrice(total)}</span></div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mb-6">
                        <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Payment Method</h3>
                        <div className="space-y-3">
                            {paymentMethods.map(method => {
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.value}
                                        onClick={() => !method.disabled && handlePaymentMethodChange(method.value as "cash" | "gcash")}
                                        disabled={method.disabled}
                                        className={`w-full flex items-center p-3 rounded-lg border transition-colors ${method.disabled
                                            ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
                                            : paymentMethod === method.value
                                                ? "border-[#776B5D] bg-[#776B5D]/10"
                                                : "border-[#B0A695] hover:border-[#776B5D]/50"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 ${method.disabled ? "text-gray-400" : "text-[#776B5D]"}`} />
                                        <span className={`font-medium ${method.disabled ? "text-gray-400" : "text-[#776B5D]"}`}>{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Payment Details</h3>
                        {paymentMethod === "cash" && (
                            <>
                                <label className="block text-sm font-medium text-[#776B5D] mb-2">Amount Received</label>
                                <Input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Enter amount received" />
                                {change > 0 && (
                                    <div className="bg-green-50 mt-4 p-4 border border-green-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-green-800">Change Due</span>
                                            <span className="font-bold text-green-800 text-xl">{formatPrice(change)}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {paymentMethod === "gcash" && (
                            <div className="bg-red-50 p-4 border border-red-200 rounded-lg text-red-800">
                                GCash payment is currently unavailable
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col bg-white p-4 lg:p-6 border-t border-[#B0A695]/20 w-full">
                    <Button
                        onClick={handleConfirmPayment}
                        size="lg"
                        className="w-full mb-3"
                        disabled={paymentMethod === "gcash" || (paymentMethod === "cash" && (!amountPaid || parseFloat(amountPaid) < total))}
                    >
                        <CheckCircle className="mr-2 w-5 h-5" />
                        Confirm Payment - {formatPrice(total)}
                    </Button>
                    <Button onClick={handleBack} variant="secondary" size="lg" className="w-full">
                        <ArrowLeft className="mr-2 w-5 h-5" />
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
