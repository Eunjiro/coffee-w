export interface Size {
  id: number;
  label: string;
  price: number;
}

export interface Addon {
  id: number;
  name: string;
  price: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  type: string; // e.g., COFFEE, NON_COFFEE, MEAL, ADDON
  status: "Available" | "Unavailable";
  image?: string;
  sizes: Size[];
  addons?: Addon[];
}

export interface CartItem {
  id: number;
  cartKey: string; // unique key for cart item
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedSize: Size;
  selectedAddons: Addon[];
}


