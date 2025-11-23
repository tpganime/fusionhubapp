
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-white/50 dark:border-gray-700 transform transition-all scale-100 animate-elastic-up">
        <div className="flex justify-center mb-4">
           <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-500 animate-bounce">
              <Bell className="w-8 h-8 fill-blue-500" />
           </div>
        </div>
        <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Enable Notifications?</h3>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Stay connected! Get instant alerts for new messages and friend requests.
        </p>
        <div className="flex gap-3">
           <button 
             onClick={closePermissionPrompt}
             className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
           >
             Later
           </button>
           <button 
             onClick={enableNotifications}
             className="flex-1 py-3 rounded-xl font-semibold bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all active:scale-95"
           >
             Allow
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
         <Route path="/" element={<AuthScreen />} />
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
