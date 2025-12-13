

import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

interface LiquidSliderProps {
  value: number; // 0 to 100
  onChange: (val: number) => void;
}

export const LiquidSlider: React.FC<LiquidSliderProps> = ({ value, onChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const { triggerHaptic } = useApp();

  // Calculate percentage for initial render and updates
  const percentage = Math.min(100, Math.max(0, value));

  const handleMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    let percent = (offsetX / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    
    // Trigger haptics only on significant changes (every 5%) to avoid vibration spam
    if (Math.round(percent) % 5 === 0 && Math.round(percent) !== Math.round(value)) {
        triggerHaptic();
    }
    
    onChange(Math.round(percent));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsActive(true);
    handleMove(e.clientX);
    triggerHaptic();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsActive(true);
    handleMove(e.touches[0].clientX);
    triggerHaptic();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isActive) {
        handleMove(e.clientX);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isActive) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onEnd = () => {
      setIsActive(false);
    };

    if (isActive) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [isActive]);

  return (
    <div 
      className="slider-container" 
      ref={sliderRef} 
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="slider-progress" style={{ width: `${percentage}%` }}></div>
      <div 
        className={`slider-thumb-glass ${isActive ? 'active' : ''}`} 
        ref={thumbRef}
        style={{ left: `${percentage}%` }}
      >
        <div className="slider-thumb-glass-filter"></div>
        <div className="slider-thumb-glass-overlay"></div>
        <div className="slider-thumb-glass-specular"></div>
      </div>
    </div>
  );
};