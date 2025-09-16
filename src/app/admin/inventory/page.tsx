"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useSession } from "next-auth/react";
import {
  Package,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
} from "lucide-react";

import AddInventoryModal from "../components/modals/AddInventoryModal";
import { Button } from "@/components/ui/button";

interface Ingredient {
  id: number;
  name: string;
  supplierId?: number;
  unitId?: number;
  packagePrice?: number | null;
  qtyPerPack?: number | null;
  unitCost?: number | null;
  stock: number;
  threshold: number;
  suppliers?: { id: number; name: string };
  units?: { id: number; name: string };
}

interface Supplier {
  id: number;
  name: string;
  address?: string;
}

interface Unit {
  id: number;
  name: string;
}

type InventoryRow = {
  id: string; // "ing-001"
  type: "ingredient";
  name: string;
  category: "disposable" | "liquid" | "solid" | "powder" | "syrup" | string;
  supplier: string;
  pkgPrice: number | null;
  qtyPerPack: number | null;
  unit: string;
  unitCost: number | null;
  stock: number;
  minStock: number;
  _raw: Ingredient;
};

const currency = (v: number | null | undefined) =>
  v == null
    ? "—"
    : `₱${v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

function inferCategory(unitName?: string | null, itemName?: string) {
  const u = (unitName || "").toLowerCase();
  const n = (itemName || "").toLowerCase();
  if (n.includes("syrup")) return "syrup";
  if (["g", "kg"].includes(u)) return "powder";
  if (["ml", "l"].includes(u)) return "liquid";
  if (n.includes("cup") || n.includes("straw")) return "disposable";
  return "solid";
}

export default function InventoryPage() {
  const { data: session, status } = useSession();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state (matches your sample UI)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [inputStock, setInputStock] = useState("");

  // dialogs

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ingRes, supRes, unitRes] = await Promise.all([
        fetch("/api/admin/inventory/ingredients"),
        fetch("/api/admin/inventory/suppliers"),
        fetch("/api/admin/inventory/units"),
      ]);
      const [ingData, supData, unitData] = await Promise.all([
        ingRes.json(),
        supRes.json(),
        unitRes.json(),
      ]);
      setIngredients(ingData);
      setSuppliers(supData);
      setUnits(unitData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Quick add Supplier
  const handleAddSupplier = async () => {
    const name = typeof window !== "undefined" ? window.prompt("Supplier name:") : null;
    if (!name) return;
    const address = typeof window !== "undefined" ? window.prompt("Address (optional):") : null;
    try {
      const res = await fetch("/api/admin/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      if (!res.ok) throw new Error("Failed to add supplier");
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add supplier");
    }
  };

  // Quick add Unit
  const handleAddUnit = async () => {
    const name = typeof window !== "undefined" ? window.prompt("Unit name (e.g., ml, g):") : null;
    if (!name) return;
    try {
      const res = await fetch("/api/admin/inventory/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to add unit");
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to add unit");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map to unified table rows (ingredients only; cups not in this page)
  const allItems: InventoryRow[] = useMemo(
    () =>
      ingredients.map((ing) => {
        const unitName = ing.units?.name ?? "";
        return {
          id: `ing-${String(ing.id).padStart(3, "0")}`,
          type: "ingredient" as const,
          name: ing.name,
          category: inferCategory(unitName, ing.name),
          supplier: ing.suppliers?.name ?? "—",
          pkgPrice:
            ing.packagePrice == null ? null : Number(ing.packagePrice) || 0,
          qtyPerPack:
            ing.qtyPerPack == null ? null : Number(ing.qtyPerPack) || 0,
          unit: unitName || "—",
          unitCost: ing.unitCost == null ? null : Number(ing.unitCost) || 0,
          stock: Number(ing.stock),
          minStock: Number(ing.threshold),
          _raw: ing,
        };
      }),
    [ingredients]
  );

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allItems, searchTerm, filterCategory]);

  const lowStockItems = filteredItems.filter(
    (item) => item.stock <= item.minStock
  );
  const lowStockCount = lowStockItems.length;

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return { status: "out", color: "text-red-500" };
    if (stock <= minStock) return { status: "low", color: "text-red-500" };
    return { status: "good", color: "text-[#776B5D]" };
  };

  const categories = [
    { label: "All Items", value: "all", icon: Package },
    { label: "Disposable", value: "disposable", icon: Package },
    { label: "Dairy", value: "liquid", icon: Package },
    { label: "Solid", value: "solid", icon: Package },
    { label: "Powder", value: "powder", icon: Package },
    { label: "Syrup", value: "syrup", icon: Package },
  ];

  // CRUD handlers (reuse your existing endpoints)
  const handleEdit = (ing: Ingredient) => {
    setEditingItem(ing);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      const res = await fetch(`/api/admin/inventory/ingredients?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIngredient = () => {
    console.log('Add Ingredient button clicked');
    setEditingItem(null);
    setShowAddModal(true);
    console.log('Modal should be open now, showAddModal:', true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleModalSave = () => {
    fetchData(); // Refresh the data
    handleModalClose();
  };

  const handleRestock = async () => {
    if (!selectedProduct || !inputStock) return;
    const item = allItems.find((it) => it.id === selectedProduct);
    if (!item) return;

    const delta = Number(inputStock);
    const newStock = (item.stock || 0) + delta;

    try {
      const res = await fetch("/api/admin/inventory/ingredients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // your PUT expects a body like your editForm; include id + stock only (server should merge)
        body: JSON.stringify({ id: item._raw.id, stock: newStock }),
      });
      if (!res.ok) throw new Error("Failed to restock");

      // optimistic update
      setIngredients((prev) =>
        prev.map((ing) =>
          ing.id === item._raw.id ? { ...ing, stock: newStock } : ing
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSelectedProduct("");
      setCurrentStock("");
      setInputStock("");
    }
  };

  // session/role gate
  if (status === "loading") return <p>Loading session...</p>;
  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }
  if (session.user.role !== "ADMIN") {
    if (typeof window !== "undefined") window.location.href = "/unauthorized";
    return null;
  }

  // Status tags (like your sample)
  const statusTags = (
    <>
      <span className="flex items-center gap-1 bg-orange-100 px-3 py-2 border border-orange-300 rounded-lg font-medium text-orange-600">
        <AlertTriangle className="w-4 h-4" />
        Low Stock
      </span>
      <span className="bg-white px-3 py-2 border border-green-500 rounded-lg font-medium text-green-600">
        In Stock
      </span>
      <span className="bg-white px-3 py-2 border border-red-500 rounded-lg font-medium text-red-500">
        Out of Stock
      </span>
    </>
  );

  return (
    <AdminLayout>
      <div className="bg-[#F3EEEA] p-8 h-full min-h-screen overflow-hidden flex flex-col">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#2f2a24]">Inventory Management</h1>
            <p className="text-[#776B5D]">
              Track and manage your coffee shop&apos;s inventory, ingredients, and supplies
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddIngredient}
              className="bg-[#776B5D] hover:bg-[#776B5D]/90 text-[#F3EEEA]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
            </Button>
            <Button variant="outline" className="border-[#B0A695] text-[#776B5D]" onClick={handleAddSupplier}>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
            <Button variant="outline" className="border-[#B0A695] text-[#776B5D]" onClick={handleAddUnit}>
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </div>

        {/* Restock Controls */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-[#776B5D]">Restock:</span>
            <select
              value={selectedProduct}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedProduct(id);
                const item = allItems.find((it) => it.id === id);
                setCurrentStock(item ? `${item.stock} ${item.unit}` : "");
              }}
              className="bg-white px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D] min-w-[200px]"
              disabled={loading || allItems.length === 0}
            >
              <option value="">Select Product</option>
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <span className="font-medium text-[#776B5D]">Current Stock:</span>
            <input
              type="text"
              value={currentStock}
              placeholder="Ex: 300 ml"
              className="px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D] min-w-[140px]"
              readOnly
            />
            <input
              type="number"
              value={inputStock}
              onChange={(e) => setInputStock(e.target.value)}
              placeholder="input stock"
              className="px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D] min-w-[140px]"
            />
            <button
              onClick={handleRestock}
              className="bg-[#776B5D] hover:bg-[#776B5D]/90 px-4 py-2 rounded-lg font-medium text-[#F3EEEA] transition-colors duration-150"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* Category Tabs (chips) */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-6">
          {lowStockCount > 0 && (
            <div className="flex justify-center items-center bg-red-500 p-2 rounded-xl">
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-md font-normal transition-colors duration-150 w-full h-full bg-transparent text-white">
                <AlertTriangle className="w-5 h-5" />
                <span>Low on stock | {lowStockCount}</span>
              </button>
            </div>
          )}
          {categories.map((category) => (
            <div key={category.value} className="flex justify-center items-center bg-white p-2 rounded-xl">
              <button
                onClick={() => setFilterCategory(category.value)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-normal transition-colors duration-150 w-full h-full ${
                  filterCategory === category.value
                    ? "bg-[#776B5D] text-[#F3EEEA]"
                    : "bg-transparent text-[#776B5D]"
                }`}
              >
                {/* @ts-ignore */}
                {category.icon && (
                  <category.icon
                    className="w-5 h-5"
                    color={filterCategory === category.value ? "#F3EEEA" : "#776B5D"}
                  />
                )}
                <span>{category.label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Search + Status tags */}
        <div className="bg-white rounded-xl p-4 mb-4 border border-[#E7E1DA]">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <input
              type="text"
              placeholder="Search items..."
              className="border border-[#B0A695] rounded-md px-3 py-2 w-full md:max-w-sm text-[#776B5D] placeholder:text-[#B0A695]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">{statusTags}</div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="flex-1 flex flex-col bg-white border border-[#E7E1DA] rounded-xl overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[960px] w-full text-sm">
              <thead className="bg-[#F7F4F1] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      ID <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Name <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Category <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Supplier <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Pkg Price <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Qty per Pack <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Unit <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Unit Cost <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      On stock <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">
                    <div className="flex items-center gap-1">
                      Reorder level <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#776B5D]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-[#776B5D]" colSpan={11}>
                      <div className="animate-pulse">Loading inventory…</div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-[#776B5D]" colSpan={11}>
                      No items found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => {
                    const stockStatus = getStockStatus(item.stock, item.minStock);
                    const shortId = `INV${item.id.slice(-3).toUpperCase()}`;
                    const rowBg = index % 2 === 1 ? "bg-[#FAF7F3]" : "bg-white";

                    return (
                      <tr key={item.id} className={`${rowBg} hover:bg-[#F3EEEA]`}>
                        <td className="px-4 py-3 font-medium">{shortId}</td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 capitalize">{item.category}</td>
                        <td className="px-4 py-3">{item.supplier}</td>
                        <td className="px-4 py-3">{currency(item.pkgPrice)}</td>
                        <td className="px-4 py-3">{item.qtyPerPack ?? "—"}</td>
                        <td className="px-4 py-3">{item.unit}</td>
                        <td className="px-4 py-3">{currency(item.unitCost)}</td>
                        <td className={`px-4 py-3 font-medium ${stockStatus.color}`}>{item.stock}</td>
                        <td className={`px-4 py-3 font-medium ${stockStatus.color}`}>{item.minStock}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item._raw)}
                              className="p-1 hover:bg-[#B0A695]/20 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-[#776B5D]" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._raw.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Ingredient Modal */}
        <AddInventoryModal
          isOpen={showAddModal}
          onClose={handleModalClose}
          onSave={handleModalSave}
          editingItem={editingItem}
        />
      </div>
    </AdminLayout>
  );
}
