"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import MenuModal from "../components/MenuModal";
import MenuItemCard from "../components/MenuItemCard";
import FilterBar from "../components/FilterBar";
import { Ingredient, Size, MenuItem, MenuForm } from "../types";
import { useSession } from "next-auth/react";

export default function AdminMenuPage() {
  const { data: session, status } = useSession();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState<MenuForm>({
    name: "",
    image: "",
    type: "Hot",
    status: "Available",
    sizes: [{ label: "S", price: 100, ingredients: [] }],
  });

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // fetch menu items from API
  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    const res = await fetch("/api/admin/menu");
    const data: MenuItem[] = await res.json();
    setMenuItems(data);
  }

  // fandle create or update menu
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/admin/menu/${editing.id}` : "/api/admin/menu";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    resetForm();
    fetchMenu();
  }

  const resetForm = () => {
    setForm({
      name: "",
      image: "",
      type: "Hot",
      status: "Available",
      sizes: [{ label: "S", price: 100, ingredients: [] }],
    });
    setEditing(null);
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    const sizesWithIngredients: Size[] = item.sizes.map((s) => ({
      ...s,
      ingredients: s.ingredients || [],
    }));

    setEditing(item);
    setForm({ ...item, sizes: sizesWithIngredients });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    fetchMenu();
  };

  // filter menu items based on type
  const filteredMenuItems = menuItems.filter(
    (item) => activeFilter === "all" || item.type === activeFilter
  );

  if (status === "loading") {
    return <p>Loading session...</p>;
  }

  if (!session) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  if (session.user.role !== "ADMIN") {
    if (typeof window !== "undefined") {
      window.location.href = "/unauthorized";
    }
    return null;
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#776B5D]">Menu</h1>
          <button
            onClick={openAddModal}
            className="bg-[#776B5D] text-white px-4 py-2 rounded-lg hover:bg-[#675D4F] transition-colors"
          >
            Add Menu
          </button>
        </div>

        <FilterBar
          active={activeFilter}
          onChange={setActiveFilter}
          onAddCategory={openAddModal}
        />

        <div className="flex flex-wrap gap-6 mt-4">
          {filteredMenuItems.length > 0 ? (
            filteredMenuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <p className="text-[#776B5D]">No items in this category.</p>
          )}
        </div>

        <MenuModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          editing={editing}
        />
      </div>
    </AdminLayout>
  );
}
