
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Trash2, Power, ChevronRight, Moon, Sun, Zap, LayoutDashboard, Bell, Droplets, Sliders, ArrowRight as ArrowRightIcon, Users, Shield, MessageCircle, AlertTriangle, Copy, Gauge } from 'lucide-react';
import { PRIVACY_POLICY_TEXT } from '../constants';
import { LiquidSlider } from '../components/LiquidSlider';
import { LiquidToggle } from '../components/LiquidToggle';
import { GenericModal } from '../components/GenericModal';

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateProfile, logout, switchAccount, removeKnownAccount, knownAccounts, deleteAccount, deactivateAccount, theme, toggleTheme, enableAnimations, toggleAnimations, animationSpeed, setAnimationSpeed, enableLiquid, toggleLiquid, glassOpacity, setGlassOpacity, isAdmin, enableNotifications, notificationPermission, openSwitchAccountModal } = useApp();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Modal States
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const isNotificationGranted = notificationPermission === 'granted';

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleConfirmDelete = () => {
      deleteAccount();
      navigate('/');
  };

  const handleConfirmDeactivate = () => {
      deactivateAccount();
      navigate('/');
  };

  const transparencyValue = Math.round((1.0 - glassOpacity) * 100);
  const handleTransparencyChange = (val: number) => {
      const newOpacity = 1.0 - (val / 100.0);
      setGlassOpacity(Math.max(0, Math.min(1, newOpacity)));
  };

  const togglePrivateProfile = async () => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, isPrivateProfile: !currentUser.isPrivateProfile });
  };

  const toggleAllowMessages = async () => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, allowPrivateChat: !currentUser.allowPrivateChat });
  };

  const handleBack = () => {
      if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
      } else {
          navigate('/home');
      }
  };

  // ---------------- VIEW: PRIVACY POLICY ----------------
  if (showPrivacyPolicy) {
    return (
      <div className={`flex flex-col h-full ${enableAnimations ? 'animate-fade-in' : ''}`} style={{ transformStyle: 'flat', isolation: 'isolate' }}>
        <div className="flex-none p-4 z-[100] glass-panel mx-4 mt-4 flex items-center shadow-lg relative bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          <button 
             onClick={() => setShowPrivacyPolicy(false)} 
             className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative z-50 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <h2 className="text-lg font-bold ml-2 text-gray-900 dark:text-white">Privacy Policy</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-20">
          <div className="p-6 liquid-card whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {PRIVACY_POLICY_TEXT}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- VIEW: MAIN SETTINGS ----------------
  return (
    <div className={`flex flex-col h-full ${enableAnimations ? 'animate-fade-in' : ''}`} style={{ transformStyle: 'flat', isolation: 'isolate' }}>
      
      {/* Deactivate Modal */}
      <GenericModal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Account">
          <div className="text-center">
               <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Power className="w-8 h-8 text-gray-600 dark:text-gray-400" />
               </div>
               <p className="text-gray-600 dark:text-gray-300 mb-6">
                  This will temporarily disable your account. You can reactivate it anytime by logging back in.
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setShowDeactivateModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
                  <button onClick={handleConfirmDeactivate} className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold">Deactivate</button>
              </div>
          </div>
      </GenericModal>

      {/* Delete Modal */}
      <GenericModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
          <div className="text-center">
               <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
               </div>
               <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
                  This action is permanent and cannot be undone. All your data will be erased.
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
                  <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/30 hover:bg-red-700">Delete</button>
              </div>
          </div>
      </GenericModal>

      {/* Fixed Header - High Z-Index & Flat Transform */}
      <div className="flex-none mx-4 mt-4 z-[100] glass-panel p-3 flex items-center shadow-lg relative bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <button 
           onClick={handleBack} 
           className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative z-50 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Settings</h2>
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-40 space-y-6 max-w-md mx-auto w-full no-scrollbar relative z-10">
        
        {isAdmin && (
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Admin</h3>
            <div className="liquid-card relative z-0">
               <button onClick={() => navigate('/admin')} className="w-full p-5 flex items-center justify-between hover:bg-white/20 transition-colors group rounded-3xl relative z-10 cursor-pointer">
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
          <div className="liquid-card divide-y divide-gray-200/30 dark:divide-white/10 relative z-0">
             <div className="p-5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-xl shadow-md ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-yellow-100 text-yellow-600'}`}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                 </div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</span>
               </div>
               <div className="relative z-20"><LiquidToggle checked={theme === 'dark'} onChange={toggleTheme} /></div>
            </div>

            <div className="p-5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl text-cyan-600 dark:text-cyan-300 shadow-md"><Droplets className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Liquid Glass</span>
               </div>
               <div className="relative z-20"><LiquidToggle checked={enableLiquid} onChange={toggleLiquid} /></div>
            </div>
            
            {enableLiquid && (
               <div className="p-5 animate-slide-up relative z-10">
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md"><Sliders className="w-5 h-5" /></div>
                       <div className="flex flex-col flex-1">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">Transparency</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">{transparencyValue}%</span>
                       </div>
                   </div>
                   <div className="relative z-20"><LiquidSlider value={transparencyValue} onChange={handleTransparencyChange} /></div>
               </div>
            )}

            <div className="p-5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-pink-100 dark:bg-pink-900/50 rounded-xl text-pink-600 dark:text-pink-300 shadow-md"><Zap className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Animations</span>
               </div>
               <div className="relative z-20"><LiquidToggle checked={enableAnimations} onChange={toggleAnimations} /></div>
            </div>

            {enableAnimations && (
               <div className="p-5 animate-slide-up relative z-10">
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-orange-100 dark:bg-orange-900/50 rounded-xl text-orange-600 dark:text-orange-300 shadow-md"><Gauge className="w-5 h-5" /></div>
                       <span className="font-bold text-gray-900 dark:text-white text-sm">Speed</span>
                   </div>
                   <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl relative z-20">
                      {(['fast', 'balanced', 'relaxed'] as const).map((speed) => (
                        <button key={speed} onClick={() => setAnimationSpeed(speed)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${animationSpeed === speed ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>{speed}</button>
                      ))}
                   </div>
               </div>
            )}

            <div className="p-5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 shadow-md"><Bell className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
               </div>
               <div className="relative z-20"><LiquidToggle checked={isNotificationGranted} onChange={enableNotifications} /></div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Privacy</h3>
          <div className="liquid-card divide-y divide-gray-200/30 dark:divide-white/10 relative z-0">
            <div className="p-5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md">
                    <Lock className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Private Profile</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Only friends can see your info</span>
                 </div>
               </div>
               <div className="relative z-20"><LiquidToggle checked={currentUser.isPrivateProfile} onChange={togglePrivateProfile} /></div>
            </div>

            <div className="p-5 flex items-center justify-between relative z-10">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md">
                    <MessageCircle className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Allow Messages</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Receive chats from everyone</span>
                 </div>
               </div>
               <div className="relative z-20"><LiquidToggle checked={currentUser.allowPrivateChat} onChange={toggleAllowMessages} /></div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Legal</h3>
          <div className="liquid-card relative z-0">
            <button onClick={() => setShowPrivacyPolicy(true)} className="w-full p-5 flex items-center justify-between hover:bg-white/20 transition-colors rounded-3xl relative z-10 cursor-pointer">
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
          <div className="liquid-card divide-y divide-gray-200/30 dark:divide-white/10 relative z-0">
            <button onClick={() => setShowDeactivateModal(true)} className="w-full p-5 flex items-center justify-between text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/20 first:rounded-t-3xl last:rounded-b-3xl relative z-10 cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-200 dark:bg-gray-800 rounded-xl"><Power className="w-5 h-5" /></div>
                 <span className="font-bold">Deactivate</span>
               </div>
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="w-full p-5 flex items-center justify-between text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 first:rounded-t-3xl last:rounded-b-3xl relative z-10 cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl"><Trash2 className="w-5 h-5" /></div>
                 <span className="font-bold">Delete</span>
               </div>
            </button>
          </div>
        </section>

        <div className="flex gap-4 pb-8 relative z-10">
            {/* Switch Account Button */}
            <button 
              onClick={() => openSwitchAccountModal(true)}
              className="flex-1 py-4 flex flex-col items-center justify-center rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:bg-white/30 transition-all active:scale-95 group cursor-pointer"
            >
               <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-gray-800 dark:text-white">Switch Account</span>
            </button>

            {/* Log Out Button */}
            <button 
              onClick={handleLogout}
              className="flex-[2] py-4 flex items-center justify-between px-6 rounded-[2rem] border border-white/40 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-xl shadow-lg hover:bg-white/40 transition-all active:scale-95 group cursor-pointer"
            >
               <span className="text-lg font-bold text-gray-800 dark:text-white">Log Out</span>
               <div className="p-2 bg-white/50 dark:bg-white/10 rounded-full group-hover:translate-x-1 transition-transform border border-white/20">
                  <ArrowRightIcon className="w-5 h-5 text-gray-800 dark:text-white" />
               </div>
            </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 opacity-50 pb-10">FusionHub v1.3.5 LIQUID</p>

      </main>
    </div>
  );
};
