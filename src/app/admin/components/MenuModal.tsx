"use client";

import { useState, useRef } from "react";

interface Ingredient {
    id?: number;         
    ingredientId?: number; 
    name: string;         
    qtyNeeded: number;
}

interface Size {
    id?: number;
    label: string;
    price: number;
    ingredients: Ingredient[];
}

interface MenuForm {
    name: string;
    image: string;
    type: string;
    status: string;
    sizes: Size[];
}

interface MenuItem {
    id: number;
    name: string;
    image: string;
    type: string;
    status: string;
    sizes: Size[];
}

interface MenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    form: MenuForm;
    setForm: (form: MenuForm) => void;
    editing: MenuItem | null;
}

export default function MenuModal({
    isOpen,
    onClose,
    onSubmit,
    form,
    setForm,
    editing,
}: MenuModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    /** IMAGE UPLOAD **/
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return (window as any).toast?.error?.("Please select an image file");
        if (file.size > 5 * 1024 * 1024) return (window as any).toast?.error?.("Max size 5MB");

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setForm({ ...form, image: event.target.result as string });
            }
            setIsUploading(false);
        };
        reader.onerror = () => setIsUploading(false);
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => fileInputRef.current?.click();
    const removeImage = () => {
        setForm({ ...form, image: "" });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const updateSize = (sizeIdx: number, key: keyof Size, value: string | number) => {
        const newSizes = [...form.sizes];
        if (key === "price") newSizes[sizeIdx].price = Number(value) || 0;
        else (newSizes[sizeIdx] as any)[key] = value;
        setForm({ ...form, sizes: newSizes });
    };

    const updateIngredientQty = (sizeIdx: number, ingIdx: number, value: number) => {
        const newSizes = [...form.sizes];
        newSizes[sizeIdx].ingredients[ingIdx].qtyNeeded = value;
        setForm({ ...form, sizes: newSizes });
    };

    const addIngredient = (sizeIdx: number) => {
        const newSizes = [...form.sizes];
        newSizes[sizeIdx].ingredients.push({ name: "", qtyNeeded: 0 });
        setForm({ ...form, sizes: newSizes });
    };

    const removeIngredient = (sizeIdx: number, ingIdx: number) => {
        const newSizes = [...form.sizes];
        newSizes[sizeIdx].ingredients.splice(ingIdx, 1);
        setForm({ ...form, sizes: newSizes });
    };

    const toggleSize = (sizeLabel: string) => {
        const existingIndex = form.sizes.findIndex((s) => s.label === sizeLabel);
        let newSizes = [...form.sizes];
        if (existingIndex >= 0) {
            newSizes.splice(existingIndex, 1);
        } else {
            newSizes.push({ label: sizeLabel, price: 0, ingredients: [] });
        }
        setForm({ ...form, sizes: newSizes });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...form,
            sizes: form.sizes.map((size) => ({
                label: size.label,
                price: size.price,
                ingredients: size.ingredients.map((ing) => ({
                    ingredientId: ing.id ?? ing.ingredientId, // ensure backend gets ingredientId
                    qtyNeeded: ing.qtyNeeded,
                })),
            })),
        };

        // call external onSubmit kapag provided
        if (onSubmit) await onSubmit(e);

        // await fetch("/api/admin/menu", {
        //   method: editing ? "PUT" : "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(payload),
        // });

        onClose(); // close modal after submit
    };


    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4 overflow-hidden">
            <div className="bg-[#F3EEEA] rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto flex flex-col p-4 scrollbar-hide shadow-xl">

                {/* HEADER */}
                <div className="flex justify-between items-center pb-3 border-b border-[#B0A695]">
                    <h2 className="text-lg md:text-xl text-[#776B5D] font-normal">
                        {editing ? "Edit Menu" : "Add Menu"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 md:w-8 md:h-8 bg-[#776B5D] rounded-full flex items-center justify-center hover:bg-[#675D4F]"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* IMAGE UPLOAD */}
                <div className="py-3 flex justify-center">
                    <div className="relative">
                        <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-dashed border-[#B0A695]">
                            {form.image ? (
                                <>
                                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={removeImage}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <span className="text-[#776B5D] text-xs md:text-sm">No image</span>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#776B5D]"></div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={triggerFileInput}
                            className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 bg-white border-4 border-[#F3EEEA] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="black" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="flex flex-col space-y-3">

                    {/* Name & Type */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <label className="text-[#776B5D] text-sm mb-1 block">Name</label>
                            <input
                                type="text"
                                placeholder="Coffee"
                                className="w-full p-2 text-sm bg-white border border-[#B0A695] rounded-lg"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex-1">
                            <label className="text-[#776B5D] text-sm mb-1 block">Category</label>
                            <select
                                className="w-full p-2 text-sm bg-white border border-[#B0A695] rounded-lg"
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value.toUpperCase() })}
                            >
                                <option value="COFFEE">Coffee</option>
                                <option value="NON_COFFEE">Non-Coffee</option>
                                <option value="MEAL">Meal</option>
                                <option value="ADDON">Addon</option>
                            </select>

                        </div>
                    </div>

                    {/* Status & Sizes */}
                    <div className="flex flex-col md:flex-row gap-3 pb-3 border-b border-[#B0A695]">
                        <div className="flex-1">
                            <label className="text-[#776B5D] text-sm mb-1 block">Sizes</label>
                            <div className="flex flex-wrap gap-2">
                                {["S", "M", "L"].map((size) => (
                                    <div key={size} className="flex items-center gap-1">
                                        <div
                                            className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors ${form.sizes.some((s) => s.label === size)
                                                ? "bg-[#776B5D]"
                                                : "border border-[#776B5D]"
                                                }`}
                                            onClick={() => toggleSize(size)}
                                        >
                                            {form.sizes.some((s) => s.label === size) && (
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                                    <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-[#776B5D] text-xs md:text-sm">{size}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="text-[#776B5D] text-sm mb-1 block">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {["AVAILABLE", "UNAVAILABLE"].map((status) => (
                                    <div key={status} className="flex items-center gap-1">
                                        <div
                                            className={`w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-colors ${form.status === status ? "bg-[#776B5D]" : "border border-[#776B5D]"
                                                }`}
                                            onClick={() => setForm({ ...form, status })}
                                        >
                                            {form.status === status && (
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                                    <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-[#776B5D] text-xs md:text-sm">{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Size Prices & Ingredients */}
                    <div className="pb-3 border-b border-[#B0A695]">
                        <h3 className="text-lg md:text-xl text-[#776B5D] text-center mb-3">Ingredients</h3>

                        {form.sizes.map((size, sizeIdx) => (
                            <div key={sizeIdx} className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                                {/* Size & Price */}
                                <div className="flex justify-between items-center mb-3 gap-2">
                                    <span className="text-[#776B5D] font-medium">{size.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#776B5D] text-xs md:text-sm">Price:</span>
                                        <input
                                            type="number"
                                            className="w-20 md:w-28 p-2 text-sm border border-[#B0A695] rounded-lg"
                                            value={size.price}
                                            onChange={(e) => updateSize(sizeIdx, "price", e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Ingredients */}
                                {size.ingredients.map((ing, ingIdx) => (
                                    <div key={ingIdx} className="flex gap-2 items-center mb-2">
                                        <input
                                            type="text"
                                            placeholder="Ingredient Name"
                                            className="flex-1 p-2 text-sm border border-[#B0A695] rounded-lg"
                                            value={ing.name}
                                            onChange={(e) => {
                                                const newSizes = [...form.sizes];
                                                newSizes[sizeIdx].ingredients[ingIdx].name = e.target.value;
                                                setForm({ ...form, sizes: newSizes });
                                            }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            className="w-20 p-2 text-sm border border-[#B0A695] rounded-lg"
                                            value={ing.qtyNeeded}
                                            onChange={(e) => updateIngredientQty(sizeIdx, ingIdx, Number(e.target.value))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(sizeIdx, ingIdx)}
                                            className="px-2 py-1 bg-red-500 text-white rounded"
                                        >
                                            X
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => addIngredient(sizeIdx)}
                                    className="flex items-center gap-1 text-[#776B5D] hover:text-[#675D4F] transition-colors text-xs md:text-sm"
                                >
                                    + Add Ingredient
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col-reverse md:flex-row justify-end gap-2 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 text-sm bg-white text-[#776B5D] rounded-lg border border-[#B0A695] hover:bg-gray-50"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            className="px-3 py-2 text-sm bg-[#776B5D] text-[#F3EEEA] rounded-lg hover:bg-[#675D4F]"
                        >
                            {editing ? "Update Menu" : "Add Menu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
