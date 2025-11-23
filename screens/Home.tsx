import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HOME_SHORTCUTS } from '../constants';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { ExternalLink, Lock, Bell, ArrowRight } from 'lucide-react';

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

  return (
    <div className="h-full overflow-y-auto pb-32 no-scrollbar">
      <TopBar />
      <main className="px-5 pt-2">
        
        {/* Notification Permission Liquid Banner */}
        {showNotifBanner && (
            <div className={`mb-6 p-5 liquid-card flex items-center justify-between transform-gpu ${enableAnimations ? 'animate-pop-in' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-300 shadow-inner">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Notifications</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-300">Don't miss a beat!</p>
                    </div>
                </div>
                <button 
                    onClick={() => { enableNotifications(); setShowNotifBanner(false); }}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                >
                    Allow
                </button>
            </div>
        )}

        {/* Greeting Liquid Card */}
        <div className={`relative overflow-hidden liquid-card p-8 mb-8 transform-gpu ${enableAnimations ? 'animate-elastic-up opacity-0' : ''}`} style={{ animationDelay: '0ms' }}>
           {/* Fluid background effect */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900/40 dark:to-blue-900/40 rounded-full blur-3xl opacity-60 pointer-events-none animate-blob"></div>
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-pink-200 to-yellow-100 dark:from-pink-900/40 dark:to-yellow-900/20 rounded-full blur-3xl opacity-60 pointer-events-none animate-blob" style={{ animationDelay: '2s'}}></div>

           <div className="relative z-10">
             <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300">
               {timeData.greeting},
             </h2>
             <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight drop-shadow-sm">
               {currentUser?.username}
             </h1>
             
             <div className="mt-4 flex flex-col items-start">
                <span className="text-6xl font-thin text-gray-800 dark:text-white tracking-tighter mix-blend-overlay">
                  {timeData.time}
                </span>
                <span className="px-3 py-1 mt-2 rounded-full bg-white/30 dark:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest backdrop-blur-md border border-white/20">
                  {timeData.date}
                </span>
             </div>
           </div>
        </div>

        {/* Shortcuts Grid - Liquid Tiles */}
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pl-2">Apps</h3>
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
                       className={`group relative overflow-hidden liquid-card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform-gpu ${enableAnimations ? 'animate-pop-in opacity-0' : ''}`}
                       style={{ animationDelay: `${100 + (index * 50)}ms`, animationFillMode: 'both' }}
                     >
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                           <ArrowRight className="w-4 h-4 text-gray-500" />
                        </div>
                        
                        <div className="mb-4 w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-white to-white/50 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] border border-white/40 group-hover:scale-110 transition-transform duration-300">
                           {shortcut.icon ? (
                               <img src={`https://www.google.com/s2/favicons?domain=${shortcut.icon}&sz=64`} alt="icon" className="w-7 h-7" />
                           ) : (
                               <span className="text-2xl">🔗</span>
                           )}
                        </div>
                        
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1">{shortcut.name}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{shortcut.description}</p>
                     </a>
                 );
             } else {
                 return (
                     <div 
                       key={shortcut.name}
                       className={`group relative overflow-hidden liquid-card p-5 opacity-60 cursor-not-allowed transform-gpu ${enableAnimations ? 'animate-pop-in opacity-0' : ''}`}
                       style={{ animationDelay: `${100 + (index * 50)}ms`, animationFillMode: 'both' }}
                     >
                        <div className="absolute top-3 right-3">
                           <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        <div className="mb-4 w-14 h-14 rounded-[1.2rem] bg-gray-200 dark:bg-gray-800/50 flex items-center justify-center grayscale">
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
           <div className="text-center py-10 opacity-50">
             <p className="text-sm text-gray-400">No shortcuts available.</p>
           </div>
        )}
      </main>
    </div>
  );
};