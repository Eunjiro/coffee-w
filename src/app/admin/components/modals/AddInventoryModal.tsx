'use client';

import React, { useState, useEffect } from 'react';
import { Package, User, Hash, AlertTriangle, PhilippinePeso } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { Input, Select, Textarea } from '../ui/FormField';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingItem?: Ingredient | null;
}

interface Ingredient {
  id: number;
  name: string;
  category?: string;
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
  id: string | number;
  name: string;
}

interface FormData {
  name: string;
  category: string;
  supplierId: string;
  unitId: string;
  qtyPerPack: string;
  stock: string;
  packagePrice: string;
  threshold: string;
  description: string;
}

interface IngredientPayload {
  id?: number;
  name: string;
  category: string;
  supplierId: number | null;
  unitId: number | null;
  packagePrice: number | null;
  qtyPerPack: number | null;
  stock: number;
  threshold: number;
  description: string | null;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: 'solid',
    supplierId: '',
    unitId: '',
    qtyPerPack: '',
    stock: '0',
    packagePrice: '',
    threshold: '0',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');

  const categories = ['liquid', 'solid', 'powder', 'syrup', 'disposable', 'dairy', 'other'];

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [suppliersRes, unitsRes] = await Promise.all([
            fetch('/api/admin/inventory/suppliers'),
            fetch('/api/admin/inventory/units'),
          ]);
          const [suppliersData, unitsData]: [Supplier[], Unit[]] = await Promise.all([
            suppliersRes.json(),
            unitsRes.json(),
          ]);
          setSuppliers(suppliersData || []);
          setUnits(unitsData || []);
        } catch (error) {
          console.error('Failed to load suppliers/units:', error);
        }
      };
      loadData();
    }
  }, [isOpen]);

  const ensureSupplierId = async (): Promise<number | null> => {
    const trimmed = supplierName.trim();
    if (!trimmed) return formData.supplierId ? Number(formData.supplierId) : null;
    const existing = suppliers.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    try {
      const res = await fetch('/api/admin/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to add supplier');
      const created: Supplier = await res.json();
      setSuppliers(prev => [...prev, created]);
      return created.id;
    } catch (e) {
      console.error(e);
      (window as typeof window & { toast?: { error?: (msg: string) => void } }).toast?.error?.(
        'Failed to add supplier'
      );
      return formData.supplierId ? Number(formData.supplierId) : null;
    }
  };

  const quickAddUnit = async () => {
    const name = newUnitName.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/admin/inventory/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to add unit');
      const created: Unit = await res.json();
      setUnits(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, unitId: String(created.id) }));
      setNewUnitName('');
    } catch (e) {
      console.error(e);
      (window as typeof window & { toast?: { error?: (msg: string) => void } }).toast?.error?.(
        'Failed to add unit'
      );
    }
  };

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category || 'solid',
        supplierId: editingItem.supplierId?.toString() || '',
        unitId: editingItem.unitId?.toString() || '',
        qtyPerPack: editingItem.qtyPerPack?.toString() || '',
        stock: editingItem.stock.toString(),
        packagePrice: editingItem.packagePrice?.toString() || '',
        threshold: editingItem.threshold.toString(),
        description: '',
      });
      const s = suppliers.find(s => s.id === (editingItem.supplierId ?? -1));
      setSupplierName(s?.name || '');
    } else {
      setFormData({
        name: '',
        category: 'solid',
        supplierId: '',
        unitId: '',
        qtyPerPack: '',
        stock: '0',
        packagePrice: '',
        threshold: '0',
        description: '',
      });
      setSupplierName('');
      setNewUnitName('');
    }
    setErrors({});
  }, [editingItem, isOpen, suppliers]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value as string }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.stock.trim()) newErrors.stock = 'Current stock is required';
    else if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0)
      newErrors.stock = 'Current stock must be a valid number';
    if (!formData.threshold.trim()) newErrors.threshold = 'Reorder level is required';
    else if (isNaN(Number(formData.threshold)) || Number(formData.threshold) < 0)
      newErrors.threshold = 'Reorder level must be a valid number';
    if (formData.packagePrice && (isNaN(Number(formData.packagePrice)) || Number(formData.packagePrice) < 0))
      newErrors.packagePrice = 'Package price must be a valid number';
    if (formData.qtyPerPack && (isNaN(Number(formData.qtyPerPack)) || Number(formData.qtyPerPack) < 0))
      newErrors.qtyPerPack = 'Quantity per pack must be a valid number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const supplierIdResolved = await ensureSupplierId();
      const payload: IngredientPayload = {
        id: editingItem?.id,
        name: formData.name,
        category: formData.category,
        supplierId: supplierIdResolved,
        unitId: formData.unitId ? Number(formData.unitId) : null,
        packagePrice: formData.packagePrice ? Number(formData.packagePrice) : null,
        qtyPerPack: formData.qtyPerPack ? Number(formData.qtyPerPack) : null,
        stock: Number(formData.stock),
        threshold: Number(formData.threshold),
        description: formData.description || null,
      };

      const url = '/api/admin/inventory/ingredients';
      const method = editingItem ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save ingredient');
      }

      await response.json();
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      (window as typeof window & { toast?: { error?: (msg: string) => void } }).toast?.error?.(
        `Error: ${error instanceof Error ? error.message : 'Failed to save ingredient'}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Inventory' : 'Add Inventory'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField label="Product Name" required error={errors.name}>
              <Input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Product Name..."
                icon={Package}
                error={!!errors.name}
              />
            </FormField>

            <FormField label="Category" required error={errors.category}>
              <Select
                value={formData.category}
                onChange={e => handleInputChange('category', e.target.value)}
                options={categories.map(cat => ({
                  value: cat,
                  label: cat.charAt(0).toUpperCase() + cat.slice(1),
                }))}
                placeholder="Select Category"
                icon={Package}
                error={!!errors.category}
              />
            </FormField>

            <FormField label="Supplier (Optional)">
              <Input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="Type supplier name"
                icon={User}
              />
            </FormField>

            <FormField label="Unit" error={errors.unitId}>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Select
                    value={formData.unitId}
                    onChange={e => handleInputChange('unitId', e.target.value)}
                    options={[
                      { value: '', label: 'Select Unit (Optional)' },
                      ...units.map(unit => ({ value: unit.id.toString(), label: unit.name })),
                    ]}
                    placeholder="Select Unit"
                    icon={Hash}
                    error={!!errors.unitId}
                  />
                </div>
                <div className="col-span-2 flex gap-2">
                  <Input
                    type="text"
                    value={newUnitName}
                    onChange={e => setNewUnitName(e.target.value)}
                    placeholder="New Unit"
                  />
                  <Button type="button" onClick={quickAddUnit}>
                    Add
                  </Button>
                </div>
              </div>
            </FormField>
          </div>

          <div className="space-y-4">
            <FormField label="Current Stock" required error={errors.stock}>
              <Input
                type="number"
                value={formData.stock}
                onChange={e => handleInputChange('stock', e.target.value)}
                placeholder="Current Stock..."
                icon={Hash}
                error={!!errors.stock}
              />
            </FormField>

            <FormField label="Reorder Level" required error={errors.threshold}>
              <Input
                type="number"
                value={formData.threshold}
                onChange={e => handleInputChange('threshold', e.target.value)}
                placeholder="Low Stock Alert..."
                icon={AlertTriangle}
                error={!!errors.threshold}
              />
            </FormField>

            <FormField label="Package Price" error={errors.packagePrice}>
              <Input
                type="number"
                value={formData.packagePrice}
                onChange={e => handleInputChange('packagePrice', e.target.value)}
                placeholder="ex: 50 (optional)"
                icon={PhilippinePeso}
                error={!!errors.packagePrice}
              />
            </FormField>

            <FormField label="Quantity per Pack" error={errors.qtyPerPack}>
              <Input
                type="number"
                value={formData.qtyPerPack}
                onChange={e => handleInputChange('qtyPerPack', e.target.value)}
                placeholder="ex: 500 (optional)"
                icon={Hash}
                error={!!errors.qtyPerPack}
              />
            </FormField>
          </div>
        </div>

        <FormField label="Description">
          <Textarea
            value={formData.description}
            onChange={e => handleInputChange('description', e.target.value)}
            placeholder="Optional notes or description about the ingredient"
          />
        </FormField>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : editingItem ? 'Update Inventory' : 'Add Inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInventoryModal;
