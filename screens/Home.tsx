
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HOME_SHORTCUTS } from '../constants';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Lock, Bell, ArrowRight } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { currentUser, enableAnimations, appConfig, enableNotifications } = useApp();
  const [timeData, setTimeData] = useState({
    time: '',
    date: '',
    greeting: ''
  });
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata' };
      
      const timeStr = now.toLocaleTimeString('en-IN', { ...options, hour: '2-digit', minute: '2-digit' }).toLowerCase();
      const dateStr = now.toLocaleDateString('en-IN', { ...options, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istDate = new Date(istString);
      const hour = istDate.getHours();

      let greeting = 'Good Morning';
      if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
      else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
      else if (hour >= 21 || hour < 5) greeting = 'Good Night';

      setTimeData({ time: timeStr, date: dateStr, greeting });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     if ("Notification" in window && window.Notification.permission === 'default') {
         setShowNotifBanner(true);
     }
  }, []);

  if (!appConfig.features.home) {
    return <ComingSoon title="Home" />;
  }

  // Animation Calculation
  const getDelay = (index: number, base: number = 200) => {
    return enableAnimations ? { animationDelay: `${base + (index * 60)}ms`, animationFillMode: 'both' as const } : {};
  };

  return (
    <div className="h-full overflow-y-auto pb-32 no-scrollbar">
      <TopBar />
      <main className="px-5 pt-2">
        
        {/* Notification Permission Liquid Banner - Heavy pop in */}
        {showNotifBanner && (
            <div className={`mb-6 p-5 liquid-card flex items-center justify-between ${enableAnimations ? 'animate-pop-in' : ''}`} style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-300 shadow-inner">
                        <Bell className="w-6 h-6 animate-bounce-soft" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Notifications</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-300">Don't miss a beat!</p>
                    </div>
                </div>
                <button 
                    onClick={() => { enableNotifications(); setShowNotifBanner(false); }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all hover:scale-110"
                >
                    Allow
                </button>
            </div>
        )}

        {/* Greeting Liquid Card - 3D Tilted & Refined Motion */}
        <div 
          className={`relative overflow-hidden liquid-card p-6 mb-6 hover:scale-[1.02] hover:shadow-2xl transition-all duration-700 ${enableAnimations ? 'animate-scale-in' : ''}`}
        >
           {/* Fluid background effect */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-900/60 dark:to-blue-900/60 rounded-full blur-[80px] opacity-70 pointer-events-none animate-blob"></div>
           <div 
             className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-pink-300 to-yellow-200 dark:from-pink-900/50 dark:to-yellow-900/30 rounded-full blur-[80px] opacity-70 pointer-events-none animate-blob" 
             style={{ animationDelay: '4s', animationDuration: '18s' }}
           ></div>

           <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
             <h2 className={`text-sm font-medium text-gray-600 dark:text-gray-300 ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={getDelay(0, 100)}>
               {timeData.greeting},
             </h2>
             <h1 className={`text-2xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight drop-shadow-sm ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={getDelay(1, 100)}>
               {currentUser?.username}
             </h1>
             
             <div className="mt-2 flex flex-col items-start">
                <span className={`text-4xl font-thin text-gray-800 dark:text-white tracking-tighter mix-blend-overlay ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={getDelay(2, 100)}>
                  {timeData.time}
                </span>
                <span className={`px-3 py-1 mt-2 rounded-full bg-white/40 dark:bg-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest backdrop-blur-md border border-white/30 ${enableAnimations ? 'animate-pop-in' : ''}`} style={getDelay(3, 100)}>
                  {timeData.date}
                </span>
             </div>
           </div>
        </div>

        {/* Shortcuts Grid - Waterfall Stagger */}
        <h3 className={`text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pl-2 ${enableAnimations ? 'animate-fade-in' : ''}`} style={{ animationDelay: '200ms' }}>Apps</h3>
        <div className="grid grid-cols-2 gap-4">
          {HOME_SHORTCUTS.map((shortcut, index) => {
             const isEnabled = appConfig.features.shortcuts[shortcut.name] ?? true;
             
             if (isEnabled) {
                 return (
                     <a 
                       key={shortcut.name}
                       href={shortcut.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className={`group relative overflow-hidden liquid-card p-5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-500 ${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`}
                       style={getDelay(index, 300)}
                     >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0 duration-500 ease-out">
                           <ArrowRight className="w-4 h-4 text-gray-500" />
                        </div>
                        
                        <div className="mb-4 w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-white to-white/50 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] border border-white/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-in-out group-hover:animate-bounce-soft">
                           {shortcut.icon ? (
                               <img src={`https://www.google.com/s2/favicons?domain=${shortcut.icon}&sz=64`} alt="icon" className="w-7 h-7" />
                           ) : (
                               <span className="text-2xl">🔗</span>
                           )}
                        </div>
                        
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 transition-colors duration-300">{shortcut.name}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">{shortcut.description}</p>
                     </a>
                 );
             } else {
                 return (
                     <div 
                       key={shortcut.name}
                       className={`group relative overflow-hidden liquid-card p-5 opacity-60 cursor-not-allowed grayscale hover:grayscale-0 transition-all duration-500 ${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`}
                       style={getDelay(index, 300)}
                     >
                        <div className="absolute top-3 right-3">
                           <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        <div className="mb-4 w-14 h-14 rounded-[1.2rem] bg-gray-200 dark:bg-gray-800/50 flex items-center justify-center">
                           <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                        </div>
                        
                        <h3 className="font-bold text-gray-500 mb-1">{shortcut.name}</h3>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">Locked</p>
                     </div>
                 );
             }
          })}
        </div>
        
        {HOME_SHORTCUTS.length === 0 && (
           <div className={`text-center py-10 opacity-50 ${enableAnimations ? 'animate-fade-in' : ''}`}>
             <p className="text-sm text-gray-400">No shortcuts available.</p>
           </div>
        )}
      </main>
    </div>
  );
};
