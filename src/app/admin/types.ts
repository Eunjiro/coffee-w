export interface Ingredient {
  id?: number;
  name: string;
  qtyNeeded: number;
}

export interface Size {
  id?: number;
  label: string;
  price: number;
  ingredients: Ingredient[];
}

export interface MenuItem {
  id: number;
  name: string;
  image: string;
  type: string;
  status: string;
  sizes: Size[];
}

export interface MenuForm {
  name: string;
  image: string;
  type: string;
  status: string;
  sizes: Size[];
}
