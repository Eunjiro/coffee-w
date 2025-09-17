'use client';

import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, Plus } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import FormField, { Input, Select } from "../ui/FormField";

export type Ingredient = {
    id: string;
    ingredientId: number;
    quantity: string;
};

export type CupSelection = {
    cupId: number | null;
    price: string;
};

export interface MenuItem {
    id: number;
    name: string;
    image?: string;
    type: "COFFEE" | "NON-COFFEE" | "MEAL" | "ADDON";
    status: "AVAILABLE" | "UNAVAILABLE" | "HIDDEN";
    sizes: {
        id: number;
        label: string;
        price: number;
        cupId?: number | null;
    }[];
    ingredients: {
        small: { ingredientId: number; quantity: number }[];
        medium: { ingredientId: number; quantity: number }[];
        large: { ingredientId: number; quantity: number }[];
    };
}

interface Cup {
    id: number;
    name: string;
}

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
}

interface EditMenuModalProps {
    open: boolean;
    item: MenuItem | null;
    cups: Cup[];
    ingredients: IngredientOption[];
    onClose: () => void;
    onSave: (updated: MenuItem) => void;
    onDelete?: (id: number) => void;
}

const EditMenuModal: React.FC<EditMenuModalProps> = ({ open, item, cups, ingredients, onClose, onSave, onDelete }) => {
    const [form, setForm] = useState<MenuItem | null>(item);
    const [imagePreview, setImagePreview] = useState<string | null>(item?.image || null);
    const [addonPrice, setAddonPrice] = useState<string>(item?.type === 'ADDON' ? String(item?.sizes?.[0]?.price ?? 0) : "");
    const formRef = useRef<HTMLFormElement | null>(null);

    const [sizesState, setSizesState] = useState<{ [key: string]: boolean }>({ small: true, medium: false, large: false });

    const [cupSelections, setCupSelections] = useState<{ [key: string]: CupSelection }>({
        small: { cupId: null, price: "" },
        medium: { cupId: null, price: "" },
        large: { cupId: null, price: "" }
    });

    const [ingredientsState, setIngredientsState] = useState<{ [key: string]: Ingredient[] }>({
        small: [],
        medium: [],
        large: []
    });

    // Populate form when item changes
    useEffect(() => {
        if (!item) return;
        setForm(item);
        setImagePreview(item.image || null);
        setAddonPrice(item.type === 'ADDON' ? String(item.sizes?.[0]?.price ?? 0) : "");

        // Set sizes availability
        setSizesState({
            small: item.sizes.some(s => s.label.toLowerCase() === "small"),
            medium: item.sizes.some(s => s.label.toLowerCase() === "medium"),
            large: item.sizes.some(s => s.label.toLowerCase() === "large")
        });

        // Set cups and prices
        const cupMap: { [key: string]: CupSelection } = { small: { cupId: null, price: "" }, medium: { cupId: null, price: "" }, large: { cupId: null, price: "" } };
        item.sizes.forEach(s => {
            const sizeKey = s.label.toLowerCase();
            cupMap[sizeKey] = { cupId: s.cupId || null, price: s.price.toString() };
        });
        setCupSelections(cupMap);

        // Set ingredients
        setIngredientsState({
            small: item.ingredients.small.map((ing, i) => ({ id: `small-${i}`, ingredientId: ing.ingredientId, quantity: ing.quantity.toString() })),
            medium: item.ingredients.medium.map((ing, i) => ({ id: `medium-${i}`, ingredientId: ing.ingredientId, quantity: ing.quantity.toString() })),
            large: item.ingredients.large.map((ing, i) => ({ id: `large-${i}`, ingredientId: ing.ingredientId, quantity: ing.quantity.toString() }))
        });
    }, [item]);

    if (!open || !form) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleCupChange = (size: "small" | "medium" | "large", field: "cupId" | "price", value: string) => {
        setCupSelections(prev => ({ ...prev, [size]: { ...prev[size], [field]: field === "cupId" ? Number(value) : value } }));
    };

    const handleIngredientChange = (size: "small" | "medium" | "large", index: number, field: "ingredientId" | "quantity", value: string) => {
        setIngredientsState(prev => ({
            ...prev,
            [size]: prev[size].map((ing, i) => (i === index ? { ...ing, [field]: field === "ingredientId" ? Number(value) : value } : ing))
        }));
    };

    const handleAddIngredient = (size: "small" | "medium" | "large") => {
        const newIng: Ingredient = { id: `${size}-${Date.now()}`, ingredientId: 0, quantity: "" };
        setIngredientsState(prev => ({ ...prev, [size]: [...prev[size], newIng] }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const url = URL.createObjectURL(e.target.files[0]);
        setImagePreview(url);
        setForm(prev => prev ? { ...prev, image: url } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;

        const isAddon = form.type === 'ADDON';

        const updatedForm: MenuItem = isAddon
            ? {
                ...form,
                sizes: [
                    {
                        id: form.sizes?.[0]?.id || 0,
                        label: 'Single',
                        price: parseFloat(addonPrice) || 0,
                        cupId: null,
                    },
                ],
                ingredients: { small: [], medium: [], large: [] },
            }
            : {
                ...form,
                sizes: ["small", "medium", "large"]
                    .filter(size => sizesState[size])
                    .map(size => ({
                        id: form.sizes.find(s => s.label.toLowerCase() === size)?.id || 0,
                        label: size,
                        price: parseFloat(cupSelections[size].price) || 0,
                        cupId: cupSelections[size].cupId || null,
                    })),
                ingredients: {
                    small: ingredientsState.small.map(i => ({
                        ingredientId: i.ingredientId,
                        quantity: parseFloat(i.quantity) || 0,
                    })),
                    medium: ingredientsState.medium.map(i => ({
                        ingredientId: i.ingredientId,
                        quantity: parseFloat(i.quantity) || 0,
                    })),
                    large: ingredientsState.large.map(i => ({
                        ingredientId: i.ingredientId,
                        quantity: parseFloat(i.quantity) || 0,
                    })),
                },
            };

        onSave(updatedForm);
        onClose();
    };


    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-[#B0A695]/10 mt-4 p-4 border border-[#B0A695]/30 rounded-lg">
            <h4 className="mb-3 font-semibold text-[#776B5D]">{title}</h4>
            {children}
        </div>
    );

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            {onDelete && (
                <Button
                    variant="danger"
                    onClick={() => {
                        onDelete(form.id);
                        onClose();
                    }}
                >
                    Delete
                </Button>
            )}
            <Button type="button" onClick={() => formRef.current?.requestSubmit()}>Save</Button>
        </>
    );

    return (
        <Modal isOpen={open} onClose={onClose} title="Edit Menu" size="lg" footer={footer}>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

                {/* Image Upload */}
                <div className="flex justify-center items-center">
                    <label htmlFor="edit-image-upload" className="w-40 h-40 cursor-pointer">
                        <div className="flex flex-col justify-center items-center hover:bg-[#B0A695]/10 border-[#B0A695] border-2 hover:border-[#776B5D] border-dashed rounded-full w-full h-full text-[#776B5D]/60 transition-colors">
                            {imagePreview ? <img src={imagePreview} alt="Menu" className="rounded-full w-full h-full object-cover" /> : <>
                                <UploadCloud size={40} />
                                <span className="mt-2 text-sm text-center">Upload Image</span>
                            </>}
                        </div>
                    </label>
                    <input id="edit-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>

                {/* Name and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Name" required>
                        <Input
                            type="text"
                            value={form.name}
                            onChange={e => setForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                            placeholder="Menu name"
                        />

                    </FormField>
                    <FormField label="Type" required>
                        <Select
                            value={form.type}
                            onChange={e => setForm(prev => prev ? { ...prev, type: e.target.value as MenuItem['type'] } : null)}
                            options={[
                                { label: "Coffee", value: "COFFEE" },
                                { label: "Non-Coffee", value: "NON_COFFEE" },
                                { label: "Meal", value: "MEAL" },
                                { label: "Addon", value: "ADDON" }
                            ]}
                        />

                    </FormField>
                </div>

                {/* Status */}
                <Section title="Status">
                    {["AVAILABLE", "UNAVAILABLE", "HIDDEN"].map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer mr-4">
                            <input type="radio" name="status" value={status} checked={form.status === status} onChange={handleChange} className="rounded w-4 h-4 text-[#776B5D]" />
                            <span className="text-[#776B5D]">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                        </label>
                    ))}
                </Section>

                {/* Sizes at Cups / addon price */}
                {form.type === 'ADDON' ? (
                    <Section title="Price">
                        <Input type="number" value={addonPrice} onChange={e => setAddonPrice(e.target.value)} placeholder="Price" />
                    </Section>
                ) : (
                    <Section title="Cups & Prices">
                        {["small", "medium", "large"].map(size => (sizesState as any)[size] && (
                            <Section key={size} title={(size as string).charAt(0).toUpperCase() + (size as string).slice(1)}>
                                <div className="grid grid-cols-2 gap-4">
                                    <select value={(cupSelections as any)[size].cupId || ""} onChange={e => handleCupChange(size as any, "cupId", e.target.value)} className="w-full px-3 py-2 border border-[#B0A695] rounded-lg">
                                        <option value="">Select Cup</option>
                                        {cups.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <Input type="number" value={(cupSelections as any)[size].price} onChange={e => handleCupChange(size as any, "price", e.target.value)} placeholder="Price" />
                                </div>
                            </Section>
                        ))}
                    </Section>
                )}

                {/* Ingredients */}
                {form.type !== 'ADDON' && (
                    <Section title="Ingredients">
                        {["small", "medium", "large"].map(size => (sizesState as any)[size] && (
                            <Section key={size} title={(size as string).charAt(0).toUpperCase() + (size as string).slice(1)}>
                                {(ingredientsState as any)[size].map((ing: any, i: number) => (
                                    <div key={ing.id} className="grid grid-cols-2 gap-4 mb-2">
                                        <select value={ing.ingredientId} onChange={e => handleIngredientChange(size as any, i, "ingredientId", e.target.value)} className="w-full px-3 py-2 border border-[#B0A695] rounded-lg">
                                            <option value="">Select Ingredient</option>
                                            {ingredients.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                                        </select>
                                        <Input type="text" value={ing.quantity} onChange={e => handleIngredientChange(size as any, i, "quantity", (e.target as any).value)} placeholder="Quantity" />
                                    </div>
                                ))}
                                <button type="button" onClick={() => handleAddIngredient(size as any)} className="flex items-center gap-1 mt-2 text-sm text-[#776B5D] hover:text-[#776B5D]/80">
                                    <Plus size={16} /> Add Ingredient
                                </button>
                            </Section>
                        ))}
                    </Section>
                )}

            </form>
        </Modal>
    );
};

export default EditMenuModal;
