import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './screens/Auth';
import { HomeScreen } from './screens/Home';
import { ChatScreen } from './screens/Chat';
import { SearchScreen } from './screens/Search';
import { ProfileScreen } from './screens/Profile';
import { SettingsScreen } from './screens/Settings';
import { BottomNav } from './components/BottomNav';

const ProtectedLayout: React.FC = () => {
  const { currentUser } = useApp();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300 flex flex-col">
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
         {/* Settings has its own layout/header */}
         <Route path="/settings" element={<div className="w-full sm:max-w-md sm:mx-auto mesh-bg h-[100dvh] shadow-2xl relative overflow-hidden transition-colors duration-300"><SettingsScreen /></div>} />
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