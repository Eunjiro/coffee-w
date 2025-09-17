"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, UploadCloud } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import FormField, { Input, Select } from "../ui/FormField";

interface AddMenuModalProps {
  open: boolean;
  onClose: () => void;
  onNext: () => void;
}

type MenuIngredient = {
  id: string;
  ingredientId: string;
  quantity: string;
};

type MenuCup = {
  price: string;
};

// Prisma enum-compatible menu types
const menuTypes = [
  { value: "COFFEE", label: "Coffee" },
  { value: "NON_COFFEE", label: "Non-Coffee" },
  { value: "MEAL", label: "Meal" },
  { value: "ADDON", label: "Addon" },
];

const sizesList = ["small", "medium", "large"] as const;

const AddMenuModal: React.FC<AddMenuModalProps> = ({ open, onClose, onNext }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");
  const [menuType, setMenuType] = useState("COFFEE");
  const [sizes, setSizes] = useState({ small: true, medium: false, large: false });
  const [addonPrice, setAddonPrice] = useState("");

  const [cups, setCups] = useState<Record<typeof sizesList[number], MenuCup>>({
    small: { price: "" },
    medium: { price: "" },
    large: { price: "" },
  });

  const [ingredients, setIngredients] = useState<Record<typeof sizesList[number], MenuIngredient[]>>({
    small: [],
    medium: [],
    large: [],
  });

  const [ingredientOptions, setIngredientOptions] = useState<{ id: number; name: string; unit?: string }[]>([]);
  

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    setImagePreview(null);
    setName("");
    setCategory("");
    setStatus("AVAILABLE");
    setMenuType("COFFEE");
    setSizes({ small: true, medium: false, large: false });
    setCups({ small: { price: "" }, medium: { price: "" }, large: { price: "" } });
    setIngredients({ small: [], medium: [], large: [] });
    setAddonPrice("");
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  // Load inventory options when opening
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const ingsRes = await fetch("/api/admin/inventory/ingredients");
        const ings = ingsRes.ok ? await ingsRes.json() : [];
        setIngredientOptions(
          Array.isArray(ings)
            ? ings.map((i: any) => ({ id: i.id, name: i.name, unit: i.units?.name }))
            : []
        );
      } catch (e) {
        setIngredientOptions([]);
      }
    })();
  }, [open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSizeChange = (size: keyof typeof sizes) => {
    setSizes(prev => ({ ...prev, [size]: !prev[size] }));
  };

  const handleAddIngredient = (size: typeof sizesList[number]) => {
    setIngredients(prev => ({
      ...prev,
      [size]: [...prev[size], { id: `ing-${Date.now()}`, ingredientId: "", quantity: "" }],
    }));
  };

  const handleIngredientChange = (
    size: typeof sizesList[number],
    index: number,
    field: "ingredientId" | "quantity",
    value: string
  ) => {
    setIngredients(prev => ({
      ...prev,
      [size]: prev[size].map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    }));
  };

  const handleCupChange = (size: typeof sizesList[number], value: string) => {
    setCups(prev => ({
      ...prev,
      [size]: { ...prev[size], price: value },
    }));
  };

  const SizeSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[#B0A695]/10 mt-4 p-4 border border-[#B0A695]/30 rounded-lg">
      <h4 className="mb-3 font-semibold text-[#776B5D]">{title}</h4>
      {children}
    </div>
  );

  const handleSubmit = async () => {
    try {
      // Build payload to match backend MenuInput
      const payload = {
        name,
        image: imagePreview || "",
        type: menuType as "COFFEE" | "NON_COFFEE" | "MEAL" | "ADDON", // FIX: send exact enum value
        status,
        category,
        sizes:
          menuType === "ADDON"
            ? [
                {
                  label: "Single",
                  price: parseFloat(addonPrice || "0"),
                  ingredients: [],
                },
              ]
            : sizesList
                .filter(size => sizes[size])
                .map(size => ({
                  label: size.charAt(0).toUpperCase() + size.slice(1),
                  price: parseFloat(cups[size].price || "0"),
                  ingredients: ingredients[size]
                    .filter(ing => ing.ingredientId && ing.quantity)
                    .map(ing => ({
                      ingredientId: Number(ing.ingredientId),
                      qtyNeeded: parseFloat(ing.quantity),
                    })),
                })),
      };

      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to create menu");
      }

      onNext();
      onClose();
    } catch (err: any) {
      console.error(err);
      (window as any).toast?.error?.(`Error creating menu: ${err.message}`);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button onClick={handleSubmit}>Save</Button>
    </>
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Menu / Addon" size="lg" footer={footer}>
      <div className="space-y-6">
        {/* Image Upload */}
        <div className="flex justify-center items-center">
          <label htmlFor="image-upload" className="w-40 h-40 cursor-pointer">
            <div className="flex flex-col justify-center items-center hover:bg-[#B0A695]/10 border-[#B0A695] border-2 hover:border-[#776B5D] border-dashed rounded-full w-full h-full text-[#776B5D]/60 transition-colors">
              {imagePreview ? (
                <img src={imagePreview} alt="Menu" className="rounded-full w-full h-full object-cover" />
              ) : (
                <>
                  <UploadCloud size={40} />
                  <span className="mt-2 text-sm text-center">Upload Image</span>
                </>
              )}
            </div>
          </label>
          <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
        </div>

        {/* Name & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Name" required>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Menu Name" />
          </FormField>
          <FormField label="Type" required>
            <Select value={menuType} onChange={e => setMenuType(e.target.value)} options={menuTypes} />
          </FormField>
        </div>

        {/* Price/Sizes & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            {menuType === "ADDON" ? (
              <>
                <label className="block mb-2 font-medium text-[#776B5D] text-sm">Price</label>
                <Input value={addonPrice} onChange={e => setAddonPrice(e.target.value)} placeholder="Price" />
              </>
            ) : (
              <>
                <label className="block mb-2 font-medium text-[#776B5D] text-sm">Sizes</label>
                <div className="flex gap-4">
                  {sizesList.map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sizes[s]}
                        onChange={() => handleSizeChange(s)}
                        className="rounded focus:ring-[#776B5D] w-4 h-4 text-[#776B5D]"
                      />
                      <span className="capitalize text-[#776B5D]">{s}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label className="block mb-2 font-medium text-[#776B5D] text-sm">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={status === "AVAILABLE"}
                  onChange={() => setStatus("AVAILABLE")}
                  className="rounded w-4 h-4 text-[#776B5D]"
                />
                <span className="text-[#776B5D]">Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={status === "UNAVAILABLE"}
                  onChange={() => setStatus("UNAVAILABLE")}
                  className="rounded w-4 h-4 text-[#776B5D]"
                />
                <span className="text-[#776B5D]">Unavailable</span>
              </label>
            </div>
          </div>
        </div>

        {/* Cups & Ingredients Sections (hidden for ADDON) */}
        {menuType !== "ADDON" &&
          sizesList.map(size => {
            if (!sizes[size]) return null;
            return (
              <SizeSection key={size} title={size.charAt(0).toUpperCase() + size.slice(1)}>
                {/* Cups */}
                <div className="gap-4 grid grid-cols-2 mb-4">
                  <Input
                    value={cups[size].price}
                    onChange={e => handleCupChange(size, e.target.value)}
                    placeholder="Price"
                  />
                </div>

                {/* Ingredients */}
                {ingredients[size].map((ing, i) => (
                  <div key={ing.id} className="gap-4 grid grid-cols-2 mb-2">
                    <select
                      value={ing.ingredientId}
                      onChange={e => handleIngredientChange(size, i, "ingredientId", e.target.value)}
                      className="w-full px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D]"
                    >
                      <option value="">Select Ingredient</option>
                      {ingredientOptions.map(opt => (
                        <option key={opt.id} value={String(opt.id)}>
                          {opt.name}{opt.unit ? ` (${opt.unit})` : ""}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={ing.quantity}
                      onChange={e => handleIngredientChange(size, i, "quantity", e.target.value)}
                      placeholder="Quantity"
                    />
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={() => handleAddIngredient(size)} className="mt-2">
                  <Plus size={16} /> Add Ingredient
                </Button>
              </SizeSection>
            );
          })}
      </div>
    </Modal>
  );
};

export default AddMenuModal;
