// Add the "use client" directive at the top to mark the file as a client component
"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"; // Icons

// User type for data
interface User {
  name: string;
  email: string;
  role: "admin" | "cashier" | "barista";
  status: "active" | "inactive";
  phone?: string;
  hireDate: string; // ISO string format for date
}

interface UserType {
  id: number;
  email: string;
  name: string;
  role: "admin" | "cashier" | "barista"; // Ensure this is the same as the type used in the page
  status: "active" | "inactive";
  phone: string;
  createdAt: string;
  hireDate: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<UserType, "id" | "lastLogin">) => void;
  editingUser?: UserType | null; // Ensure consistency here as well
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, editingUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "barista" as "admin" | "cashier" | "barista",
    status: "active" as "active" | "inactive",
    hireDate: new Date().toISOString().split("T")[0], // default to today's date
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form data when modal opens or user is being edited
  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone || "",
        role: editingUser.role,
        status: editingUser.status,
        hireDate: editingUser.hireDate,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "barista",
        status: "active",
        hireDate: new Date().toISOString().split("T")[0],
      });
    }
    setErrors({});
  }, [editingUser, isOpen]);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.hireDate) newErrors.hireDate = "Hire date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return; // Don't proceed if there are validation errors

    // Include createdAt in the user data if it is editing an existing user
    const userData = {
      ...formData,
      phone: formData.phone || "", // Ensure phone is always a string, even if it's empty
      hireDate: formData.hireDate, // Already in the correct format
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(), // Handle missing createdAt
    };

    onSave(userData);
    onClose(); // Close the modal after saving
  };

  // Handle input field changes
  const handleInputChange = (field: string, value: string) => {
    if (field === "status") {
      setFormData((prev) => ({
        ...prev,
        [field]: value as "active" | "inactive", // Type-cast value for status
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" })); // Clear error if the user corrects it
  };

  if (!isOpen) return null; // If the modal is not open, return null

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[400px] p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">{editingUser ? "Edit User" : "Add New User"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter name"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter email"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="barista">Barista</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="active"
                  checked={formData.status === "active"}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="mr-2"
                />
                Active
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="inactive"
                  checked={formData.status === "inactive"}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="mr-2"
                />
                Inactive
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Hire Date</label>
            <input
              type="date"
              value={formData.hireDate}
              onChange={(e) => handleInputChange("hireDate", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.hireDate && <p className="text-red-600 text-sm">{errors.hireDate}</p>}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-md text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"
            >
              {editingUser ? "Update User" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
