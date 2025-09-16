"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import AddMenuModal from "../components/modals/AddMenuModal";
import AddAddonModal from "../components/modals/AddAddonModal";
import AddCategoryModal from "../components/modals/AddCategoryModal";
import EditMenuModal, { MenuItem as ModalMenuItem } from "../components/modals/EditMenuModal";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { useSession } from "next-auth/react";
import { MenuItem as APIItem } from "../types";
import { Clipboard, Plus, Star } from "lucide-react";
import SearchAndFilters from "../components/ui/SearchAndFilters";

export default function AdminMenuPage() {
  const { data: session, status } = useSession();

  const [menuItems, setMenuItems] = useState<APIItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "COFFEE" | "NON-COFFEE" | "MEAL" | "ADDON">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ModalMenuItem | null>(null);

  const [cups, setCups] = useState<{ id: number; name: string }[]>([]);
  const [ingredientOptions, setIngredientOptions] = useState<{ id: number; name: string; unit?: string }[]>([]);

  const [categories, setCategories] = useState<string[]>([
    "All Items",
    "Coffee",
    "Non-Coffee",
    "Meal",
    "Addon"
  ]);

  // Fetch menu items on mount
  useEffect(() => {
    fetchMenu();
    // parallel load cups and ingredients for modals
    Promise.all([
      fetch("/api/admin/inventory/cups").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/inventory/ingredients").then(r => r.ok ? r.json() : []),
    ]).then(([cupsRes, ingsRes]) => {
      setCups(Array.isArray(cupsRes) ? cupsRes : []);
      setIngredientOptions(
        Array.isArray(ingsRes)
          ? ingsRes.map((i: any) => ({ id: i.id, name: i.name, unit: i.units?.name }))
          : []
      );
    }).catch(() => {
      setCups([]);
      setIngredientOptions([]);
    });
  }, []);

  async function fetchMenu() {
    try {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setMenuItems(data as APIItem[]);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      setMenuItems([]);
    }
  }

  // Convert API item to modal type for editing
  const handleEditItem = (item: APIItem) => {
    const normalizedItem: ModalMenuItem = {
      id: item.id,
      name: item.name,
      image: item.image,
      type: item.type as ModalMenuItem["type"], // Direct mapping from schema
      status: item.status,
      sizes: item.sizes.map(s => ({
        id: s.id,
        label: s.label,
        price: s.price,
        cupId: (s as any).cupId ?? null // Ensure safe access
      })),
      ingredients: {
        small: [],
        medium: [],
        large: []
      }
    };

    setSelectedItem(normalizedItem);
    setEditModalOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    fetchMenu();
  };

  const handleSaveItem = async (updated: ModalMenuItem) => {
    const payload = {
      name: updated.name,
      image: updated.image || "",
      type: updated.type as any,
      status: updated.status,
      category: undefined,
      sizes: ["small", "medium", "large"].flatMap((label) => {
        const size = updated.sizes.find(s => s.label.toLowerCase() === label);
        if (!size) return [] as any[];
        return [{
          label: size.label.charAt(0).toUpperCase() + size.label.slice(1),
          price: Number(size.price) || 0,
          ingredients: (updated.ingredients as any)[label]?.map((i: any) => ({
            ingredientId: i.ingredientId,
            qtyNeeded: i.quantity,
          })) || [],
        }];
      }),
    };

    await fetch(`/api/admin/menu/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchMenu();
  };

  const handleAddCategory = (name: string) => {
    if (name && !categories.includes(name)) {
      setCategories(prev => [...prev, name]);
    }
  };

  const handleRemoveCategory = (name: string) => {
    setCategories(prev => prev.filter(c => c !== name));
  };

  // Filter menu items
  const filteredMenu = menuItems
    .filter(item => {
      if (activeFilter === "all") return true;
      const itemTypeNorm = (item.type || "").replace(/_/g, "-");
      return itemTypeNorm === activeFilter;
    })
    .filter(item => searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Session & auth
  if (status === "loading") return <p>Loading session...</p>;
  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }
  if (session.user.role !== "ADMIN") {
    if (typeof window !== "undefined") window.location.href = "/unauthorized";
    return null;
  }

  const actions = (
    <>
      <Button onClick={() => setMenuModalOpen(true)} icon={Plus}>
        Add Menu
      </Button>
      <Button onClick={() => setAddonModalOpen(true)} icon={Plus}>
        Add Addons
      </Button>
      <Button onClick={() => setCategoryModalOpen(true)} icon={Plus}>
        Add Category
      </Button>
    </>
  );

  const statusTags = (
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
  );

  const formatPrice = (price?: number) => (price ? `₱${price}` : "N/A");

  return (
    <AdminLayout>
      <div className="bg-[#F3EEEA] p-8 h-full">
        <PageHeader
          title="Menu Management"
          description="Manage your coffee shop menu items, categories, and pricing"
          actions={actions}
        />

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
          {(
            [
              { key: "all", label: "All" },
              { key: "COFFEE", label: "Coffee" },
              { key: "NON-COFFEE", label: "Non-Coffee" },
              { key: "MEAL", label: "Meal" },
              { key: "ADDON", label: "Addon" }
            ] as const
          ).map(filter => (
            <div key={filter.key} className="flex justify-center items-center bg-white p-2 rounded-xl">
              <button
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-normal transition-colors duration-150 w-full h-full ${activeFilter === filter.key
                    ? "bg-[#776B5D] text-[#F3EEEA]"
                    : "bg-transparent text-[#776B5D]"
                  }`}
              >
                <Clipboard
                  className="w-5 h-5"
                  color={activeFilter === filter.key ? "#F3EEEA" : "#776B5D"}
                />
                <span>{filter.label}</span>
              </button>
            </div>
          ))}
        </div>

        <SearchAndFilters
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          statusTags={statusTags}
        />

        {/* Menu Grid */}
        <div className="gap-6 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 pr-6 pb-[20px] w-full max-h-[60vh] overflow-y-auto custom-scrollbar">
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <div
                key={item.id}
                className={`flex flex-col items-start bg-white p-4 border rounded-xl transition duration-300 cursor-pointer hover:shadow-xl group border-[#B0A695] ${item.status === "AVAILABLE"
                    ? "hover:border-[#776B5D]"
                    : "opacity-50 grayscale"
                  }`}
                onClick={() => handleEditItem(item)}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="w-60 h-56 bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}

                <div className="mb-2 font-bold text-[#776B5D] text-xl truncate">
                  {item.name}
                </div>
                <div className="mb-2 text-sm capitalize font-medium text-[#776B5D]/70">
                  {item.type.replace(/_/g, " ").replace(/-/g, " ")}
                </div>
                <div className="flex flex-wrap gap-2 mb-3 font-medium text-sm">
                  {item.sizes.map(s => (
                    <span
                      key={s.label}
                      className="bg-[#B0A695]/20 px-2 py-1 rounded-lg text-[#776B5D]"
                    >
                      {s.label} {formatPrice(s.price)}
                    </span>
                  ))}
                </div>
                <div
                  className={`font-medium text-sm ${item.status === "AVAILABLE" ? "text-green-600" : "text-red-500"
                    }`}
                >
                  {item.status}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col justify-center items-center py-16 text-center justify-self-center col-span-full">
              <Clipboard className="mb-4 w-16 h-16 text-[#776B5D]/30" />
              <h3 className="mb-2 font-bold text-[#776B5D] text-lg">
                No menu items found
              </h3>
              <p className="mb-6 text-[#776B5D]/60">
                Try adjusting your search terms or filters.
              </p>
              <Button onClick={() => setMenuModalOpen(true)} icon={Plus}>
                Add Menu Item
              </Button>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddMenuModal
          open={menuModalOpen}
          onClose={() => setMenuModalOpen(false)}
          onNext={fetchMenu}
        />
        <AddAddonModal
          open={addonModalOpen}
          onClose={() => setAddonModalOpen(false)}
          onConfirm={() => fetchMenu()}
        />
        <AddCategoryModal
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          onConfirm={handleAddCategory}
          categories={categories}
          onRemove={handleRemoveCategory}
        />
        <EditMenuModal
          open={editModalOpen}
          item={selectedItem}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          cups={cups}
          ingredients={ingredientOptions as any}
        />
      </div>
    </AdminLayout>
  );
}
