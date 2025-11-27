
import React from 'react';
import { Home, MessageCircle, Search, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', path: '/home', icon: Home, label: 'Home' },
    { id: 'chat', path: '/chat', icon: MessageCircle, label: 'Chat' },
    { id: 'search', path: '/search', icon: Search, label: 'Search' },
    { id: 'profile', path: '/profile', icon: User, label: 'Profile' },
  ];

  // Calculate active index
  const activeIndex = tabs.findIndex(tab => 
    location.pathname === tab.path || (tab.path !== '/home' && location.pathname.startsWith(tab.path))
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 animate-slide-up">
      {/* Liquid Glass Capsule Container */}
      <div className="pointer-events-auto relative flex items-center p-2 rounded-[3rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/40 dark:border-white/10 backdrop-blur-3xl bg-gradient-to-b from-white/40 to-white/20 dark:from-black/40 dark:to-black/20">
        
        {/* Floating Liquid Active Blob */}
        <div 
          className="absolute top-2 bottom-2 w-16 rounded-[2.5rem] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-0"
          style={{
            left: '0.5rem', 
            transform: `translate3d(${currentIndex * 4}rem, 0, 0)`, // Spacing multiplier (4rem = w-16)
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.9), 0 4px 15px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0,0,0,0.05)',
            backdropFilter: 'blur(12px)'
          }}
        >
           {/* Glossy Reflection Highlight */}
           <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-4 bg-gradient-to-b from-white to-transparent rounded-full opacity-90"></div>
        </div>

        {/* Icons */}
        <div className="relative z-10 flex items-center">
          {tabs.map((tab, index) => {
            const isActive = index === currentIndex;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="w-16 h-14 flex items-center justify-center rounded-full transition-all duration-300 group focus:outline-none active:scale-90"
              >
                <Icon 
                  className={`w-7 h-7 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                    isActive 
                      ? 'text-gray-900 dark:text-gray-900 scale-110 stroke-[2.5px] drop-shadow-sm -translate-y-0.5' 
                      : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-white scale-90'
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
