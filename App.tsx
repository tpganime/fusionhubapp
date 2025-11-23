
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
import { Bell, X } from 'lucide-react';

const NotificationModal: React.FC = () => {
  const { showPermissionPrompt, enableNotifications, closePermissionPrompt } = useApp();

  if (!showPermissionPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-white/50 dark:border-gray-700 transform transition-all scale-100 animate-fade-in">
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

const ProtectedLayout: React.FC = () => {
  const { currentUser } = useApp();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300 flex flex-col">
      <NotificationModal />
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
         <Route path="/settings" element={<div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300"><SettingsScreen /></div>} />
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