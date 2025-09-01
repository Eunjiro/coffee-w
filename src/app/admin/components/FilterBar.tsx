"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Plus } from "lucide-react";

const filters = [
  { id: "all", label: "All Items", activeColor: "#776B5D" },
  { id: "COFFEE", label: "Coffee", activeColor: "#cf3404ff" },
  { id: "NON_COFFEE", label: "Non-Coffee", activeColor: "#40A2D8" },
  { id: "MEAL", label: "Meal", activeColor: "#7AC943" },
  { id: "ADDON", label: "Add-ons", activeColor: "#D8902F" },
];

interface FilterBarProps {
  active: string;
  onChange: (filter: string) => void;
  onAddCategory?: () => void;
}

export default function FilterBar({ active, onChange, onAddCategory }: FilterBarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className="flex gap-2 md:gap-3 py-2 overflow-x-auto scrollbar-hide px-2 md:px-0">
      {filters.map((filter) => {
        const isActive = active === filter.id;
        return (
          <button
            key={filter.id}
            className={`flex-shrink-0 bg-white rounded-2xl p-2 w-[130px] md:w-[157px] h-[56px] md:h-[64px] flex items-center transition-all duration-200 hover:shadow-md`}
            onClick={() => onChange(filter.id)}
            aria-pressed={isActive}
            aria-label={`Filter by ${filter.label}`}
          >
            <div
              className={`flex items-center gap-2 rounded-lg px-3 md:px-4 py-2 w-full h-full ${isActive ? "shadow-inner" : ""}`}
              style={{ backgroundColor: isActive ? filter.activeColor : "#FFFFFF" }}
            >
              <ClipboardList
                size={isMobile ? 18 : 20}
                strokeWidth={2}
                color={isActive ? "#F3EEEA" : "#776B5D"}
                aria-hidden="true"
              />
              <span className={`text-sm md:text-base font-medium ${isActive ? "text-[#F3EEEA]" : "text-[#776B5D]"}`}>
                {isMobile ? filter.label.split(' ')[0] : filter.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
