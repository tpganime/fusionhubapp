

import React from 'react';
import { Home, MessageCircle, Search, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSwitchAccountModal, triggerHaptic } = useApp();

  // Hide BottomNav when in an active chat conversation
  // This prevents the input field from being covered by the nav bar on mobile
  const isChatConversation = location.pathname === '/chat' && location.search.includes('uid=');

  if (isChatConversation) return null;

  const tabs = [
    { id: 'home', path: '/home', icon: Home, label: 'Home' },
    { id: 'chat', path: '/chat', icon: MessageCircle, label: 'Chat' },
    { id: 'search', path: '/search', icon: Search, label: 'Search' },
    { id: 'profile', path: '/profile', icon: User, label: 'Profile' },
  ];

  const activeIndex = tabs.findIndex(tab => 
    location.pathname === tab.path || (tab.path !== '/home' && location.pathname.startsWith(tab.path))
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  const handleTabClick = (tab: typeof tabs[0]) => {
      triggerHaptic();
      navigate(tab.path);
  };

  const handleDoubleClick = (tabId: string) => {
      if (tabId === 'profile') {
          triggerHaptic();
          openSwitchAccountModal(true);
      }
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 animate-slide-up">
      {/* 3D Glass Capsule */}
      <div className="pointer-events-auto relative flex items-center p-2 rounded-[3rem] shadow-[0_20px_50px_0_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 backdrop-blur-3xl bg-gradient-to-b from-white/60 to-white/30 dark:from-white/10 dark:to-black/30">
        
        {/* Floating Liquid Active Blob - 3D Bubble Effect */}
        <div 
          className="absolute top-2 bottom-2 w-16 rounded-[2.5rem] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-0"
          style={{
            left: '0.5rem', 
            transform: `translate3d(${currentIndex * 4}rem, 0, 0)`,
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 100%)',
            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 1), 0 10px 20px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(12px)'
          }}
        >
           {/* Specular Highlight for 3D volume */}
           <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-gradient-to-b from-white to-transparent rounded-full opacity-80"></div>
        </div>

        {/* Icons */}
        <div className="relative z-10 flex items-center">
          {tabs.map((tab, index) => {
            const isActive = index === currentIndex;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                onDoubleClick={() => handleDoubleClick(tab.id)}
                className="w-16 h-14 flex items-center justify-center rounded-full transition-all duration-300 group focus:outline-none active:scale-90"
              >
                <Icon 
                  className={`w-7 h-7 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                    isActive 
                      ? 'text-gray-900 dark:text-gray-900 scale-110 stroke-[2.5px] drop-shadow-sm -translate-y-0.5' 
                      : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white scale-90 opacity-80'
                  }`} 
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
