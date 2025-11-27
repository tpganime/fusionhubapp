
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, Trash2, LogOut, Shield, ChevronRight, Moon, Sun, Zap, LayoutDashboard, Bell, Droplets, Sliders, Power, Gauge } from 'lucide-react';
import { PRIVACY_POLICY_TEXT } from '../constants';

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateProfile, logout, deleteAccount, deactivateAccount, theme, toggleTheme, enableAnimations, toggleAnimations, animationSpeed, setAnimationSpeed, enableLiquid, toggleLiquid, glassOpacity, setGlassOpacity, isAdmin, enableNotifications, notificationPermission } = useApp();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  const isNotificationGranted = notificationPermission === 'granted';

  if (!currentUser) return null;

  const togglePrivateProfile = () => {
    updateProfile({ ...currentUser, isPrivateProfile: !currentUser.isPrivateProfile });
  };

  const togglePrivateChat = () => {
    updateProfile({ ...currentUser, allowPrivateChat: !currentUser.allowPrivateChat });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteAccount();
      navigate('/');
    }
  };

  const handleDeactivate = () => {
      if (window.confirm("Are you sure you want to deactivate? Your profile will be hidden until you log in again.")) {
          deactivateAccount();
          navigate('/');
      }
  };

  // Inverted Logic for Slider
  // Glass Opacity: 0.0 (Transparent) to 1.0 (Opaque)
  // Slider UI: Transparency 0% (Opaque) to 100% (Transparent)
  // Mapping: Opacity = 1.0 - (Slider / 100)
  // Slider = (1.0 - Opacity) * 100
  const transparencyValue = Math.round((1.0 - glassOpacity) * 100);

  const handleTransparencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      // If 100% transparent, opacity is 0. If 0% transparent, opacity is 1.
      // Limit opacity to max 1.0
      const newOpacity = 1.0 - (val / 100.0);
      setGlassOpacity(Math.max(0, Math.min(1, newOpacity)));
  };

  if (showPrivacyPolicy) {
    return (
      <div className={`h-full overflow-y-auto no-scrollbar ${enableAnimations ? 'animate-fade-in' : ''}`}>
        <div className="sticky top-4 mx-4 z-50 glass-panel p-3 flex items-center mb-4">
          <button onClick={() => setShowPrivacyPolicy(false)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <h2 className="text-lg font-bold ml-2 text-gray-900 dark:text-white">Privacy Policy</h2>
        </div>
        <div className={`p-6 liquid-card mx-4 mb-20 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed ${enableAnimations ? 'animate-slide-up-fade' : ''}`}>
          {PRIVACY_POLICY_TEXT}
        </div>
      </div>
    );
  }

  // Animation stagger logic
  const getAnimStyle = (index: number) => {
      return enableAnimations ? {
          animationDelay: `${index * 80}ms`,
          animationFillMode: 'both' as const
      } : {};
  };

  return (
    <div className={`h-full overflow-y-auto pb-32 no-scrollbar ${enableAnimations ? 'animate-fade-in' : ''}`}>
      <div className="sticky top-4 mx-4 z-50 glass-panel p-3 flex items-center mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Settings</h2>
      </div>

      <main className="px-5 space-y-6 max-w-md mx-auto">
        
        {/* Admin Section */}
        {isAdmin && (
          <section className={`${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`} style={getAnimStyle(0)}>
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ml-2 tracking-wider">Admin</h3>
            <div className="liquid-card overflow-hidden">
               <button onClick={() => navigate('/admin')} className="w-full p-5 flex items-center justify-between hover:bg-white/20 transition-colors group">
                 <div className="flex items-center gap-4">
                   <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"><LayoutDashboard className="w-5 h-5" /></div>
                   <span className="font-bold text-gray-900 dark:text-white">Admin Panel</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </section>
        )}

        {/* Appearance */}
        <section className={`${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`} style={getAnimStyle(1)}>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ml-2 tracking-wider">Appearance</h3>
          <div className="liquid-card overflow-hidden divide-y divide-gray-200/30 dark:divide-white/10">
             
             {/* Dark Mode */}
             <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-xl shadow-md transition-colors ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-yellow-100 text-yellow-600'}`}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                 </div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} className="sr-only peer" />
                 <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
               </label>
            </div>

            {/* Liquid Glass */}
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl text-cyan-600 dark:text-cyan-300 shadow-md"><Droplets className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Liquid Glass</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={enableLiquid} onChange={toggleLiquid} className="sr-only peer" />
                 <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
               </label>
            </div>
            
            {/* Transparency Slider (Only when Liquid is enabled) */}
            {enableLiquid && (
               <div className="p-5 animate-slide-up">
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md"><Sliders className="w-5 h-5" /></div>
                       <div className="flex flex-col flex-1">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">Transparency</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{transparencyValue}% {transparencyValue === 100 ? '(Clear)' : ''}</span>
                       </div>
                   </div>
                   <input 
                       type="range" 
                       min="0" 
                       max="100" 
                       step="1"
                       value={transparencyValue} 
                       onChange={handleTransparencyChange}
                       className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                   />
               </div>
            )}

            {/* Animations Toggle */}
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-pink-100 dark:bg-pink-900/50 rounded-xl text-pink-600 dark:text-pink-300 shadow-md"><Zap className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Animations</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={enableAnimations} onChange={toggleAnimations} className="sr-only peer" />
                 <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500 shadow-inner"></div>
               </label>
            </div>

            {/* Animation Speed (Only if Animations enabled) */}
            {enableAnimations && (
               <div className="p-5 animate-slide-up">
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-orange-100 dark:bg-orange-900/50 rounded-xl text-orange-600 dark:text-orange-300 shadow-md"><Gauge className="w-5 h-5" /></div>
                       <span className="font-bold text-gray-900 dark:text-white text-sm">Speed</span>
                   </div>
                   <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      {(['fast', 'balanced', 'relaxed'] as const).map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setAnimationSpeed(speed)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                            animationSpeed === speed 
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                   </div>
               </div>
            )}

             {/* Notifications */}
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 shadow-md"><Bell className="w-5 h-5" /></div>
                 <div className="flex flex-col">
                   <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
                 </div>
               </div>
               <button 
                  onClick={enableNotifications}
                  className={`relative inline-flex items-center cursor-pointer transition-opacity ${isNotificationGranted ? 'opacity-100' : 'opacity-70'}`}
               >
                 <div className={`w-12 h-7 rounded-full transition-colors shadow-inner ${isNotificationGranted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-[3px] left-[3px] bg-white border border-gray-200 rounded-full h-5 w-5 transition-transform shadow-sm ${isNotificationGranted ? 'translate-x-full border-transparent' : ''}`}></div>
                 </div>
               </button>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className={`${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`} style={getAnimStyle(2)}>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ml-2 tracking-wider">Privacy</h3>
          <div className="liquid-card overflow-hidden divide-y divide-gray-200/30 dark:divide-white/10">
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-300 shadow-md"><Eye className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Private Profile</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={currentUser.isPrivateProfile} onChange={togglePrivateProfile} className="sr-only peer" />
                 <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 shadow-inner"></div>
               </label>
            </div>
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-300 shadow-md"><Lock className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Allow DM</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={currentUser.allowPrivateChat} onChange={togglePrivateChat} className="sr-only peer" />
                 <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
               </label>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section className={`${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`} style={getAnimStyle(3)}>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 ml-2 tracking-wider">Legal</h3>
          <div className="liquid-card overflow-hidden">
            <button onClick={() => setShowPrivacyPolicy(true)} className="w-full p-5 flex items-center justify-between hover:bg-white/20 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-green-100 dark:bg-green-900/50 rounded-xl text-green-600 dark:text-green-300 shadow-md"><Shield className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Privacy Policy</span>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className={`${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`} style={getAnimStyle(4)}>
          <h3 className="text-xs font-bold text-red-500/70 uppercase mb-3 ml-2 tracking-wider">Danger Zone</h3>
          <div className="liquid-card overflow-hidden divide-y divide-gray-200/30 dark:divide-white/10">
            <button onClick={handleLogout} className="w-full p-5 flex items-center justify-between text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl"><LogOut className="w-5 h-5" /></div>
                 <span className="font-bold">Log Out</span>
               </div>
            </button>
            <button onClick={handleDeactivate} className="w-full p-5 flex items-center justify-between text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-200 dark:bg-gray-800 rounded-xl"><Power className="w-5 h-5" /></div>
                 <span className="font-bold">Deactivate Account</span>
               </div>
            </button>
            <button onClick={handleDelete} className="w-full p-5 flex items-center justify-between text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl"><Trash2 className="w-5 h-5" /></div>
                 <span className="font-bold">Delete Account</span>
               </div>
            </button>
          </div>
        </section>

        <p className={`text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 opacity-50 ${enableAnimations ? 'animate-fade-in' : ''}`} style={{ animationDelay: '800ms' }}>FusionHub v1.3.4 LIQUID</p>

      </main>
    </div>
  );
};
