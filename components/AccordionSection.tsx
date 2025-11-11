import React from 'react';
import { ChevronDownIcon } from './icons';

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({ title, isOpen, onToggle, children, className = '' }) => {
  return (
    <div className={`border-b border-[#E2E1E0]/80 ${className}`}>
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-3 text-left focus:outline-none focus-visible:bg-[#E2E1E0]/50 rounded-md"
        aria-expanded={isOpen}
      >
        <h2 className="text-sm font-semibold text-[#444444] uppercase tracking-wider">{title}</h2>
        <ChevronDownIcon className={`w-5 h-5 text-[#4E5B6F] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pt-2 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};
