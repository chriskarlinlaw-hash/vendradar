'use client';

import { Category, CategoryConfig } from '@/lib/types';
import { CATEGORIES } from '@/lib/scoring';
import { 
  Building, 
  Dumbbell, 
  HeartPulse, 
  GraduationCap, 
  Factory, 
  Home, 
  Bed, 
  Train,
  Grid3x3
} from 'lucide-react';

interface CategorySelectorProps {
  selected: Category[];
  onSelect: (categories: Category[]) => void;
}

const iconMap = {
  building: Building,
  dumbbell: Dumbbell,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  factory: Factory,
  home: Home,
  bed: Bed,
  train: Train,
};

export default function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  const allCategories = CATEGORIES.map(c => c.id);
  const isAllSelected = selected.length === allCategories.length;
  
  const handleCategoryClick = (categoryId: Category) => {
    if (selected.includes(categoryId)) {
      // Deselect - but keep at least one selected
      const newSelected = selected.filter(id => id !== categoryId);
      if (newSelected.length > 0) {
        onSelect(newSelected);
      }
    } else {
      // Add to selection
      onSelect([...selected, categoryId]);
    }
  };
  
  const handleAllClick = () => {
    if (isAllSelected) {
      // Deselect all → default to first category
      onSelect([CATEGORIES[0].id]);
    } else {
      // Select all
      onSelect(allCategories);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Select Categories</h3>
        <button
          onClick={handleAllClick}
          className={`
            flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border
            ${isAllSelected 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'
            }
          `}
        >
          <Grid3x3 size={14} />
          ALL
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon as keyof typeof iconMap] || Building;
          const isSelected = selected.includes(cat.id);
          
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`
                category-card flex items-start gap-2 p-3 rounded-lg border text-left transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg flex-shrink-0
                ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
              `}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <div className={`
                  font-medium text-sm truncate
                  ${isSelected ? 'text-blue-700' : 'text-gray-700'}
                `}>
                  {cat.name}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">
                  {cat.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selected.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          {selected.length} categories selected
        </div>
      )}
    </div>
  );
}