"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Smartphone, ArrowLeft, CheckCircle, User, Search, Receipt, Star } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Remove mock data imports - we'll use real API endpoints
// import JoinLoyaltyModal from "../components/modals/JoinLoyaltyModal";
// import SelectRewardsModal from "../components/modals/SelectRewardsModal";

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

interface PaymentProps {
    orderItems?: OrderItem[];
    onBack?: () => void;
    onPaymentComplete?: (paymentData: PaymentData) => void;
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
    loyaltyMember?: any;
    selectedRewards: any[];
    timestamp: Date;
}

const Payment: React.FC<PaymentProps> = ({ orderItems: propOrderItems, onBack: propOnBack, onPaymentComplete: propOnPaymentComplete }) => {
    const router = useRouter();

    // Load cart data from sessionStorage
    const [orderItems, setOrderItems] = useState<OrderItem[]>(propOrderItems || []);
    const [isLoading, setIsLoading] = useState(true);
    const [customerName, setCustomerName] = useState("");
    const [customerNotes, setCustomerNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "gcash">("cash");
    const [amountPaid, setAmountPaid] = useState("");
    const [loyaltySearch, setLoyaltySearch] = useState("");
    const [selectedLoyaltyMember, setSelectedLoyaltyMember] = useState<any | null>(null);
    const [loyaltySearchResults, setLoyaltySearchResults] = useState<any[]>([]);
    const [selectedRewards, setSelectedRewards] = useState<any[]>([]);
    const [showRewardsModal, setShowRewardsModal] = useState(false);
    const [showJoinLoyaltyModal, setShowJoinLoyaltyModal] = useState(false);
    const [addonData, setAddonData] = useState<any[]>([]);

    // Load cart data from sessionStorage on component mount
    useEffect(() => {
        const loadCartData = () => {
            try {
                // Check if we're on the client side
                if (typeof window === 'undefined') {
                    setIsLoading(false);
                    return;
                }

                const cartData = sessionStorage.getItem('cartItems');
                if (cartData) {
                    const parsedCart = JSON.parse(cartData);
                    console.log("Raw cart data from sessionStorage:", parsedCart);
                    
                    // Convert CartItem to OrderItem format
                    const orderItems = parsedCart.map((item: any) => {
                        // Get the size price from the selectedSize
                        const sizePrice = item.selectedSize?.price || 0;
                        
                        return {
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            selectedSize: item.selectedSize?.label?.toLowerCase() || "medium",
                            small_price: item.selectedSize?.label?.toLowerCase() === "small" ? sizePrice : 0,
                            medium_price: item.selectedSize?.label?.toLowerCase() === "medium" ? sizePrice : sizePrice, // Default to sizePrice if no specific size
                            large_price: item.selectedSize?.label?.toLowerCase() === "large" ? sizePrice : 0,
                            quantity: item.quantity,
                            selectedAddons: item.selectedAddons?.map((addon: any) => addon.name) || [],
                            orderId: item.cartKey
                        };
                    });
                    setOrderItems(orderItems);
                    console.log("Converted order items:", orderItems);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading cart data:', error);
                setIsLoading(false);
            }
        };

        if (!propOrderItems) {
            loadCartData();
        } else {
            setIsLoading(false);
        }
    }, [propOrderItems]);

    // Load addon data on component mount
    useEffect(() => {
        const loadAddonData = async () => {
            try {
                const response = await fetch("/api/admin/menu");
                const data = await response.json();
                const addons = data.filter((item: any) => item.type === "ADDON");
                setAddonData(addons);
            } catch (error) {
                console.error('Error loading addon data:', error);
            }
        };
        loadAddonData();
    }, []);

    // Calculate totals
    const subtotal = useMemo(() => {
        const result = orderItems.reduce((total, item) => {
            // Use the cart item's price directly since it already includes the selected size price
            const basePrice = item.medium_price || 0; // This is the price from the cart
            const addonsTotal = item.selectedAddons
                ? item.selectedAddons.reduce((sum, addonName) => {
                    const addon = addonData.find((a) => a.name === addonName);
                    return sum + (addon ? (addon.basePrice || 0) : 0);
                }, 0)
                : 0;
            const itemTotal = (basePrice + addonsTotal) * item.quantity;
            console.log(`Item ${item.name}: basePrice=${basePrice}, addonsTotal=${addonsTotal}, quantity=${item.quantity}, itemTotal=${itemTotal}`);
            return total + itemTotal;
        }, 0);
        console.log("Total subtotal:", result);
        return result;
    }, [orderItems, addonData]);

    const rewardsDiscount = useMemo(() => {
        return selectedRewards.reduce((total, reward) => {
            return total + (reward.discount || 0);
        }, 0);
    }, [selectedRewards, subtotal]);

    const tax = useMemo(() => (subtotal - rewardsDiscount) * 0.12, [subtotal, rewardsDiscount]);
    const total = useMemo(() => subtotal - rewardsDiscount + tax, [subtotal, rewardsDiscount, tax]);
    const change = useMemo(() => {
        const paid = parseFloat(amountPaid) || 0;
        return Math.max(0, paid - total);
    }, [amountPaid, total]);

    const formatPrice = (price: number) => `₱${price.toFixed(2)}`;

    const handlePaymentMethodChange = (method: string) => {
        setPaymentMethod(method as "cash" | "gcash");
        if (method !== "cash") {
            setAmountPaid(total.toFixed(2));
        } else {
            setAmountPaid("");
        }
    };

    const handleLoyaltySearch = async (searchTerm: string) => {
        setLoyaltySearch(searchTerm);
        if (searchTerm.trim() === "") {
            setLoyaltySearchResults([]);
            return;
        }

        try {
            // Search loyalty members via API
            const response = await fetch(`/api/loyaltyProxy/getBalance?phone=${searchTerm}`);
            const data = await response.json();

            if (data.error) {
                setLoyaltySearchResults([]);
            } else {
                setLoyaltySearchResults([data]);
            }
        } catch (error) {
            console.error('Error searching loyalty members:', error);
            setLoyaltySearchResults([]);
        }
    };

    const handleSelectLoyaltyMember = (member: any) => {
        setSelectedLoyaltyMember(member);
        setCustomerName(member.name);
        setLoyaltySearch(member.name);
        setLoyaltySearchResults([]);
    };

    const handleRemoveLoyaltyMember = () => {
        setSelectedLoyaltyMember(null);
        setLoyaltySearch("");
        setSelectedRewards([]); // Clear rewards when removing loyalty member
    };

    const handleSelectReward = (reward: any) => {
        setSelectedRewards((prev) => [...prev, reward]);
    };

    const handleRemoveReward = (rewardId: string) => {
        setSelectedRewards((prev) => prev.filter((reward) => reward.id !== rewardId));
    };

    const handleJoinLoyalty = (customerData: { name: string; phone: string; email: string }) => {
        // In a real application, this would make an API call to create a new loyalty member
        // For now, we'll just show an alert and set the customer name
        alert(`Welcome to our loyalty program, ${customerData.name}! You'll receive 100 welcome points.`);
        setCustomerName(customerData.name);
        // You could also add the new member to the loyalty data here
    };

    const handleBack = () => {
        if (propOnBack) {
            propOnBack();
        } else {
            router.back();
        }
    };

    const handleConfirmPayment = async () => {
        if (paymentMethod === "cash" && parseFloat(amountPaid) < total) {
            alert("Amount paid must be greater than or equal to total amount");
            return;
        }

        // Note: Addon data will be loaded asynchronously, so we'll handle missing addons gracefully

        try {
            // Get the original cart data from sessionStorage to maintain proper structure
            const cartData = sessionStorage.getItem('cartItems');
            if (!cartData) {
                alert("Cart data not found. Please try again.");
                return;
            }

            const originalCartItems = JSON.parse(cartData);
            console.log("Original cart items:", originalCartItems);

            // Create order via API using the original cart structure
            const orderData = {
                cartItems: originalCartItems.map((item: any) => {
                    // Validate the cart item
                    if (!item.id || !item.quantity || !item.price) {
                        console.error('Invalid cart item:', item);
                        throw new Error(`Invalid cart item: ${item.name || 'Unknown item'}`);
                    }

                    // Validate price
                    if (item.price <= 0) {
                        console.error('Invalid price for item:', item);
                        throw new Error(`Invalid price for item: ${item.name}`);
                    }

                    return {
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        selectedSize: item.selectedSize || null,
                        selectedAddons: (item.selectedAddons || []).filter((addon: any) => addon.id && addon.price > 0)
                    };
                }),
                paymentMethod: paymentMethod.toUpperCase(),
                appliedReward: selectedRewards.length > 0 ? selectedRewards[0] : null,
            };

            console.log("Sending order data:", JSON.stringify(orderData, null, 2));

            const orderResponse = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            const orderResult = await orderResponse.json();

            if (!orderResult.success) {
                alert("Failed to create order: " + (orderResult.error || "Unknown error"));
                return;
            }

            // Mark order as paid
            const payResponse = await fetch("/api/orders/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: orderResult.orderRef }),
            });

            const payData = await payResponse.json();

            if (!payData.success) {
                alert("Failed to process payment: " + (payData.error || "Unknown error"));
                return;
            }

            const paymentData: PaymentData = {
                orderId: orderResult.orderRef,
                customerName,
                customerNotes,
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

            // Clear cart data from sessionStorage
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('cartItems');
            }

            if (propOnPaymentComplete) {
                propOnPaymentComplete(paymentData);
            } else {
                alert("Payment completed successfully!");
                router.push("/cashier/orders");
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            alert("Error processing payment. Please try again.");
        }
    };

    const paymentMethods = [
        { value: "cash", label: "Cash", icon: Banknote },
        { value: "gcash", label: "GCash - Unavailable", icon: Smartphone, disabled: true },
    ];

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

    if (orderItems.length === 0) {
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
            {/* Left: Order Review & Customer Info */}
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
                    <div className="p-6 border-[#B0A695]/20 border-b">
                        <h3 className="flex items-center font-semibold text-[#776B5D] text-lg">
                            <Receipt className="mr-2 w-5 h-5" />
                            Order Summary
                        </h3>
                    </div>
                    <div className="p-6">
                        {orderItems.length === 0 ? (
                            <div className="py-8 text-[#776B5D]/60 text-center">No items in order</div>
                        ) : (
                            <div className="space-y-4">
                                {orderItems.map((item) => {
                                    const basePrice =
                                        item.selectedSize === "small"
                                            ? item.small_price
                                            : item.selectedSize === "large"
                                                ? item.large_price
                                                : item.medium_price;
                                    const addonsTotal = item.selectedAddons
                                        ? item.selectedAddons.reduce((sum, addonName) => {
                                            const addon = addonData.find((a) => a.name === addonName);
                                            return sum + (addon ? addon.price : 0);
                                        }, 0)
                                        : 0;
                                    const itemTotal = ((basePrice ?? 0) + addonsTotal) * item.quantity;

                                    return (
                                        <div key={item.orderId} className="flex justify-between items-center bg-[#F3EEEA] p-4 rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={item.image || "/placeholder.png"}
                                                    alt={item.name}
                                                    className="rounded-lg w-16 h-16 object-cover"
                                                />

                                                <div>
                                                    <h4 className="font-medium text-[#776B5D]">{item.name}</h4>
                                                    <p className="text-[#776B5D]/70 text-sm">
                                                        {item.selectedSize.charAt(0).toUpperCase() + item.selectedSize.slice(1)} •{" "}
                                                        {item.selectedAddons && item.selectedAddons.length > 0 && <span> +{item.selectedAddons.length} add-ons</span>}
                                                    </p>
                                                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                        <div className="mt-1 text-[#776B5D]/60 text-xs">
                                                            {item.selectedAddons.join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-[#776B5D]">{item.quantity}x {formatPrice(basePrice ?? 0)}</div>
                                                {addonsTotal > 0 && <div className="text-[#776B5D]/70 text-sm">+{formatPrice(addonsTotal)}</div>}
                                                <div className="font-bold text-[#776B5D]">{formatPrice(itemTotal)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white shadow-sm p-6 border border-[#B0A695]/20 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="flex items-center font-semibold text-[#776B5D] text-lg">
                            <User className="mr-2 w-5 h-5" />
                            Customer Information
                        </h3>
                        <Button variant="secondary" onClick={() => alert("Join Loyalty Program feature coming soon")}>
                            <Star className="mr-2 w-4 h-4" />
                            Join Loyalty Program
                        </Button>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-[#776B5D] mb-2">Loyalty Search</label>
                        <div className="relative">
                            <Input
                                value={loyaltySearch}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLoyaltySearch(e.target.value)}
                                placeholder="Search by name or phone number"
                                className="w-full"
                            />
                            {loyaltySearchResults.length > 0 && (
                                <div className="z-10 absolute bg-white shadow-lg mt-1 border border-[#B0A695] rounded-lg w-full max-h-60 overflow-y-auto">
                                    {loyaltySearchResults.map((member) => (
                                        <div
                                            key={member.id}
                                            onClick={() => handleSelectLoyaltyMember(member)}
                                            className="hover:bg-[#F3EEEA] p-3 border-[#B0A695]/20 border-b last:border-b-0 cursor-pointer"
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
                                                    <div className="mt-1 text-[#776B5D]/70 text-sm">{member.pointsAvailable || 0} pts</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Payment Details - FIXED LAYOUT */}
            <div className="flex flex-col bg-white shadow-lg border-[#B0A695] border-t lg:border-t-0 lg:border-l w-full lg:w-[400px] h-full">
                {/* Header */}
                <div className="flex flex-shrink-0 justify-between items-center p-6 pb-4">
                    <h2 className="font-bold text-[#776B5D] text-xl">Payment Summary</h2>
                </div>
                <hr className="flex-shrink-0 mx-6 border-[#B0A695]" />

                {/* Payment Details - Scrollable Content */}
                <div className="flex flex-col px-6 py-4 h-full overflow-y-auto custom-scrollbar">
                    {/* Totals */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-[#776B5D]">
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        {rewardsDiscount > 0 && (
                            <div className="flex justify-between text-blue-600">
                                <span>Rewards Discount</span>
                                <span>-{formatPrice(rewardsDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-[#776B5D]">
                            <span>Tax (12%)</span>
                            <span>{formatPrice(tax)}</span>
                        </div>
                        <hr className="border-[#B0A695]/20" />
                        <div className="flex justify-between font-bold text-[#776B5D] text-xl">
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="mb-6">
                        <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Payment Method</h3>
                        <div className="space-y-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                return (
                                    <button
                                        key={method.value}
                                        onClick={() => !method.disabled && handlePaymentMethodChange(method.value)}
                                        disabled={method.disabled}
                                        className={`w-full flex items-center p-3 rounded-lg border transition-colors ${method.disabled
                                                ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-50"
                                                : paymentMethod === method.value
                                                    ? "border-[#776B5D] bg-[#776B5D]/10"
                                                    : "border-[#B0A695] hover:border-[#776B5D]/50"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 ${method.disabled ? "text-gray-400" : "text-[#776B5D]"}`} />
                                        <span className={`font-medium ${method.disabled ? "text-gray-400" : "text-[#776B5D]"}`}>
                                            {method.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Input */}
                    <div className="mb-6">
                        <h3 className="mb-4 font-semibold text-[#776B5D] text-lg">Payment Details</h3>
                        {paymentMethod === "cash" && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-[#776B5D] mb-2">Amount Received</label>
                                <Input
                                    type="number"
                                    value={amountPaid}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountPaid(e.target.value)}
                                    placeholder="Enter amount received"
                                    className="w-full"
                                />
                            </div>
                        )}

                        {paymentMethod === "cash" && change > 0 && (
                            <div className="bg-green-50 mt-4 p-4 border border-green-200 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-green-800">Change Due</span>
                                    <span className="font-bold text-green-800 text-xl">{formatPrice(change)}</span>
                                </div>
                            </div>
                        )}

                        {paymentMethod === "gcash" && (
                            <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
                                <div className="flex items-center text-red-800">
                                    <span className="font-medium">GCash payment is currently unavailable</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer - Action Buttons */}
                <div className="flex flex-col bg-white p-4 lg:p-6 border-[#B0A695]/20 border-t w-full h-fit">
                    <div className="space-y-3">
                        <Button
                            onClick={handleConfirmPayment}
                            size="lg"
                            className="w-full"
                            disabled={
                                paymentMethod === "gcash" ||
                                (paymentMethod === "cash" && (!amountPaid || parseFloat(amountPaid) < total))
                            }
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

            {/* Modals temporarily disabled - would need to be implemented */}
        </div>
    );
};

export default Payment;
