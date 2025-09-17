export interface Ingredient {
  id?: number;
  name: string;
  qtyNeeded: number;
}

export interface Size {
  id: number;
  label: string;
  price: number;
  cupId?: number | null;
  ingredients?: Ingredient[];
}

export interface MenuItem { 
  id: number;
  name: string;
  image?: string;
  type: "COFFEE" | "NON-COFFEE" | "MEAL" | "ADDON";
  status: "AVAILABLE" | "UNAVAILABLE" | "HIDDEN";
  sizes: { id: number; label: string; price: number; cupId?: number | null }[];
  ingredients: {
    small: { ingredientId: number; quantity: number }[];
    medium: { ingredientId: number; quantity: number }[];
    large: { ingredientId: number; quantity: number }[];
  };
}

export interface MenuForm {
  name: string;
  image: string;
  type: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "HIDDEN";
  sizes: Size[];
}

export interface OrderItemAddon {
  id: number;
  addonId: number;
  price: number;
  menu: { name: string };
}

export interface OrderItem {
  id: number;
  menuId: number;
  menu: { name: string };
  size?: { label: string };
  quantity: number;
  orderitemaddons: OrderItemAddon[];
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED" | "VOID";
  paymentMethod?: "CASH" | "CARD" | "GCASH" | "OTHER";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  orderitems: OrderItem[];
  users: { name: string; email: string };
}