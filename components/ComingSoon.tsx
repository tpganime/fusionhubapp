import React, {  } from 'react';
import { Construction } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TopBar } from './TopBar';

interface ComingSoonProps {
  title: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  const { enableAnimations } = useApp();
  
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <TopBar />
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${enableAnimations ? 'animate-fade-in' : ''}`}>
        <div className={`w-32 h-32 bg-white/40 dark:bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-lg backdrop-blur-md border border-white/20 ${enableAnimations ? 'animate-blob' : ''}`}>
           <Construction className="w-16 h-16 text-yellow-500 dark:text-yellow-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
        <h3 className="text-xl font-semibold text-blue-500 dark:text-blue-400 mb-4">Coming Soon</h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-xs">
          This feature is currently under maintenance or development by the admin. Check back later!
        </p>
      </div>
    </div>
  );
};