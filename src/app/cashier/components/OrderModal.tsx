'use client'

import { useState } from "react";
import { MenuItem, CartItem, Size } from "@/types/types";
import Image from "next/image";

interface OrderModalProps {
    item: MenuItem;
    onClose: () => void;
    onAddToCart: (cartItem: CartItem) => void;
}

export default function OrderModal({ item, onClose, onAddToCart }: OrderModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<Size | undefined>(item.sizes[0]);

    const unitPrice = selectedSize?.price || 0;
    const totalPrice = unitPrice * quantity;

    const handleAdd = () => {
        if (!selectedSize) return;

        const cartKey = `${item.id}-${selectedSize.id}`;

        const cartItem: CartItem = {
            id: item.id,
            cartKey,
            name: item.name,
            image: item.image || "",
            price: unitPrice, // store unit price only
            quantity,
            selectedSize,
            selectedAddons: [], // if you want to add addons later, handle separately
        };

        onAddToCart(cartItem);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[#F3EEEA] w-[575px] max-h-[90vh] rounded-xl shadow-lg flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#B0A695] p-4">
                    <h2 className="text-2xl font-normal text-[#776B5D] mx-auto">Order</h2>
                    <button
                        className="w-10 h-10 bg-[#776B5D] rounded-full flex items-center justify-center text-white"
                        onClick={onClose}
                    >
                        <span className="text-2xl font-bold">×</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                    {/* Item Preview */}
                    <div className="flex gap-4 border-b border-[#B0A695] pb-4">
                        <div className="w-40 h-40 bg-white rounded flex items-center justify-center overflow-hidden">
                            {item.image ? (
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover rounded"
                                />
                            ) : (
                                <span className="text-gray-400">No Image</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <h3 className="text-2xl text-[#776B5D]">{item.name}</h3>
                            {item.type && <p className="text-lg text-[#776B5D]">{item.type}</p>}
                            {item.description && <p className="text-base text-[#776B5D]">{item.description}</p>}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div className="flex flex-col gap-2 border-b border-[#776B5D] pb-4">
                        <span className="text-base text-[#776B5D]">Drink Size</span>
                        <div className="flex gap-2 flex-wrap">
                            {item.sizes.map(size => (
                                <button
                                    key={size.id}
                                    className={`px-3 py-2 rounded border ${selectedSize?.id === size.id
                                            ? "bg-[#776B5D] text-white"
                                            : "bg-white border-[#B0A695] text-[#776B5D]"
                                        }`}
                                    onClick={() => setSelectedSize(size)}
                                >
                                    {size.label} ₱{size.price}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex justify-center items-center gap-4">
                        <button
                            className="w-10 h-10 border rounded-full flex items-center justify-center text-[#776B5D]"
                            onClick={() => setQuantity(prev => Math.max(prev - 1, 1))}
                        >
                            -
                        </button>
                        <span className="text-xl">{quantity}</span>
                        <button
                            className="w-10 h-10 bg-[#B0A695] rounded-full flex items-center justify-center text-white"
                            onClick={() => setQuantity(prev => prev + 1)}
                        >
                            +
                        </button>
                    </div>

                    {/* Total */}
                    <div className="text-right text-xl font-semibold text-[#776B5D]">
                        Total: ₱{totalPrice.toFixed(2)}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 p-4 border-t border-[#B0A695]">
                    <button className="px-4 py-2 bg-white text-[#776B5D] rounded" onClick={onClose}>
                        Close
                    </button>
                    <button className="px-4 py-2 bg-[#776B5D] text-white rounded" onClick={handleAdd}>
                        Add to Order
                    </button>
                </div>
            </div>
        </div>
    );
}
