import React, { useState } from 'react';
import { Bell, User as UserIcon, Settings, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const TopBar: React.FC = () => {
  const { currentUser, notifications, acceptFriendRequest, markNotificationRead } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAccept = (requesterId: string, notifId: string) => {
    acceptFriendRequest(requesterId);
    markNotificationRead(notifId);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-40 glass-panel dark:bg-dark-surface/80 dark:border-dark-border">
        {/* Left Side: Empty or Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-black">
            FusionHub
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors relative">
              <Bell className="w-6 h-6 text-gray-800 dark:text-gray-200" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-14 w-80 glass-panel dark:bg-dark-surface dark:border-dark-border rounded-2xl shadow-2xl p-2 z-50 overflow-hidden border border-white/50">
                 <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 px-3 py-2 border-b border-gray-100 dark:border-gray-800">Notifications</h3>
                 <div className="max-h-72 overflow-y-auto no-scrollbar">
                   {notifications.length === 0 ? (
                     <p className="p-6 text-sm text-gray-400 text-center">No notifications yet</p>
                   ) : (
                     notifications.map(n => (
                       <div key={n.id} className={`p-3 mb-1 rounded-xl transition-colors ${n.read ? 'opacity-60' : 'bg-white/40 dark:bg-white/5'}`}>
                         <div className="flex items-start gap-3">
                            {n.data?.avatar ? (
                                <img src={n.data.avatar} className="w-8 h-8 rounded-full object-cover border border-white dark:border-gray-700" alt="avatar" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300">
                                    <Bell className="w-4 h-4" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-tight">{n.content}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                
                                {n.type === 'friend_request' && n.data?.requesterId && !n.read && (
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => handleAccept(n.data.requesterId, n.id)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5 rounded-lg font-medium transition-colors"
                                        >
                                            Confirm
                                        </button>
                                        <button className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded-lg font-medium transition-colors">
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </div>
            )}
          </div>

          {/* Profile or Settings Button based on Route */}
          {location.pathname === '/profile' ? (
             <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors">
               <Settings className="w-6 h-6 text-gray-800 dark:text-gray-200" />
             </button>
          ) : (
             <button onClick={() => navigate('/profile')} className="relative group">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-md group-hover:scale-105 transition-transform">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                       <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
             </button>
          )}
        </div>
      </div>
      {/* Spacer for fixed header */}
      <div className="h-16"></div> 
    </>
  );
};