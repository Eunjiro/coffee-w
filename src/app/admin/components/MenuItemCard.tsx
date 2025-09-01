"use client";

import MenuCard from "./MenuCard";
import { MenuItem } from "../types";

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

export default function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  return (
    <div className="relative">
      <MenuCard {...item} /> {/* image is now optional */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 transition-colors"
          onClick={() => onEdit(item)}
        >
          Edit
        </button>
        <button
          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors"
          onClick={() => onDelete(item.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
