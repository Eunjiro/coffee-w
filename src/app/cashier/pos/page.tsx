"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CashierLayout from "../components/CashierLayout";
import MenuModal from "../components/MenuModal"; // use the new MenuModal for adding to cart
// Removed CheckoutModal import - now using payment page
import { MenuItem, CartItem } from "@/types/types";
import { Star, ShoppingCart, Trash2, CreditCard, Clipboard } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchAndFilters from "@/components/ui/SearchAndFilters";

const categories = [
  { label: "All Items", value: "all", icon: Clipboard },
  { label: "Coffee", value: "COFFEE", icon: Clipboard },
  { label: "Non-Coffee", value: "NON_COFFEE", icon: Clipboard },
  { label: "Meal", value: "MEAL", icon: Clipboard },
  { label: "Add-ons", value: "ADDON", icon: Clipboard },
];

export default function PosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [filteredMenu, setFilteredMenu] = useState<MenuItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);

  const totalCost = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  // --- Session & role check ---
  useEffect(() => {
    if (status === "authenticated" && session?.user.role !== "CASHIER") {
      window.location.href = "/unauthorized";
    } else if (status === "unauthenticated") {
      window.location.href = "/";
    }
  }, [status, session]);

  // --- Fetch menu ---
  useEffect(() => {
    fetch("/api/cashier/menu")
      .then((res) => res.json())
      .then((data: MenuItem[]) => setMenu(Array.isArray(data) ? data : []))
      .catch(() => setMenu([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const filtered = menu.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.type === activeFilter;
      const matchesSearch =
        searchTerm.trim() === "" ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    setFilteredMenu(filtered);
  }, [activeFilter, searchTerm, menu]);

  // --- Cart handlers ---
  const addToCart = (cartItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.cartKey === cartItem.cartKey);
      if (existing) {
        return prev.map((c) =>
          c.cartKey === cartItem.cartKey
            ? { ...c, quantity: c.quantity + cartItem.quantity }
            : c
        );
      }
      return [...prev, cartItem];
    });
  };

  const removeFromCart = (cartKey: string) =>
    setCart((prev) => prev.filter((c) => c.cartKey !== cartKey));

  const clearCart = () => {
    setCart([]);
    router.push("/cashier/orders");
  };

  const proceedToPayment = () => {
    // Store cart data in sessionStorage to pass to payment page
    sessionStorage.setItem('cartItems', JSON.stringify(cart));
    router.push("/cashier/payment");
  };

  if (status === "loading") return <p>Loading session...</p>;

  return (
    <CashierLayout>
      {() => (
        <div className="flex lg:flex-row flex-col bg-[#F3EEEA] w-full h-full overflow-hidden">
          {/* Left: Menu */}
          <div className="flex flex-col flex-1 p-8">
            <PageHeader
              title="Point of Sale"
              description="Process orders and manage transactions"
            />

            {/* Categories */}
            <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
              {categories.map((c) => (
                <div
                  key={c.value}
                  className="flex justify-center items-center bg-white p-2 rounded-xl"
                >
                  <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition w-full h-full ${
                      activeFilter === c.value
                        ? "bg-[#776B5D] text-[#F3EEEA]"
                        : "bg-transparent text-[#776B5D]"
                    }`}
                    onClick={() => setActiveFilter(c.value)}
                  >
                    {React.createElement(c.icon, {
                      className: "w-5 h-5",
                      color:
                        activeFilter === c.value ? "#F3EEEA" : "#776B5D",
                    })}
                    <span>{c.label}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Search + Status tags */}
            <SearchAndFilters
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              statusTags={
                <>
                  <span className="flex items-center gap-1 bg-orange-100 px-3 py-2 border border-orange-300 rounded-lg font-medium text-orange-600">
                    <Star className="w-4 h-4" /> Best Seller
                  </span>
                  <span className="bg-white px-3 py-2 border border-green-500 rounded-lg font-medium text-green-600">
                    Available
                  </span>
                  <span className="bg-white px-3 py-2 border border-red-500 rounded-lg font-medium text-red-500">
                    Unavailable
                  </span>
                </>
              }
            />

            {/* Menu Grid */}
            <div className="flex pr-4 h-full overflow-y-auto custom-scrollbar">
              <div className="gap-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full">
                {loading ? (
                  <p>Loading menu...</p>
                ) : filteredMenu.length === 0 ? (
                  <p>No menu items available</p>
                ) : (
                  filteredMenu.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col bg-white p-4 border rounded-xl transition cursor-pointer hover:shadow-xl border-[#B0A695] hover:border-[#776B5D]"
                      onClick={() => setSelectedItem(item)}
                    >
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="mb-3 rounded-lg w-full object-cover aspect-square"
                      />
                      <div className="font-bold text-[#776B5D] text-lg truncate">
                        {item.name}
                      </div>
                      <div className="text-sm text-[#776B5D]/70 capitalize">
                        {item.type.toLowerCase()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Cart */}
          <div className="flex flex-col bg-white shadow-lg border-[#B0A695] border-t lg:border-t-0 lg:border-l w-full lg:w-[400px] h-full">
            <div className="flex justify-between items-center p-6 pb-4">
              <h2 className="font-bold text-[#776B5D] text-xl">Current Order</h2>
              <button
                onClick={clearCart}
                className="bg-[#B0A695]/20 hover:bg-red-100 px-3 py-1 rounded-lg font-medium text-[#776B5D] hover:text-red-600 transition"
              >
                Reset
              </button>
            </div>
            <hr className="mx-6 border-[#B0A695]" />

            <div className="flex flex-col px-6 py-4 h-full overflow-y-auto custom-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col justify-center items-center w-full h-full text-[#776B5D]/60 text-center">
                  <ShoppingCart className="mb-4 w-16 h-16" />
                  <h3 className="font-bold text-lg">Your cart is empty</h3>
                  <p className="text-sm">Click a menu item to get started.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className="flex bg-[#F3EEEA] mb-3 p-4 border border-[#B0A695] rounded-2xl w-full h-fit"
                  >
                    <img
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      className="flex-shrink-0 mr-4 rounded-lg w-16 h-16 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#776B5D] text-lg truncate">
                        {item.name}
                      </div>
                      <p className="text-sm text-[#776B5D]/70">
                        Size: {item.selectedSize.label}
                      </p>
                      {item.selectedAddons.length > 0 && (
                        <p className="text-sm text-[#776B5D]/70">
                          Add-ons:{" "}
                          {item.selectedAddons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      <p className="text-sm text-[#776B5D]/70">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="flex flex-col justify-between items-end ml-3">
                      <span className="font-bold text-[#776B5D]">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.cartKey)}
                        className="hover:bg-red-50 p-2 rounded-full text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout */}
            {cart.length > 0 && (
              <div className="flex flex-col bg-white p-4 lg:p-6 border-[#B0A695]/20 border-t w-full">
                <div className="flex justify-between mb-2 text-[#776B5D]">
                  <span>Total</span>
                  <span className="font-bold">₱{totalCost.toFixed(2)}</span>
                </div>
                <button
                  onClick={proceedToPayment}
                  className="bg-[#776B5D] hover:bg-[#776B5D]/90 py-3 rounded-lg w-full font-bold text-[#F3EEEA] text-lg transition text-center flex justify-center items-center gap-2"
                >
                  <CreditCard className="" />
                  Proceed to Payment
                </button>
              </div>
            )}
          </div>

          {/* Modal for adding items */}
          {selectedItem && (
            <MenuModal
              item={selectedItem}
              open={!!selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToOrder={addToCart}
            />
          )}

          {/* Checkout Modal removed - now using payment page */}
        </div>
      )}
    </CashierLayout>
  );
}
