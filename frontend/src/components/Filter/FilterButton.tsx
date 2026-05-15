import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
}

const FilterButton = React.forwardRef<HTMLButtonElement, FilterButtonProps>(
  ({ isOpen, onClick, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`
          flex items-center justify-between px-6 py-3 
          border-2 border-black font-black uppercase tracking-[0.2em] text-[11px]
          transition-all duration-300 min-w-[220px] cursor-pointer
          ${
            isOpen
              ? 'bg-black text-white'
              : 'bg-white text-black hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
          } 
          ${className || ''}
        `}
        {...props}
      >
        <span>{isOpen ? 'Close Catalogue' : 'Search & Filter'}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
    );
  },
);

FilterButton.displayName = 'FilterButton';
export default FilterButton;
