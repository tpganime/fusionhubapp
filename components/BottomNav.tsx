
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
      {/* Liquid Glass Capsule */}
      <div className="pointer-events-auto relative glass-panel flex items-center p-1.5 shadow-2xl backdrop-blur-2xl rounded-[3rem]">
        
        {/* Floating Liquid Active Blob */}
        <div 
          className="absolute top-1.5 bottom-1.5 w-14 bg-gradient-to-b from-white to-white/60 dark:from-white/30 dark:to-white/10 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) z-0 border border-white/50"
          style={{
            left: '0.375rem', 
            transform: `translate3d(${currentIndex * 3.5}rem, 0, 0)` // Spacing multiplier
          }}
        >
           {/* Reflection Highlight */}
           <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-3 bg-gradient-to-b from-white/90 to-transparent rounded-full opacity-70"></div>
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
                className="w-14 h-12 flex items-center justify-center rounded-full transition-all duration-300 group focus:outline-none active:scale-75"
              >
                <Icon 
                  className={`w-6 h-6 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                    isActive 
                      ? 'text-gray-900 dark:text-white scale-110 stroke-[2.5px] drop-shadow-sm -translate-y-0.5' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 scale-90'
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
