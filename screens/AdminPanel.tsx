
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Volume2, Send } from 'lucide-react';
import { HOME_SHORTCUTS } from '../constants';

export const AdminPanelScreen: React.FC = () => {
  const { appConfig, updateAppConfig, broadcastMessage, isAdmin } = useApp();
  const navigate = useNavigate();
  const [localConfig, setLocalConfig] = useState(appConfig);
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isAdmin) {
    navigate('/home');
    return null;
  }

  const handleToggleFeature = (feature: keyof typeof localConfig.features) => {
    if (feature === 'shortcuts') return;
    setLocalConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const handleToggleShortcut = (name: string) => {
    setLocalConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        shortcuts: {
          ...prev.features.shortcuts,
          [name]: !prev.features.shortcuts[name]
        }
      }
    }));
  };

  const saveConfig = async () => {
    await updateAppConfig(localConfig);
    alert('Configuration saved & broadcasted to all users.');
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setSending(true);
    await broadcastMessage(broadcastText);
    setBroadcastText('');
    setSending(false);
    alert('Message sent to all users.');
  };

  return (
    <div className="h-full overflow-y-auto pb-24 transition-colors duration-300 scrollbar-hide">
      <div className="sticky top-0 bg-white/60 dark:bg-dark-surface/80 backdrop-blur-md border-b border-white/50 dark:border-gray-800 p-4 flex items-center z-50">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 text-gray-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Admin Panel</h2>
      </div>

      <main className="p-4 space-y-8 max-w-md mx-auto">
        
        {/* Broadcast */}
        <div className="bg-white/70 dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-white/50 dark:border-gray-800">
           <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
              <Volume2 className="w-6 h-6" />
              <h3 className="font-bold text-lg">System Broadcast</h3>
           </div>
           <textarea
             value={broadcastText}
             onChange={e => setBroadcastText(e.target.value)}
             placeholder="Type an announcement..."
             className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[100px] mb-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
           />
           <button 
             onClick={handleBroadcast}
             disabled={sending || !broadcastText.trim()}
             className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
           >
             <Send className="w-4 h-4" /> Send to Everyone
           </button>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white/70 dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-white/50 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Main Features</h3>
          <div className="space-y-4">
             {['home', 'chat', 'search', 'profile'].map((feat) => (
                <div key={feat} className="flex items-center justify-between">
                   <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{feat}</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                        type="checkbox" 
                        checked={(localConfig.features as any)[feat]} 
                        onChange={() => handleToggleFeature(feat as any)} 
                        className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                   </label>
                </div>
             ))}
          </div>
        </div>

        {/* Shortcuts Toggles */}
        <div className="bg-white/70 dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-white/50 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Shortcuts Availability</h3>
          <div className="space-y-4">
             {HOME_SHORTCUTS.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                   <span className="font-medium text-gray-700 dark:text-gray-300 text-sm truncate max-w-[150px]">{s.name}</span>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                        type="checkbox" 
                        checked={localConfig.features.shortcuts[s.name] ?? true} 
                        onChange={() => handleToggleShortcut(s.name)} 
                        className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                   </label>
                </div>
             ))}
          </div>
        </div>

        <button 
           onClick={saveConfig}
           className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg transform transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
           <Save className="w-5 h-5" /> Save Configuration
        </button>

      </main>
    </div>
  );
};
