
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
      
      const timeStr = now.toLocaleTimeString('en-IN', { ...options, hour: '2-digit', minute: '2-digit' });
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
        {/* Greeting Section */}
        <div className={`mb-8 ${enableAnimations ? 'animate-slide-in-right' : ''}`}>
           <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-1">{timeData.date}</p>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
             {timeData.greeting}, <br />
             <span className="text-blue-600 dark:text-blue-400">{currentUser?.username}</span>
           </h1>
           <p className="text-xl font-medium text-gray-400 dark:text-gray-500 mt-2">{timeData.time}</p>
        </div>

        {/* Shortcuts Grid */}
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
                       className={`group relative overflow-hidden rounded-3xl p-5 bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm border border-white/50 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${enableAnimations ? 'animate-scale-in' : ''}`}
                       style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
                     >
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        <div className="mb-3 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center text-2xl shadow-inner">
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
                       className={`group relative overflow-hidden rounded-3xl p-5 bg-gray-100/50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/5 opacity-80 cursor-not-allowed ${enableAnimations ? 'animate-scale-in' : ''}`}
                       style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
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
