"use client";

import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useSession } from "next-auth/react";
import { AlertCircle, ClipboardList, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Ingredient {
  id: number;
  name: string;
  supplierId?: number;
  unitId?: number;
  stock: number | string;
  threshold: number | string;
  packagePrice: number;
  qtyPerPack: number;
  unitCost: number;
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

export default function InventoryPage() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<"ingredients" | "suppliers" | "units">("ingredients");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [ingredientSearch, setIngredientSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState<Partial<Ingredient>>({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<Ingredient>>({
    name: "",
    stock: 0,
    threshold: 0,
    unitCost: 0,
  });

  const handleEdit = (ing: Ingredient) => {
    setSelectedIng(ing);
    setEditForm(ing);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedIng) return;
    try {
      const res = await fetch("/api/admin/inventory/ingredients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
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

  const handleAddIngredient = async () => {
    try {
      const res = await fetch("/api/admin/inventory/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) throw new Error("Failed to add ingredient");
      setShowAddModal(false);
      setAddForm({ name: "", stock: 0, threshold: 0, unitCost: 0 });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  

  const filteredIngredients = ingredients
    .filter((ing) => ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
    .filter((ing) => {
      if (categoryFilter === "low") {
        return Number(ing.stock) <= Number(ing.threshold);
      }
      if (categoryFilter === "dairy") {
        return ing.name.toLowerCase().includes("milk") || ing.name.toLowerCase().includes("cream");
      }
      if (categoryFilter === "disposable") {
        return ing.name.toLowerCase().includes("cup") || ing.name.toLowerCase().includes("straw");
      }
      return true;
    });

  const filteredSuppliers = suppliers.filter((sup) =>
    sup.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(unitSearch.toLowerCase())
  );

  if (status === "loading") return <p>Loading session...</p>;
  if (!session) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }
  if (session.user.role !== "ADMIN") {
    if (typeof window !== "undefined") window.location.href = "/unauthorized";
    return null;
  }

  const lowStockCount = ingredients.filter(
    (ing) => Number(ing.stock) <= Number(ing.threshold)
  ).length;

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>

        {/* Add Ingredient Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ingredient</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Stock"
                value={addForm.stock ?? ""}
                onChange={(e) => setAddForm({ ...addForm, stock: Number(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Threshold"
                value={addForm.threshold ?? ""}
                onChange={(e) => setAddForm({ ...addForm, threshold: Number(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Unit Cost"
                value={addForm.unitCost ?? ""}
                onChange={(e) => setAddForm({ ...addForm, unitCost: Number(e.target.value) })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddIngredient}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Stat Filters + Add Button */}
        {activeTab === "ingredients" && (
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Low on Stock */}
            <button
              onClick={() => setCategoryFilter("low")}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-red-500 rounded-xl hover:shadow"
            >
              <AlertCircle className="text-red-500 w-6 h-6" />
              <span className="text-red-500 font-medium">
                Low on stock | {lowStockCount}
              </span>
            </button>

            {/* aall Items */}
            <button
              onClick={() => setCategoryFilter("all")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${categoryFilter === "all"
                ? "bg-[#B0A695] text-white"
                : "bg-white border border-gray-300 text-gray-700"
                }`}
            >
              <ClipboardList className="w-6 h-6" />
              <span>All Items</span>
            </button>

            {/* disposable */}
            <button
              onClick={() => setCategoryFilter("disposable")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${categoryFilter === "disposable"
                ? "bg-[#776B5D] text-white"
                : "bg-white border border-gray-300 text-gray-700"
                }`}
            >
              <ClipboardList className="w-6 h-6" />
              <span>Disposable</span>
            </button>

            {/* dairy */}
            <button
              onClick={() => setCategoryFilter("dairy")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${categoryFilter === "dairy"
                ? "bg-[#776B5D] text-white"
                : "bg-white border border-gray-300 text-gray-700"
                }`}
            >
              <ClipboardList className="w-6 h-6" />
              <span>Dairy</span>
            </button>

            {/* add ing */}
            <button
              onClick={() => setShowAddModal(true)} // <- You'll use this to toggle a modal
              className="ml-auto flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              <span>Add Ingredient</span>
            </button>
          </div>
        )}


        {/* tabs */}
        <div className="flex border-b border-gray-300 mb-4">
          {["ingredients", "suppliers", "units"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 -mb-px font-semibold border-b-2 ${activeTab === tab
                ? "border-[#776B5D] text-[#776B5D]"
                : "border-transparent text-gray-600 hover:text-[#776B5D]"
                }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {activeTab === "ingredients" && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
                  <input
                    type="text"
                    placeholder="Search ingredients..."
                    className="border border-gray-300 rounded-md px-3 py-1 w-full sm:max-w-sm"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto max-h-[500px] border border-gray-300 rounded-md">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-2 border-b text-left">Name</th>
                        <th className="p-2 border-b text-left">Supplier</th>
                        <th className="p-2 border-b text-left">Unit</th>
                        <th className="p-2 border-b text-left">Stock</th>
                        <th className="p-2 border-b text-left">Threshold</th>
                        <th className="p-2 border-b text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ing) => {
                        const stock = Number(ing.stock);
                        const threshold = Number(ing.threshold);
                        const isLowStock = stock <= threshold;

                        return (
                          <tr key={ing.id} className={`hover:bg-gray-50 ${isLowStock ? "bg-red-50" : ""}`}>
                            <td className="p-2 border-b flex items-center gap-2">
                              {ing.name}
                              {isLowStock && (
                                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                  Low Stock!
                                </span>
                              )}
                            </td>
                            <td className="p-2 border-b">{ing.suppliers?.name || "-"}</td>
                            <td className="p-2 border-b">{ing.units?.name || "-"}</td>
                            <td className={`p-2 border-b ${isLowStock ? "text-red-600 font-semibold" : ""}`}>
                              {stock}
                            </td>
                            <td className={`p-2 border-b ${isLowStock ? "text-red-600 font-semibold" : ""}`}>
                              {threshold}
                            </td>
                            <td className="p-2 border-b">
                              <button
                                className="text-blue-600 hover:underline mr-2"
                                onClick={() => handleEdit(ing)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-600 hover:underline"
                                onClick={() => handleDelete(ing.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Ingredient</DialogTitle>
                </DialogHeader>
                {selectedIng && (
                  <div className="space-y-3">
                    <Input
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name"
                    />
                    <Input
                      type="number"
                      value={editForm.stock ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                      placeholder="Stock"
                    />
                    <Input
                      type="number"
                      value={editForm.threshold ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, threshold: Number(e.target.value) })}
                      placeholder="Threshold"
                    />
                    <Input
                      type="number"
                      value={editForm.unitCost ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, unitCost: Number(e.target.value) })}
                      placeholder="Unit Cost"
                    />
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Suppliers Tab */}
            {activeTab === "suppliers" && (
              <div>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    className="border border-gray-300 rounded-md px-3 py-1 w-full max-w-sm"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto max-h-[500px] border border-gray-300 rounded-md">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 border-b">Name</th>
                        <th className="p-2 border-b">Address</th>
                        <th className="p-2 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map((sup) => (
                        <tr key={sup.id} className="hover:bg-gray-50">
                          <td className="p-2 border-b">{sup.name}</td>
                          <td className="p-2 border-b">{sup.address || "-"}</td>
                          <td className="p-2 border-b">
                            <button className="text-blue-600 hover:underline mr-2">Edit</button>
                            <button className="text-red-600 hover:underline">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {filteredSuppliers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-gray-500">
                            No suppliers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Units Tab */}
            {activeTab === "units" && (
              <div>
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Search units..."
                    className="border border-gray-300 rounded-md px-3 py-1 w-full max-w-sm"
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto max-h-[500px] border border-gray-300 rounded-md">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 border-b">Name</th>
                        <th className="p-2 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50">
                          <td className="p-2 border-b">{unit.name}</td>
                          <td className="p-2 border-b">
                            <button className="text-blue-600 hover:underline mr-2">Edit</button>
                            <button className="text-red-600 hover:underline">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {filteredUnits.length === 0 && (
                        <tr>
                          <td colSpan={2} className="p-2 text-center text-gray-500">
                            No units found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
