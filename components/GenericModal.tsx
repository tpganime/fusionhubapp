import React from 'react';
import { X } from 'lucide-react';

interface GenericModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const GenericModal: React.FC<GenericModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 border border-white/20 animate-pop-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-95">
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>
        {children}
      </div>
    </div>
  );
};