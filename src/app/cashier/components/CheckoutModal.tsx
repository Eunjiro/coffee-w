'use client';

import { CartItem } from "@/types/types";
import { useState, useEffect, useMemo } from "react";

interface CheckoutModalProps {
  cartItems: CartItem[];
  onClose: () => void;
  onOrderPlaced: () => void;
  customerPhone?: string;
}

interface Reward {
  id: number;
  name: string;
  pointsCost: number;
  discount: number;
}

export default function CheckoutModal({
  cartItems,
  onClose,
  onOrderPlaced,
  customerPhone: initialPhone,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH" | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || "");
  const [joinLoyalty, setJoinLoyalty] = useState(!!initialPhone);
  const [eligibleRewards, setEligibleRewards] = useState<Reward[]>([]);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<number | null>(null);

  // Base total
  const baseTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  // Reward discount
  const rewardDiscount = useMemo(() => {
    if (!selectedReward) return 0;
    const reward = eligibleRewards.find(r => r.id === selectedReward);
    return reward?.discount || 0;
  }, [selectedReward, eligibleRewards]);

  // Total after reward
  const totalAfterReward = useMemo(() => Math.max(baseTotal - rewardDiscount, 0), [baseTotal, rewardDiscount]);

  // Calculate points to earn (example: 1 point per ₱10 spent)
  const pointsToEarn = useMemo(() => Math.floor(totalAfterReward / 10), [totalAfterReward]);

  // Fetch loyalty info via proxy
  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      if (customerPhone && joinLoyalty) {
        try {
          const res = await fetch(`/api/loyaltyProxy/getBalance?phone=${customerPhone}`);
          const data = await res.json();
          if (data.error) {
            setAvailablePoints(0);
            setEligibleRewards([]);
          } else {
            setAvailablePoints(data.pointsAvailable || 0);
            setEligibleRewards(data.eligibleRewards || []);
          }
        } catch (err) {
          console.error(err);
          setAvailablePoints(0);
          setEligibleRewards([]);
        }
      } else {
        setAvailablePoints(0);
        setEligibleRewards([]);
        setSelectedReward(null);
      }
    };
    fetchLoyaltyInfo();
  }, [customerPhone, joinLoyalty]);

  const placeOrder = async () => {
    if (!paymentMethod) { (window as any).toast?.error?.("Select a payment method"); return; }
    if (cartItems.length === 0) { (window as any).toast?.error?.("Cart is empty"); return; }

    setLoading(true);
    try {
      const rewardUsed = selectedReward ? eligibleRewards.find(r => r.id === selectedReward) : null;
      let redeemed = false;

      // Redeem reward first if selected
      if (joinLoyalty && rewardUsed) {
        const redeemRes = await fetch(`/api/loyaltyProxy/redeemReward`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: customerPhone,
            rewardId: rewardUsed.id,
            orderRef: null, // temporarily null
          }),
        });
        const redeemData = await redeemRes.json();
        if (!redeemData.success) {
          (window as any).toast?.error?.("Failed to redeem reward: " + (redeemData.error || "Unknown"));
          setLoading(false);
          return;
        }
        redeemed = true;
      }

      // Place POS order
      const posRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems,
          paymentMethod,
          baseTotal,
          appliedReward: rewardUsed,
          discount: rewardDiscount,
          total: totalAfterReward,
        }),
      });
      const posData = await posRes.json();
      if (!posData.success || !posData.orderRef) {
        (window as any).toast?.error?.("Failed to place order: " + (posData.error || "Unknown error"));
        setLoading(false);
        return;
      }
      const orderRef = posData.orderRef;

      // Update reward with actual orderRef
      if (joinLoyalty && rewardUsed && redeemed) {
        await fetch(`/api/loyaltyProxy/redeemReward`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: customerPhone, rewardId: rewardUsed.id, orderRef }),
        });
      }

      // Add points (calculated from total after reward discount)
      // Add points (calculated from total after reward discount)
if (joinLoyalty) {
  await fetch(`/api/loyaltyProxy/addPoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderRef,
      customerPhone,
      totalAmount: totalAfterReward, // use the final total after reward
      items: cartItems.map(item => ({
        menuId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    }),
  });
}


      (window as any).toast?.success?.("Order placed successfully!");
      onOrderPlaced();
      onClose();
    } catch (err) {
      console.error(err);
      (window as any).toast?.error?.("Error placing order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#F3EEEA] w-[500px] rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-[#776B5D]">Checkout</h2>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto max-h-64 border-b border-[#B0A695] pb-2">
          {cartItems.map(item => (
            <div key={item.cartKey} className="flex justify-between py-1">
              <p className="text-[#776B5D]">{item.name} x{item.quantity}</p>
              <p className="text-[#776B5D]">₱{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Reward discount */}
        {rewardDiscount > 0 && (
          <p className="text-right text-green-600">
            Reward Discount: -₱{rewardDiscount.toFixed(2)}
          </p>
        )}

        {/* Final total */}
        <p className="text-xl font-bold text-right text-[#776B5D]">
          Total: ₱{totalAfterReward.toFixed(2)}
        </p>

        {/* Loyalty options */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[#776B5D]">Phone Number (Optional for Loyalty)</label>
          <input
            type="text"
            className="border rounded p-2"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="0917XXXXXXX"
            disabled={!!initialPhone}
          />
          <label className="flex items-center gap-2 text-[#776B5D]">
            <input
              type="checkbox"
              checked={joinLoyalty}
              onChange={() => setJoinLoyalty(!joinLoyalty)}
              disabled={!!initialPhone}
            />
            Join Rewards Program
          </label>

          {joinLoyalty && <p className="text-sm text-[#776B5D]">Available Points: {availablePoints}</p>}

          {eligibleRewards.length > 0 && (
            <div>
              <label className="text-[#776B5D]">Redeem Reward</label>
              <select
                value={selectedReward ?? ""}
                onChange={(e) => setSelectedReward(e.target.value ? Number(e.target.value) : null)}
                className="border rounded p-2 w-full"
              >
                <option value="">Select a reward</option>
                {eligibleRewards.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.pointsCost} pts) - ₱{r.discount}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Payment buttons */}
        <div className="flex gap-4 mt-2">
          <button
            className={`flex-1 py-2 rounded ${paymentMethod === "CASH" ? "bg-[#B0A695]" : "bg-[#776B5D]"} text-white`}
            onClick={() => setPaymentMethod("CASH")}
          >
            Cash
          </button>
          <button
            className={`flex-1 py-2 rounded ${paymentMethod === "GCASH" ? "bg-[#B0A695]" : "bg-[#776B5D]"} text-white`}
            onClick={() => setPaymentMethod("GCASH")}
          >
            GCash
          </button>
        </div>

        {/* Action buttons */}
        <button
          className="mt-4 py-2 bg-[#776B5D] text-white rounded"
          onClick={placeOrder}
          disabled={loading}
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
        <button
          className="mt-2 py-2 bg-white text-[#776B5D] rounded"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
