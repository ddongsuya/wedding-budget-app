import React from 'react';
import { Search } from 'lucide-react';

interface NoSearchResultsProps {
  searchTerm: string;
  onClear?: () => void;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({ searchTerm, onClear }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 animate-fade-in">
        <Search size={32} className="text-stone-400" />
      </div>
      
      <h3 className="text-lg font-bold text-stone-800 mb-2">
        검색 결과가 없어요
      </h3>
      
      <p className="text-stone-500 text-sm mb-4">
        "<span className="font-medium text-stone-700">{searchTerm}</span>"에 대한 결과를 찾을 수 없어요
      </p>
      
      {onClear && (
        <button
          onClick={onClear}
          className="text-rose-500 font-medium hover:text-rose-600 transition-colors"
        >
          검색어 지우기
        </button>
      )}
    </div>
  );
};
