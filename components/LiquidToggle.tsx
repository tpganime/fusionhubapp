
import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

interface LiquidToggleProps {
  checked: boolean;
  onChange: () => void;
}

export const LiquidToggle: React.FC<LiquidToggleProps> = ({ checked, onChange }) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  // We use a local state to track animation completion slightly disconnected from 'checked'
  // to allow the animation to play out
  
  useEffect(() => {
    if (!toggleRef.current) return;
    
    // Animate --complete CSS variable
    gsap.to(toggleRef.current, {
      '--complete': checked ? 100 : 0,
      duration: 0.6,
      ease: 'elastic.out(1, 0.5)',
    });

    // Trigger 'active' state animation momentarily for the stretch effect
    toggleRef.current.dataset.active = "true";
    setTimeout(() => {
        if (toggleRef.current) toggleRef.current.dataset.active = "false";
    }, 200);

  }, [checked]);

  return (
    <button 
      ref={toggleRef}
      className="liquid-toggle" 
      onClick={onChange}
      aria-pressed={checked}
      style={{ '--complete': checked ? 100 : 0 } as React.CSSProperties}
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
