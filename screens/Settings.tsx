
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, Trash2, LogOut, Shield, ChevronRight, Moon, Sun, Zap, LayoutDashboard, Bell, Droplets, Sliders, Power, Gauge, ArrowRight as ArrowRightIcon, Users, Plus, X } from 'lucide-react';
import { PRIVACY_POLICY_TEXT } from '../constants';
import { LiquidSlider } from '../components/LiquidSlider';
import { LiquidToggle } from '../components/LiquidToggle';

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateProfile, logout, switchAccount, removeKnownAccount, knownAccounts, deleteAccount, deactivateAccount, theme, toggleTheme, enableAnimations, toggleAnimations, animationSpeed, setAnimationSpeed, enableLiquid, toggleLiquid, glassOpacity, setGlassOpacity, isAdmin, enableNotifications, notificationPermission } = useApp();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  
  const isNotificationGranted = notificationPermission === 'granted';

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchClick = (user: any) => {
      switchAccount(user);
      navigate('/home');
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete your account?")) {
      deleteAccount();
      navigate('/');
    }
  };

  const handleDeactivate = () => {
      if (window.confirm("Deactivate your account?")) {
          deactivateAccount();
          navigate('/');
      }
  };

  const transparencyValue = Math.round((1.0 - glassOpacity) * 100);
  const handleTransparencyChange = (val: number) => {
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
        <div className={`p-6 liquid-card mx-4 mb-20 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed`}>
          {PRIVACY_POLICY_TEXT}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto pb-32 no-scrollbar ${enableAnimations ? 'animate-fade-in' : ''}`}>
      
      {/* Switch Account Modal */}
      {showAccountModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white/90 dark:bg-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/20 animate-pop-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Switch Account</h3>
                      <button onClick={() => setShowAccountModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                          <X className="w-5 h-5 text-gray-500" />
                      </button>
                  </div>
                  
                  <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto no-scrollbar">
                      {knownAccounts.length === 0 ? (
                          <p className="text-center text-gray-500 text-sm py-4">No other accounts saved.</p>
                      ) : (
                          knownAccounts.map(acc => (
                              <div key={acc.id} className="group relative flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                                  <button onClick={() => handleSwitchClick(acc)} className="flex items-center gap-3 flex-1 text-left">
                                      <img src={acc.avatar} alt="av" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                      <div>
                                          <p className={`font-bold text-sm ${acc.id === currentUser.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                              {acc.username}
                                          </p>
                                          <p className="text-xs text-gray-500">{acc.id === currentUser.id ? 'Active' : 'Tap to switch'}</p>
                                      </div>
                                  </button>
                                  {acc.id !== currentUser.id && (
                                      <button onClick={() => removeKnownAccount(acc.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  )}
                              </div>
                          ))
                      )}
                  </div>

                  <button 
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                  >
                      <Plus className="w-5 h-5" /> Add New Account
                  </button>
              </div>
          </div>
      )}

      <div className="sticky top-4 mx-4 z-50 glass-panel p-3 flex items-center mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Settings</h2>
      </div>

      <main className="px-5 space-y-6 max-w-md mx-auto">
        
        {isAdmin && (
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Admin</h3>
            <div className="liquid-card overflow-hidden">
               <button onClick={() => navigate('/admin')} className="w-full p-5 flex items-center justify-between hover:bg-white/20 transition-colors group">
                 <div className="flex items-center gap-4">
                   <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white shadow-lg"><LayoutDashboard className="w-5 h-5" /></div>
                   <span className="font-bold text-gray-900 dark:text-white">Admin Panel</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Appearance</h3>
          <div className="liquid-card overflow-hidden divide-y divide-gray-200/30 dark:divide-white/10">
             <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-xl shadow-md ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-yellow-100 text-yellow-600'}`}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                 </div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</span>
               </div>
               <LiquidToggle checked={theme === 'dark'} onChange={toggleTheme} />
            </div>

            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl text-cyan-600 dark:text-cyan-300 shadow-md"><Droplets className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Liquid Glass</span>
               </div>
               <LiquidToggle checked={enableLiquid} onChange={toggleLiquid} />
            </div>
            
            {enableLiquid && (
               <div className="p-5 animate-slide-up">
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md"><Sliders className="w-5 h-5" /></div>
                       <div className="flex flex-col flex-1">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">Transparency</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{transparencyValue}%</span>
                       </div>
                   </div>
                   <LiquidSlider value={transparencyValue} onChange={handleTransparencyChange} />
               </div>
            )}

            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-pink-100 dark:bg-pink-900/50 rounded-xl text-pink-600 dark:text-pink-300 shadow-md"><Zap className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Animations</span>
               </div>
               <LiquidToggle checked={enableAnimations} onChange={toggleAnimations} />
            </div>

            {enableAnimations && (
               <div className="p-5 animate-slide-up">
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-orange-100 dark:bg-orange-900/50 rounded-xl text-orange-600 dark:text-orange-300 shadow-md"><Gauge className="w-5 h-5" /></div>
                       <span className="font-bold text-gray-900 dark:text-white text-sm">Speed</span>
                   </div>
                   <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      {(['fast', 'balanced', 'relaxed'] as const).map((speed) => (
                        <button key={speed} onClick={() => setAnimationSpeed(speed)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize ${animationSpeed === speed ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>{speed}</button>
                      ))}
                   </div>
               </div>
            )}

            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 shadow-md"><Bell className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
               </div>
               <LiquidToggle checked={isNotificationGranted} onChange={enableNotifications} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Legal</h3>
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

        <section>
          <h3 className="text-xs font-bold text-red-500/70 uppercase mb-3 ml-2 tracking-wider">Danger Zone</h3>
          <div className="liquid-card overflow-hidden divide-y divide-gray-200/30 dark:divide-white/10">
            <button onClick={handleDeactivate} className="w-full p-5 flex items-center justify-between text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/20">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-200 dark:bg-gray-800 rounded-xl"><Power className="w-5 h-5" /></div>
                 <span className="font-bold">Deactivate</span>
               </div>
            </button>
            <button onClick={handleDelete} className="w-full p-5 flex items-center justify-between text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl"><Trash2 className="w-5 h-5" /></div>
                 <span className="font-bold">Delete</span>
               </div>
            </button>
          </div>
        </section>

        <div className="flex gap-4">
            {/* Switch Account Button */}
            <button 
              onClick={() => setShowAccountModal(true)}
              className="flex-1 py-4 flex flex-col items-center justify-center rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:bg-white/30 transition-all active:scale-95 group"
            >
               <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-gray-800 dark:text-white">Switch Account</span>
            </button>

            {/* Glass Capsule Log Out Button */}
            <button 
              onClick={handleLogout}
              className="flex-[2] py-4 flex items-center justify-between px-6 rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:bg-white/40 transition-all active:scale-95 group"
            >
               <span className="text-lg font-bold text-gray-800 dark:text-white">Log Out</span>
               <div className="p-2 bg-white/50 dark:bg-white/10 rounded-full group-hover:translate-x-1 transition-transform border border-white/20">
                  <ArrowRightIcon className="w-5 h-5 text-gray-800 dark:text-white" />
               </div>
            </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 opacity-50">FusionHub v1.3.4 LIQUID</p>

      </main>
    </div>
  );
};
