"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Ingredient {
  id: number;
  name: string;
  stock: number;
  threshold: number;
  packagePrice: number;
  qtyPerPack: number;
  unitCost: number;
  suppliers?: { id: number; name: string };
  units?: { id: number; name: string };
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filtered, setFiltered] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // fetch ingredients
  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inventory/ingredients");
      const data = await res.json();
      setIngredients(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch ingredients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(ingredients);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        ingredients.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.suppliers?.name.toLowerCase().includes(q) ||
            i.units?.name.toLowerCase().includes(q)
        )
      );
    }
  }, [search, ingredients]);

  // delete ingredient
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;
    try {
      await fetch(`/api/admin/inventory/ingredients?id=${id}`, {
        method: "DELETE",
      });
      toast.success("Ingredient deleted");
      fetchIngredients();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete ingredient");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-primary">Ingredients</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white">+ Add Ingredient</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search ingredients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Supplier</th>
                <th className="p-2 text-left">Unit</th>
                <th className="p-2 text-left">Stock</th>
                <th className="p-2 text-left">Threshold</th>
                <th className="p-2 text-left">Cost</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="p-2">{i.name}</td>
                  <td className="p-2">{i.suppliers?.name || "-"}</td>
                  <td className="p-2">{i.units?.name || "-"}</td>
                  <td className="p-2">{i.stock}</td>
                  <td className="p-2">{i.threshold}</td>
                  <td className="p-2">
                    ₱
                    {typeof i.unitCost === "number"
                      ? i.unitCost.toFixed(2)
                      : Number(i.unitCost || 0).toFixed(2)}
                  </td>
                  <td className="p-2 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-yellow-500 text-white"
                      onClick={() => toast.info("Edit form coming soon")}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-500 text-white"
                      onClick={() => handleDelete(i.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No ingredients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
