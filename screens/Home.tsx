import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HOME_SHORTCUTS } from '../constants';
import { TopBar } from '../components/TopBar';
import { ExternalLink } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { currentUser, enableAnimations } = useApp();
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
      
      // Greeting logic based on IST hour
      const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istDate = new Date(istString);
      const hour = istDate.getHours();
      
      let greetingText = 'Good Night';
      if (hour >= 5 && hour < 12) greetingText = 'Good Morning';
      else if (hour >= 12 && hour < 17) greetingText = 'Good Afternoon';
      else if (hour >= 17 && hour < 21) greetingText = 'Good Evening';

      setTimeData({
        time: timeStr,
        date: dateStr,
        greeting: greetingText
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full overflow-y-auto pb-32 transition-colors duration-300 scrollbar-hide">
      <TopBar />
      
      <main className={`px-4 pt-4 space-y-6 ${enableAnimations ? 'animate-fade-in' : ''}`}>
        
        {/* Header Card */}
        <div className={`relative overflow-hidden rounded-3xl bg-white/80 dark:bg-dark-surface shadow-xl p-6 border border-white/50 dark:border-gray-700 group hover:shadow-2xl transition-all duration-500 backdrop-blur-sm ${enableAnimations ? 'animate-elastic-up' : ''}`}>
          <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-200 via-purple-100 to-transparent dark:from-blue-900 dark:via-purple-900 dark:to-transparent rounded-bl-full opacity-60 transition-transform duration-700 group-hover:scale-110 ${enableAnimations ? 'animate-blob' : ''}`}></div>
          <div className={`absolute -bottom-10 -left-10 w-32 h-32 bg-pink-100 dark:bg-pink-900 rounded-full mix-blend-multiply filter blur-xl opacity-50 ${enableAnimations ? 'animate-blob' : ''}`} style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10">
             <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 drop-shadow-sm">
               {timeData.greeting}, <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-3xl">
                 {currentUser?.username}
               </span>
             </h1>
             
             <div className="mt-6 flex flex-col">
               <span className="text-5xl font-light text-gray-900 dark:text-gray-100 tracking-tight tabular-nums">{timeData.time}</span>
               <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1 ml-1">{timeData.date}</span>
             </div>
          </div>
        </div>

        {/* Shortcuts Grid */}
        <div className={enableAnimations ? 'animate-slide-up' : ''} style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 px-1 flex items-center gap-2">
             <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
             Quick Access
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {HOME_SHORTCUTS.map((shortcut, index) => (
              <a 
                key={index}
                href={shortcut.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex flex-col p-4 rounded-2xl bg-white/60 dark:bg-dark-surface/80 backdrop-blur-md shadow-sm hover:shadow-lg border border-white dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 ${enableAnimations ? 'animate-zoom-rotate' : ''}`}
                style={{ animationDelay: `${0.1 + (index * 0.05)}s`, animationFillMode: 'both' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                     {shortcut.icon && shortcut.icon.includes('.') ? (
                         <img src={`https://www.google.com/s2/favicons?domain=${shortcut.icon}&sz=64`} className="w-6 h-6" alt={shortcut.name} />
                     ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-bold">{shortcut.name.charAt(0)}</span>
                     )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{shortcut.name}</h3>
                {shortcut.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{shortcut.description}</p>}
              </a>
            ))}
          </div>
        </div>

        {/* Footer Message */}
        <div className={`p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg relative overflow-hidden ${enableAnimations ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.3s' }}>
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <p className="text-sm font-medium opacity-90 relative z-10 text-center">"Connect, Play, and Explore together."</p>
        </div>

      </main>
    </div>
  );
};