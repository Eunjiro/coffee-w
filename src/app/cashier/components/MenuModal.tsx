"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import Modal from "@/app/admin/components/ui/Modal";
import Button from "@/app/admin/components/ui/Button";
import { MenuItem, CartItem, Size, Addon } from "@/types/types";
import Image from "next/image";

interface MenuModalProps {
    item: MenuItem;
    open: boolean;
    onClose: () => void;
    onAddToOrder: (cartItem: CartItem) => void;
}

interface ToastWindow extends Window {
    toast?: {
        error?: (msg: string) => void;
    }
}

const MenuModal: React.FC<MenuModalProps> = ({ item, open, onClose, onAddToOrder }) => {
    const [selectedSize, setSelectedSize] = useState<Size | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
    const [quantity, setQuantity] = useState<number>(1);
    const [addonData, setAddonData] = useState<MenuItem[]>([]);

    // Initialize selected size when item changes
    useEffect(() => {
        if (item && item.sizes && item.sizes.length > 0) {
            setSelectedSize(item.sizes[0]);
        }
    }, [item]);

    // Load addon data on component mount
    useEffect(() => {
        const loadAddonData = async () => {
            try {
                const response = await fetch("/api/cashier/addons");
                const data: MenuItem[] = await response.json();
                console.log('Loaded addon data:', data);
                setAddonData(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error loading addon data:', error);
                setAddonData([]);
            }
        };
        loadAddonData();
    }, []);

    const total = useMemo(() => {
        if (!selectedSize) return 0;

        const basePrice = Number(selectedSize.price) || 0;
        const addonsTotal = selectedAddons.reduce((sum, addon) => {
            const addonPrice = Number(addon.price) || 0;
            return sum + addonPrice;
        }, 0);
        return (basePrice + addonsTotal) * quantity;
    }, [selectedSize, selectedAddons, quantity]);

    const formatPrice = (price: number) => `₱${price.toFixed(2)}`;

    const handleAddonToggle = (addon: Addon) => {
        setSelectedAddons(prev => {
            const isSelected = prev.some(a => a.id === addon.id);
            if (isSelected) {
                return prev.filter(a => a.id !== addon.id);
            } else {
                return [...prev, addon];
            }
        });
    };

    const isOrderable = item.status === "Available";

    const handleAddToOrder = () => {
        if (!selectedSize) return;

        const cartKey = `${item.id}-${selectedSize.id}-${selectedAddons.map(a => a.id).join(',')}`;

        // Calculate unit price (base price + addon prices)
        const basePrice = Number(selectedSize.price) || 0;
        const addonPrice = selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
        const unitPrice = basePrice + addonPrice;

        // Validate the cart item before adding
        if (isNaN(unitPrice) || unitPrice <= 0) {
            console.error('Invalid cart item price:', { basePrice, addonPrice, unitPrice, selectedSize, selectedAddons });
            (window as ToastWindow).toast?.error?.('Error: Invalid price calculation.');
            return;
        }

        const cartItem: CartItem = {
            id: item.id,
            cartKey,
            name: item.name,
            image: item.image || "",
            price: unitPrice, // Store unit price
            quantity,
            selectedSize,
            selectedAddons,
        };

        console.log('Adding cart item:', cartItem);
        onAddToOrder(cartItem);
        onClose();
    };

    const footer = !isOrderable ? (
        <div className="bg-[#B0A695]/20 py-3 rounded-lg w-full font-bold text-[#776B5D]/50 text-center">
            Currently Unavailable
        </div>
    ) : (
        <div className="flex justify-between items-center gap-4 w-full">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                >
                    <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 font-bold text-[#776B5D] text-lg text-center">{quantity}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(q => q + 1)}
                    aria-label="Increase quantity"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            {/* Action Button */}
            <Button
                onClick={handleAddToOrder}
                className="flex-1 sm:flex-none"
                disabled={!selectedSize}
            >
                Add to Order • {formatPrice(total)}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={item.name}
            size="md"
            footer={footer}
            className="h-[95vh] max-h-[700px]"
        >
            {/* Image Banner */}
            <div className="relative mb-6 w-full h-48">
                <Image
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    fill
                    className="rounded-lg object-cover"
                />
            </div>

            <div className="space-y-6">
                <p className="text-[#776B5D] text-sm capitalize">{item.type.replace("_", " ").toLowerCase()}</p>

                {/* Drink Size Options */}
                <div>
                    <h3 className="mb-3 font-semibold text-[#776B5D]">Size</h3>
                    <div className="flex gap-2">
                        {item.sizes.map((size) => (
                            <Button
                                key={size.id}
                                variant={selectedSize?.id === size.id ? "primary" : "secondary"}
                                onClick={() => setSelectedSize(size)}
                                className="flex-1"
                            >
                                {size.label} <span className="ml-1 font-semibold">{formatPrice(size.price)}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Add-Ons Options */}
                {addonData.length > 0 && (
                    <div>
                        <h3 className="mb-3 font-semibold text-[#776B5D]">Add-Ons</h3>
                        <div className="space-y-3">
                            {addonData.map(addon => (
                                <Button
                                    key={addon.id}
                                    variant={selectedAddons.some(a => a.id === addon.id) ? "primary" : "secondary"}
                                    onClick={() => {
                                        const addonPrice = addon.sizes && addon.sizes.length > 0
                                            ? Number(addon.sizes[0].price) || 0
                                            : 0;
                                        handleAddonToggle({
                                            id: addon.id,
                                            name: addon.name,
                                            price: addonPrice
                                        });
                                    }}
                                    className="!flex !justify-between !items-start w-full"
                                >
                                    <div className="flex flex-col items-start">
                                        <span>{addon.name}</span>
                                        {addon.description && (
                                            <span className="opacity-75 mt-1 text-xs">{addon.description}</span>
                                        )}
                                    </div>
                                    <span className="font-semibold">+ {formatPrice(addon.sizes && addon.sizes.length > 0 ? Number(addon.sizes[0].price) || 0 : 0)}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default MenuModal;
