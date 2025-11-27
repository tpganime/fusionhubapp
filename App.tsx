
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './screens/Auth';
import { HomeScreen } from './screens/Home';
import { ChatScreen } from './screens/Chat';
import { SearchScreen } from './screens/Search';
import { ProfileScreen } from './screens/Profile';
import { SettingsScreen } from './screens/Settings';
import { AdminPanelScreen } from './screens/AdminPanel';
import { BottomNav } from './components/BottomNav';
import { Bell, X, Trash2, Plus } from 'lucide-react';

const NotificationModal: React.FC = () => {
  const { showPermissionPrompt, enableNotifications, closePermissionPrompt } = useApp();

  if (!showPermissionPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-white/50 dark:border-gray-700 transform transition-all scale-100 animate-pop-in">
        <div className="flex justify-center mb-5">
           <div className="p-4 bg-gradient-to-tr from-blue-400 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/40 animate-pulse-slow">
              <Bell className="w-8 h-8 text-white fill-white" />
           </div>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Enable Notifications</h3>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
          Don't miss out! Get instant alerts for new messages, friend requests, and updates.
        </p>
        <div className="flex flex-col gap-3">
           <button 
             onClick={enableNotifications}
             className="w-full py-3.5 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
           >
             Allow Notifications
           </button>
           <button 
             onClick={closePermissionPrompt}
             className="w-full py-3 rounded-xl font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
           >
             Maybe Later
           </button>
        </div>
      </div>
    </div>
  );
};

const SwitchAccountModal: React.FC = () => {
    const { isSwitchAccountModalOpen, openSwitchAccountModal, knownAccounts, currentUser, switchAccount, removeKnownAccount, logout } = useApp();
    const navigate = useNavigateSafe(); // Helper needed since App is outside Router context usually, but here components are inside Router

    if (!isSwitchAccountModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white/90 dark:bg-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/20 animate-pop-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Switch Account</h3>
                    <button onClick={() => openSwitchAccountModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto no-scrollbar">
                    {knownAccounts.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">No other accounts saved.</p>
                    ) : (
                        knownAccounts.map(acc => (
                            <div key={acc.id} className="group relative flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                                <button 
                                    onClick={() => { switchAccount(acc); navigate('/home'); }} 
                                    className="flex items-center gap-3 flex-1 text-left"
                                >
                                    <img src={acc.avatar} alt="av" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                    <div>
                                        <p className={`font-bold text-sm ${acc.id === currentUser?.id ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                            {acc.username}
                                        </p>
                                        <p className="text-xs text-gray-500">{acc.id === currentUser?.id ? 'Active' : 'Tap to switch'}</p>
                                    </div>
                                </button>
                                {acc.id !== currentUser?.id && (
                                    <button onClick={() => removeKnownAccount(acc.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <button 
                  onClick={() => { logout(); navigate('/'); openSwitchAccountModal(false); }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5" /> Add New Account
                </button>
            </div>
        </div>
    );
};

// Helper hook to access navigation safely
import { useNavigate } from 'react-router-dom';
const useNavigateSafe = () => {
    try {
        return useNavigate();
    } catch {
        return (path: string) => window.location.hash = path;
    }
}

const ProtectedLayout: React.FC = () => {
  const { currentUser } = useApp();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300 flex flex-col">
      <NotificationModal />
      <SwitchAccountModal />
      <Outlet />
      <BottomNav />
    </div>
  );
};

const MainRouter: React.FC = () => {
  return (
    <Router>
       <Routes>
         <Route path="/" element={
           <div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300 flex flex-col">
             <AuthScreen />
           </div>
         } />
         <Route element={<ProtectedLayout />}>
           <Route path="/home" element={<HomeScreen />} />
           <Route path="/chat" element={<ChatScreen />} />
           <Route path="/search" element={<SearchScreen />} />
           <Route path="/profile" element={<ProfileScreen />} />
           <Route path="/user/:userId" element={<ProfileScreen />} />
         </Route>
         <Route path="/settings" element={<div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300"><SettingsScreen /><SwitchAccountModal /></div>} />
         <Route path="/admin" element={<div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300"><AdminPanelScreen /></div>} />
       </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainRouter />
    </AppProvider>
  );
};

export default App;
