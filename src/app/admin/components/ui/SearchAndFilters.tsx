import React from 'react';
import { Search } from 'lucide-react';

interface SearchAndFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  statusTags?: React.ReactNode;
  className?: string;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search Anything...",
  filters,
  statusTags,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap justify-between items-center gap-3 mb-8 ${className}`}>
      <div className="flex flex-wrap gap-4 flex-1">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#776B5D]/50" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#B0A695] rounded-lg text-[#776B5D] placeholder:text-[#776B5D]/60 focus:ring-2 focus:ring-[#776B5D] focus:border-transparent"
          />
        </div>
        {filters && (
          <div className="flex gap-2">
            {filters}
          </div>
        )}
      </div>
      {statusTags && (
        <div className="flex gap-4">
          {statusTags}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;
