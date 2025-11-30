import React from 'react';

interface LiquidToggleProps {
  checked: boolean;
  onChange: () => void;
}

export const LiquidToggle: React.FC<LiquidToggleProps> = ({ checked, onChange }) => {
  return (
    <button 
      className={`liquid-toggle ${checked ? 'active' : ''}`} 
      onClick={onChange}
      aria-pressed={checked}
    >
        <div className="toggle-circle"></div>
    </button>
  );
};