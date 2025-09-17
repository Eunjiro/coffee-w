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
  type: string; 
  status: "Available" | "Unavailable";
  image?: string;
  sizes: Size[];
  addons?: Addon[];
}

export interface CartItem {
  id: number;
  cartKey: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  selectedSize: Size;
  selectedAddons: Addon[];
}


