import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const displayText = selectedCategoryData ? selectedCategoryData.name : '전체';
  const displayIcon = selectedCategoryData?.icon || null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-all shadow-sm"
      >
        <Filter size={16} className="text-stone-500" />
        {displayIcon && <span>{displayIcon}</span>}
        <span className="font-medium text-stone-700">{displayText}</span>
        <ChevronDown 
          size={16} 
          className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-20 animate-fade-in">
          {/* 전체 옵션 */}
          <button
            onClick={() => { onSelect(null); setIsOpen(false); }}
            className={`w-full px-4 py-2.5 text-left hover:bg-stone-50 flex items-center gap-2 transition-colors ${
              !selectedCategory ? 'bg-rose-50 text-rose-600' : 'text-stone-700'
            }`}
          >
            <span className="w-5 text-center">📋</span>
            <span className="font-medium">전체</span>
          </button>
          
          <div className="h-px bg-stone-100 my-1" />
          
          {/* 카테고리 목록 */}
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onSelect(cat.id); setIsOpen(false); }}
              className={`w-full px-4 py-2.5 text-left hover:bg-stone-50 flex items-center gap-2 transition-colors ${
                selectedCategory === cat.id ? 'bg-rose-50 text-rose-600' : 'text-stone-700'
              }`}
            >
              <span className="w-5 text-center">{cat.icon}</span>
              <span className="font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDropdown;
