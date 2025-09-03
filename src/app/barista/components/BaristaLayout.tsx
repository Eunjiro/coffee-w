'use client';

import Header from "./Header";
import BaristaSidenav from "./Sidebar";
import { ReactNode, useState } from "react";
import { CartItem } from "@/types/types";

interface BaristaLayoutProps {
  children: ReactNode | ((props: { addToCart: (item: CartItem) => void; cartItems: CartItem[] }) => ReactNode);
}

export default function BaristaLayout({ children }: BaristaLayoutProps) {
  const [open, setOpen] = useState(false);

  // Cart
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(ci => ci.cartKey === item.cartKey);
      if (existing) {
        return prev.map(ci =>
          ci.cartKey === item.cartKey ? { ...ci, quantity: ci.quantity + item.quantity } : ci
        );
      }
      return [...prev, item];
    });
    setCartOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#F3EEEA]">
      {/* Sidebar */}
      <BaristaSidenav open={open} setOpen={setOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <Header
          setOpen={setOpen}
          cartOpen={cartOpen}
          setCartOpen={setCartOpen}
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {typeof children === "function" ? children({ addToCart, cartItems }) : children}
        </main>

      </div>
    </div>
  );
}
