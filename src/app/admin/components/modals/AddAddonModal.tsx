// AddAddonModal.tsx
import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import FormField, { Input } from "../ui/FormField";

interface AddAddonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const AddAddonModal: React.FC<AddAddonModalProps> = ({ open, onClose, onConfirm }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [availableTo, setAvailableTo] = useState<{ hot: boolean; iced: boolean; milkTea: boolean; frappe: boolean; soda: boolean; fruitTea: boolean }>({ hot: true, iced: true, milkTea: true, frappe: true, soda: true, fruitTea: false });

  const handleSubmit = () => {
    onConfirm({ name, category, quantity, price, availableTo });
    onClose();
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button onClick={handleSubmit}>
        Add Addon
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add Addon"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Enter addon name"
            />
          </FormField>
          <FormField label="Category" required>
            <Input 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              placeholder="Enter category"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Quantity" required>
            <Input 
              value={quantity} 
              onChange={e => setQuantity(e.target.value)} 
              placeholder="ex: 500 ml"
            />
          </FormField>
          <FormField label="Price" required>
            <Input 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="ex: 5"
            />
          </FormField>
        </div>
        <FormField label="Available to">
          <div className="flex flex-wrap gap-4">
            {Object.entries(availableTo).map(([key, value]) => (
              <label key={key} className="flex items-center text-[#776B5D]">
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={e => setAvailableTo(s => ({ ...s, [key]: e.target.checked }))} 
                  className="mr-2 text-[#776B5D] focus:ring-[#776B5D] rounded"
                />
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
            ))}
          </div>
        </FormField>
      </div>
    </Modal>
  );
};

export default AddAddonModal;