import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, Trash2, LogOut, Shield, ChevronRight, Moon, Sun, Zap } from 'lucide-react';
import { PRIVACY_POLICY_TEXT } from '../constants';

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateProfile, logout, deleteAccount, theme, toggleTheme, enableAnimations, toggleAnimations } = useApp();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

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

  if (showPrivacyPolicy) {
    return (
      <div className="h-full overflow-y-auto bg-white dark:bg-dark-bg scrollbar-hide">
        <div className="sticky top-0 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex items-center z-50">
          <button onClick={() => setShowPrivacyPolicy(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-900 dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold ml-2 text-gray-900 dark:text-white">Privacy Policy</h2>
        </div>
        <div className="p-6 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
          {PRIVACY_POLICY_TEXT}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto transition-colors duration-300 scrollbar-hide ${enableAnimations ? 'animate-fade-in' : ''}`}>
      <div className="sticky top-0 bg-white/60 dark:bg-dark-surface/80 backdrop-blur-md border-b border-white/50 dark:border-gray-800 p-4 flex items-center z-50">
        <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 text-gray-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Settings</h2>
      </div>

      <main className="p-4 space-y-6 max-w-md mx-auto pb-24">
        
        {/* Appearance */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-3">Appearance</h3>
          <div className="bg-white/70 dark:bg-dark-surface rounded-2xl shadow-sm border border-white/50 dark:border-gray-800 overflow-hidden">
             <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-yellow-100 text-yellow-600'}`}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                 </div>
                 <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
               </label>
            </div>
            <div className="p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg text-pink-600 dark:text-pink-300"><Zap className="w-5 h-5" /></div>
                 <span className="font-medium text-gray-900 dark:text-white">Animations</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={enableAnimations} onChange={toggleAnimations} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
               </label>
            </div>
          </div>
        </section>

        {/* Privacy Controls */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-3">Privacy</h3>
          <div className="bg-white/70 dark:bg-dark-surface rounded-2xl shadow-sm border border-white/50 dark:border-gray-800 overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300"><Eye className="w-5 h-5" /></div>
                 <span className="font-medium text-gray-900 dark:text-white">Private Profile</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={currentUser.isPrivateProfile} onChange={togglePrivateProfile} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
               </label>
            </div>
            <div className="p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300"><Lock className="w-5 h-5" /></div>
                 <span className="font-medium text-gray-900 dark:text-white">Allow Private Chats</span>
               </div>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={currentUser.allowPrivateChat} onChange={togglePrivateChat} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
               </label>
            </div>
          </div>
        </section>

        {/* Information */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-3">Legal</h3>
          <div className="bg-white/70 dark:bg-dark-surface rounded-2xl shadow-sm border border-white/50 dark:border-gray-800 overflow-hidden">
            <button onClick={() => setShowPrivacyPolicy(true)} className="w-full p-4 flex items-center justify-between hover:bg-white/80 dark:hover:bg-white/5 transition-colors">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300"><Shield className="w-5 h-5" /></div>
                 <span className="font-medium text-gray-900 dark:text-white">Privacy Policy</span>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 ml-3">Account</h3>
          <div className="bg-white/70 dark:bg-dark-surface rounded-2xl shadow-sm border border-white/50 dark:border-gray-800 overflow-hidden">
            <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border-b border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg"><LogOut className="w-5 h-5" /></div>
                 <span className="font-medium">Log Out</span>
               </div>
            </button>
            <button onClick={() => alert("Account Deactivated (Simulation)")} className="w-full p-4 flex items-center justify-between text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Lock className="w-5 h-5" /></div>
                 <span className="font-medium">Deactivate Account</span>
               </div>
            </button>
            <button onClick={handleDelete} className="w-full p-4 flex items-center justify-between text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg"><Trash2 className="w-5 h-5" /></div>
                 <span className="font-medium">Delete Account</span>
               </div>
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 mt-8">FusionHub v1.4.0</p>

      </main>
    </div>
  );
};