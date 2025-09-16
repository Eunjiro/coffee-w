// AddCategoryModal.tsx
import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import FormField, { Input } from "../ui/FormField";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  categories: string[];
  onRemove: (name: string) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ open, onClose, onConfirm, categories, onRemove }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm(name);
      setName("");
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
      <Button onClick={handleSubmit}>
        Add Category
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Add Category"
      size="sm"
      footer={footer}
    >
      <div className="space-y-4">
        <FormField label="Category Name" required>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Enter category name"
          />
        </FormField>
        
        <div>
          <h3 className="mb-3 font-semibold text-[#776B5D] text-sm">Existing Categories</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {categories.length === 0 ? (
              <li className="text-[#776B5D]/60 text-sm text-center py-4">No categories yet.</li>
            ) : (
              categories.map(cat => (
                <li key={cat} className="flex justify-between items-center bg-white px-3 py-2 border border-[#B0A695] rounded-lg">
                  <span className="text-[#776B5D]">{cat}</span>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => onRemove(cat)}
                  >
                    Remove
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default AddCategoryModal;