"use client";

import React from "react";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  message = "Please confirm your action.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div
        className="bg-[#F3EEEA] rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-[fadeIn_120ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#B0A695]/20">
          <h3 className="text-lg font-semibold text-[#776B5D]">{title}</h3>
        </div>
        <div className="p-5 text-[#776B5D]">{message}</div>
        <div className="flex justify-end gap-2 p-5 pt-0">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default ConfirmDialog;


