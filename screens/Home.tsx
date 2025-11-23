import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HOME_SHORTCUTS } from '../constants';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { ExternalLink, Lock } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { currentUser, enableAnimations, appConfig } = useApp();
  const [timeData, setTimeData] = useState({
    time: '',
    date: '',
    greeting: ''
  });

  useEffect(() => {
    const updateTime = () => {
      // Use Indian Standard Time (IST)
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

  if (!appConfig.features.home) {
    return <ComingSoon title="Home" />;
  }

  return (
    <div className="h-full overflow-y-auto pb-24 transition-colors duration-300 scrollbar-hide">
      <TopBar />
      <main className="px-6 pt-6">
        {/* Greeting Card - Elastic Slide In */}
        <div className={`relative overflow-hidden rounded-[2rem] p-6 bg-white dark:bg-dark-surface shadow-sm border border-white/50 dark:border-gray-800 mb-8 transform-gpu ${enableAnimations ? 'animate-elastic-up opacity-0' : ''}`} style={{ animationDelay: '0ms' }}>
           {/* Decorative Gradient Blob */}
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-gradient-to-br from-blue-100 via-purple-100 to-transparent dark:from-blue-900/30 dark:via-purple-900/30 dark:to-transparent rounded-full blur-3xl pointer-events-none"></div>

           <div className="relative z-10">
             <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
               {timeData.greeting},
             </h2>
             <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
               {currentUser?.username}
             </h1>
             
             <div className="mt-4">
                <p className="text-5xl font-light text-gray-800 dark:text-white tracking-tight">
                  {timeData.time}
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                  {timeData.date}
                </p>
             </div>
           </div>
        </div>

        {/* Shortcuts Grid - Staggered Pop In */}
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
                       className={`group relative overflow-hidden rounded-3xl p-5 bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm border border-white/50 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 transform-gpu ${enableAnimations ? 'animate-pop-in opacity-0' : ''}`}
                       style={{ animationDelay: `${100 + (index * 50)}ms`, animationFillMode: 'both' }}
                     >
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        <div className="mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                           {shortcut.icon ? (
                               <img src={`https://www.google.com/s2/favicons?domain=${shortcut.icon}&sz=64`} alt="icon" className="w-6 h-6" />
                           ) : (
                               <span className="text-blue-500">🔗</span>
                           )}
                        </div>
                        
                        <h3 className="font-bold text-gray-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{shortcut.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{shortcut.description}</p>
                     </a>
                 );
             } else {
                 return (
                     <div 
                       key={shortcut.name}
                       className={`group relative overflow-hidden rounded-3xl p-5 bg-gray-100/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/5 opacity-80 cursor-not-allowed transform-gpu ${enableAnimations ? 'animate-pop-in opacity-0' : ''}`}
                       style={{ animationDelay: `${100 + (index * 50)}ms`, animationFillMode: 'both' }}
                     >
                        <div className="absolute top-0 right-0 p-3">
                           <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        
                        <div className="mb-3 w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-2xl grayscale opacity-50">
                           {shortcut.icon ? (
                               <img src={`https://www.google.com/s2/favicons?domain=${shortcut.icon}&sz=64`} alt="icon" className="w-6 h-6" />
                           ) : (
                               <span className="text-gray-400">🔗</span>
                           )}
                        </div>
                        
                        <h3 className="font-bold text-gray-500 dark:text-gray-500 mb-1">{shortcut.name}</h3>
                        <p className="text-xs text-blue-500/80 dark:text-blue-400/80 font-bold uppercase tracking-wide">Coming Soon</p>
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