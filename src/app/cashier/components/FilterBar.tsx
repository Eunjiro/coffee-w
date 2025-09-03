'use client'

interface Filter {
    id: string;
    label: string;
}

interface FilterBarProps {
    filters: Filter[];
    active: string;
    onChange: (id: string) => void;
}

export default function FilterBar({ filters, active, onChange }: FilterBarProps) {
    return (
        <div className="flex gap-2 mb-4 flex-wrap">
            {filters.map(filter => (
                <button
                    key={filter.id}
                    className={`px-4 py-2 rounded-full border ${
                        active === filter.id
                            ? "bg-[#776B5D] text-white"
                            : "bg-white border-[#B0A695] text-[#776B5D]"
                    }`}
                    onClick={() => onChange(filter.id)}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
