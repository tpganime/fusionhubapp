
import React, { useRef, useEffect, useState } from 'react';

interface LiquidToggleProps {
  checked: boolean;
  onChange: () => void;
}

export const LiquidToggle: React.FC<LiquidToggleProps> = ({ checked, onChange }) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  
  // We use CSS transitions on the variable instead of GSAP
  // The CSS in index.html already handles the transition of --complete if defined correctly
  
  useEffect(() => {
    if (!toggleRef.current) return;
    
    // Trigger 'active' state animation momentarily for the stretch effect via data attribute
    toggleRef.current.dataset.active = "true";
    const timer = setTimeout(() => {
        if (toggleRef.current) toggleRef.current.dataset.active = "false";
    }, 300);

    return () => clearTimeout(timer);
  }, [checked]);

  return (
    <button 
      ref={toggleRef}
      className="liquid-toggle" 
      onClick={onChange}
      aria-pressed={checked}
      style={{ 
        '--complete': checked ? 100 : 0,
        // Inline transition to ensure the variable animates smoothly without GSAP
        transition: '--complete 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' 
      } as React.CSSProperties}
    >
        <div className="knockout">
          <div className="indicator indicator--masked">
            <div className="mask"></div>
          </div>
        </div>
        <div className="indicator__liquid">
          <div className="shadow"></div>
          <div className="wrapper">
            <div className="liquids">
              <div className="liquid__shadow"></div>
              <div className="liquid__track"></div>
            </div>
          </div>
          <div className="cover"></div>
        </div>
    </button>
  );
};
