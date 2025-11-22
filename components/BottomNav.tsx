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

  // Calculate active index for the sliding bubble
  const activeIndex = tabs.findIndex(tab => 
    location.pathname === tab.path || (tab.path !== '/home' && location.pathname.startsWith(tab.path))
  );
  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto relative bg-white/20 dark:bg-black/40 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-full p-2">
        
        {/* Liquid Bubble Active Indicator */}
        <div 
          className="absolute top-2 bottom-2 w-16 bg-gradient-to-b from-white/60 to-white/20 dark:from-white/20 dark:to-white/5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) z-0"
          style={{
            left: '0.5rem', // Matches p-2 (0.5rem)
            transform: `translateX(${currentIndex * 4.5}rem)` // w-16 (4rem) + gap-2 (0.5rem) = 4.5rem
          }}
        >
           {/* Glossy reflection on the bubble */}
           <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-4 bg-gradient-to-b from-white/80 to-transparent rounded-full opacity-60"></div>
        </div>

        {/* Icons Container */}
        <div className="relative z-10 flex items-center gap-2">
          {tabs.map((tab, index) => {
            const isActive = index === currentIndex;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="w-16 h-14 flex items-center justify-center rounded-full transition-all duration-300 group focus:outline-none"
              >
                <Icon 
                  className={`w-6 h-6 transition-all duration-500 ${
                    isActive 
                      ? 'text-gray-800 dark:text-white scale-110 stroke-[2.5px] drop-shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-white scale-100'
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