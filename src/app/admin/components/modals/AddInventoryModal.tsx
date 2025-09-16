import React, { useState, useEffect } from 'react';
import { Package, User, Hash, DollarSign, AlertTriangle, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormField, { Input, Select, Textarea } from '../ui/FormField';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Changed to just refresh callback
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
  id: number;
  name: string;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  console.log('AddInventoryModal rendered with:', { isOpen, editingItem });
  const [formData, setFormData] = useState({
    name: '',
    category: 'solid',
    supplierId: '',
    unitId: '',
    qtyPerPack: '',
    stock: '0',
    packagePrice: '',
    threshold: '0',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = ['liquid', 'solid', 'powder', 'syrup', 'disposable', 'dairy', 'other'];

  // Load suppliers and units when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [suppliersRes, unitsRes] = await Promise.all([
            fetch('/api/admin/inventory/suppliers'),
            fetch('/api/admin/inventory/units'),
          ]);
          const [suppliersData, unitsData] = await Promise.all([
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

  const quickAddSupplier = async () => {
    const name = typeof window !== 'undefined' ? window.prompt('Supplier name:') : null;
    if (!name) return;
    const address = typeof window !== 'undefined' ? window.prompt('Address (optional):') : null;
    try {
      const res = await fetch('/api/admin/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
      if (!res.ok) throw new Error('Failed to add supplier');
      const created = await res.json();
      setSuppliers(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, supplierId: String(created.id) }));
    } catch (e) {
      console.error(e);
      alert('Failed to add supplier');
    }
  };

  const quickAddUnit = async () => {
    const name = typeof window !== 'undefined' ? window.prompt('Unit name (e.g., ml, g):') : null;
    if (!name) return;
    try {
      const res = await fetch('/api/admin/inventory/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to add unit');
      const created = await res.json();
      setUnits(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, unitId: String(created.id) }));
    } catch (e) {
      console.error(e);
      alert('Failed to add unit');
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
      });
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
      });
    }
    setErrors({});
  }, [editingItem, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    console.log('Validating form data:', formData);

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'Current stock is required';
    } else if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = 'Current stock must be a valid number';
    }

    if (!formData.threshold.trim()) {
      newErrors.threshold = 'Reorder level is required';
    } else if (isNaN(Number(formData.threshold)) || Number(formData.threshold) < 0) {
      newErrors.threshold = 'Reorder level must be a valid number';
    }

    // Optional fields validation
    if (formData.packagePrice && (isNaN(Number(formData.packagePrice)) || Number(formData.packagePrice) < 0)) {
      newErrors.packagePrice = 'Package price must be a valid number';
    }

    if (formData.qtyPerPack && (isNaN(Number(formData.qtyPerPack)) || Number(formData.qtyPerPack) < 0)) {
      newErrors.qtyPerPack = 'Quantity per pack must be a valid number';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, proceeding with API call');

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        category: formData.category,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
        unitId: formData.unitId ? Number(formData.unitId) : null,
        packagePrice: formData.packagePrice ? Number(formData.packagePrice) : null,
        qtyPerPack: formData.qtyPerPack ? Number(formData.qtyPerPack) : null,
        stock: Number(formData.stock),
        threshold: Number(formData.threshold),
      };

      const url = editingItem 
        ? '/api/admin/inventory/ingredients' 
        : '/api/admin/inventory/ingredients';
      const method = editingItem ? 'PUT' : 'POST';

      if (editingItem) {
        payload.id = editingItem.id;
      }

      console.log('Sending payload to API:', payload);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to save ingredient');
      }

      const result = await response.json();
      console.log('API success:', result);
      
      onSave(); // Refresh the parent component
      onClose();
    } catch (error) {
      console.error('Error saving ingredient:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save ingredient'}`);
    } finally {
      setLoading(false);
    }
  };

  // Note: submit button must be inside the <form>, so we render actions inside the form instead of Modal footer
  const footer = undefined;

  console.log('Modal render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }
  
  console.log('Modal is open, rendering...');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? 'Edit Ingredient' : 'Add Ingredient'} size="xl" footer={footer}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField label="Product Name" required error={errors.name}>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Product Name..."
                icon={Package}
                error={!!errors.name}
              />
            </FormField>

            <FormField label="Category" required error={errors.category}>
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={categories.map((cat) => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))}
                placeholder="Select Category"
                icon={Package}
                error={!!errors.category}
              />
            </FormField>

            <FormField label="Supplier" error={errors.supplierId}>
              <Select
                value={formData.supplierId}
                onChange={(e) => handleInputChange('supplierId', e.target.value)}
                options={[
                  { value: '', label: 'Select Supplier (Optional)' },
                  ...suppliers.map((supplier) => ({ value: supplier.id.toString(), label: supplier.name }))
                ]}
                placeholder="Select Supplier"
                icon={User}
                error={!!errors.supplierId}
              />
              <div className="mt-2">
                <Button type="button" onClick={quickAddSupplier}>
                  Add Supplier
                </Button>
              </div>
            </FormField>

            <FormField label="Unit" error={errors.unitId}>
              <Select
                value={formData.unitId}
                onChange={(e) => handleInputChange('unitId', e.target.value)}
                options={[
                  { value: '', label: 'Select Unit (Optional)' },
                  ...units.map((unit) => ({ value: unit.id.toString(), label: unit.name }))
                ]}
                placeholder="Select Unit"
                icon={Hash}
                error={!!errors.unitId}
              />
              <div className="mt-2">
                <Button type="button" onClick={quickAddUnit}>
                  Add Unit
                </Button>
              </div>
            </FormField>
          </div>

          <div className="space-y-4">
            <FormField label="Current Stock" required error={errors.stock}>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="Current Stock..."
                icon={Hash}
                error={!!errors.stock}
              />
            </FormField>

            <FormField label="Reorder Level" required error={errors.threshold}>
              <Input
                type="number"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', e.target.value)}
                placeholder="Low Stock Alert..."
                icon={AlertTriangle}
                error={!!errors.threshold}
              />
            </FormField>

            <FormField label="Package Price" error={errors.packagePrice}>
              <Input
                type="number"
                value={formData.packagePrice}
                onChange={(e) => handleInputChange('packagePrice', e.target.value)}
                placeholder="ex: 50 (optional)"
                icon={DollarSign}
                error={!!errors.packagePrice}
              />
            </FormField>

            <FormField label="Quantity per Pack" error={errors.qtyPerPack}>
              <Input
                type="number"
                value={formData.qtyPerPack}
                onChange={(e) => handleInputChange('qtyPerPack', e.target.value)}
                placeholder="ex: 500 (optional)"
                icon={Hash}
                error={!!errors.qtyPerPack}
              />
            </FormField>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Package Price and Quantity per Pack are optional. If both are provided, 
            the unit cost will be automatically calculated as Package Price ÷ Quantity per Pack.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (editingItem ? 'Update Ingredient' : 'Add Ingredient')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInventoryModal;
