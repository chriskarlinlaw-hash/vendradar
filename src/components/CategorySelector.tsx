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
  Train 
} from 'lucide-react';

interface CategorySelectorProps {
  selected: Category;
  onSelect: (category: Category) => void;
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
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Category</h3>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon as keyof typeof iconMap] || Building;
          const isSelected = selected === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`
                category-card flex items-start gap-2 p-3 rounded-lg border text-left
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
    </div>
  );
}