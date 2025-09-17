import React, { useState, useEffect, useCallback } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import FormField, { Input, Select } from "../ui/FormField";
import { Plus, UploadCloud } from "lucide-react";

interface AddAddonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const sizesList = ["small", "medium", "large"] as const;

const AddAddonModal: React.FC<AddAddonModalProps> = ({ open, onClose, onConfirm }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [qtyPerPack, setQtyPerPack] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]); // Selected ingredients
  const [ingredientsList, setIngredientsList] = useState<any[]>([]); // All ingredients list
  const [error, setError] = useState<string | null>(null);

  const [sizes, setSizes] = useState({ small: true, medium: false, large: false });
  const [ingredients, setIngredients] = useState<Record<typeof sizesList[number], { ingredientId: string; quantity: string }[]>>({
    small: [],
    medium: [],
    large: [],
  });

  const [ingredientOptions, setIngredientOptions] = useState<{ id: number; name: string }[]>([]);

  const resetForm = useCallback(() => {
    setImagePreview(null);
    setName("");
    setCategory("");
    setPrice("");
    setQtyPerPack("");
    setPackagePrice("");
    setSizes({ small: true, medium: false, large: false });
    setIngredients({ small: [], medium: [], large: [] });
    setSelectedIngredients([]);
  }, []);

  useEffect(() => {
    if (open) {
      resetForm();
      const loadIngredients = async () => {
        try {
          const response = await fetch("/api/admin/inventory/ingredients");
          const data = await response.json();
          setIngredientOptions(data);
        } catch (error) {
          console.error("Error fetching ingredients:", error);
        }
      };
      loadIngredients();
    }
  }, [open, resetForm]);

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
      [size]: [
        ...prev[size],
        { ingredientId: "", quantity: "" },
      ],
    }));
  };

  const handleIngredientChange = (size: typeof sizesList[number], index: number, field: "ingredientId" | "quantity", value: string) => {
    setIngredients(prev => ({
      ...prev,
      [size]: prev[size].map((ingredient, i) => (i === index ? { ...ingredient, [field]: value } : ingredient)),
    }));
  };

  const handleSubmit = async () => {
    if (!name || !price || !qtyPerPack || !packagePrice) {
      setError("All fields are required.");
      return;
    }

    if (isNaN(parseFloat(price)) || isNaN(parseFloat(qtyPerPack)) || isNaN(parseFloat(packagePrice))) {
      setError("Price, quantity per pack, and package price must be valid numbers.");
      return;
    }

    const data = {
      name,
      category,
      price,
      qtyPerPack: parseFloat(qtyPerPack),
      packagePrice: parseFloat(packagePrice),
      ingredients: sizesList
        .filter(size => sizes[size])
        .map(size => ({
          size,
          ingredients: ingredients[size].map(ingredient => ({
            ingredientId: ingredient.ingredientId,
            qtyNeeded: parseFloat(ingredient.quantity),
          })),
        })),
    };

    try {
      const response = await fetch("/api/admin/inventory/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        onConfirm(result);
        onClose();
      } else {
        setError(result.message || "Failed to add addon");
      }
    } catch (error) {
      setError("An error occurred while adding the addon");
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button onClick={handleSubmit}>Add Addon</Button>
    </>
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Addon" size="md" footer={footer}>
      <div className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter addon name" />
          </FormField>
          <FormField label="Category" required>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Enter category" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price" required>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" />
          </FormField>
          <FormField label="Quantity per Pack" required>
            <Input value={qtyPerPack} onChange={(e) => setQtyPerPack(e.target.value)} placeholder="ex: 100 ml" type="number" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Package Price" required>
            <Input value={packagePrice} onChange={(e) => setPackagePrice(e.target.value)} placeholder="ex: 1000" type="number" />
          </FormField>
        </div>

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

        {/* Ingredient Selection */}
        {sizesList.map(size => {
          return (
            sizes[size] && (
              <div key={size}>
                <h4 className="mb-2 text-[#776B5D]">Ingredients for {size.charAt(0).toUpperCase() + size.slice(1)}</h4>
                <div className="space-y-2">
                  {ingredients[size].map((ingredient, index) => (
                    <div key={index} className="flex gap-4">
                      <select
                        value={ingredient.ingredientId}
                        onChange={(e) => handleIngredientChange(size, index, "ingredientId", e.target.value)}
                        className="w-full px-3 py-2 border border-[#B0A695] rounded-lg text-[#776B5D]"
                      >
                        <option value="">Select Ingredient</option>
                        {ingredientOptions.map(opt => (
                          <option key={opt.id} value={String(opt.id)}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(size, index, "quantity", e.target.value)}
                        placeholder="Quantity"
                      />
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => handleAddIngredient(size)}>
                    <Plus size={16} /> Add Ingredient
                  </Button>
                </div>
              </div>
            )
          );
        })}
      </div>
    </Modal>
  );
};

export default AddAddonModal;
