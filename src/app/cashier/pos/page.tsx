'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import CashierLayout from '../components/CashierLayout';
import MenuCard from '../components/MenuCard';
import OrderModal from '../components/OrderModal';
import CheckoutModal from '../components/CheckoutModal';
import FilterBar from '../components/FilterBar';
import { MenuItem, CartItem } from "@/types/types";

const filters = [
  { id: "all", label: "All Items" },
  { id: "COFFEE", label: "Coffee" },
  { id: "NON_COFFEE", label: "Non-Coffee" },
  { id: "MEAL", label: "Meal" },
  { id: "ADDON", label: "Add-ons" },
];

export default function PosPage() {
  const { data: session, status } = useSession();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<MenuItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const totalCost = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // session & role check
  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "CASHIER") {
      window.location.href = "/unauthorized";
    } else if (status === "unauthenticated") {
      window.location.href = "/";
    }
  }, [status, session]);

  // fetch menu
  useEffect(() => {
    fetch("/api/cashier/menu")
      .then(res => res.json())
      .then((data: MenuItem[]) => setMenu(Array.isArray(data) ? data : []))
      .catch(() => setMenu([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeFilter === "all") setFilteredMenu(menu);
    else setFilteredMenu(menu.filter(item => item.type === activeFilter));
  }, [activeFilter, menu]);

  // cart handlers
  const addToCart = (cartItem: CartItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.cartKey === cartItem.cartKey);
      if (existing) return prev.map(c => c.cartKey === cartItem.cartKey ? { ...c, quantity: c.quantity + cartItem.quantity } : c);
      return [...prev, cartItem];
    });
    setCartOpen(true);
  };

  const removeFromCart = (cartKey: string) => setCart(prev => prev.filter(c => c.cartKey !== cartKey));

  const clearCart = () => setCart([]);

  if (status === "loading") return <p>Loading session...</p>;

  return (
    <CashierLayout>
      {() => (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-[#776B5D]">Menu</h1>

          <FilterBar filters={filters} active={activeFilter} onChange={setActiveFilter} />

          <div className="flex flex-wrap gap-4 overflow-y-auto scrollbar-hide max-h-[calc(100vh-200px)]">
            {loading ? <p>Loading menu...</p>
              : filteredMenu.length === 0 ? <p>No menu items available</p>
                : filteredMenu.map(item => (
                  <div key={item.id} onClick={() => setSelectedItem(item)}>
                    <MenuCard {...item} />
                  </div>
                ))}
          </div>

          {selectedItem && (
            <OrderModal
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToCart={addToCart}
            />
          )}

          {/* Cart panel */}
          <div className={`fixed top-0 right-0 h-full w-96 bg-[#F3EEEA] shadow-lg transform transition-transform duration-300 z-40 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4 flex flex-col h-full">
              <h2 className="text-2xl font-bold text-[#776B5D] mb-4">Cart</h2>
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? <p>No items in cart</p>
                  : cart.map(item => (
                    <div key={item.cartKey} className="flex justify-between items-center mb-2">
                      <div>
                        <p>{item.name}</p>
                        <p className="text-sm">{item.selectedSize.label} {item.selectedAddons.map(a => `+${a.name}`).join(', ')}</p>
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p>₱{(item.price * item.quantity).toFixed(2)}</p>
                        <button className="text-red-500 text-xs mt-1" onClick={() => removeFromCart(item.cartKey)}>Remove</button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="border-t border-[#B0A695] pt-4">
                <p className="text-lg font-semibold">Total: ₱{totalCost.toFixed(2)}</p>
                <button
                  className="mt-2 w-full bg-[#776B5D] text-white py-2 rounded"
                  onClick={() => setCheckoutOpen(true)}
                  disabled={cart.length === 0}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>

          {checkoutOpen && (
            <CheckoutModal
              cartItems={cart}
              onClose={() => setCheckoutOpen(false)}
              onOrderPlaced={clearCart} // clear cart when order is successfully placed
            />
          )}

        </div>
      )}
    </CashierLayout>
  );
}
