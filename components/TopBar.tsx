import React, { useState } from 'react';
import { Bell, User as UserIcon, Settings, MessageCircle, Shield, Crown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Notification } from '../types';

export const TopBar: React.FC = () => {
  const { currentUser, notifications, acceptFriendRequest, markNotificationRead, checkIsAdmin, checkIsOwner, enableAnimations } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAccept = (requesterId: string, notifId: string) => {
    acceptFriendRequest(requesterId);
    markNotificationRead(notifId);
  };

  const handleNotificationClick = (n: Notification) => {
    if (n.type === 'message' && n.data?.targetUser) {
      navigate('/chat', { state: { targetUser: n.data.targetUser } });
      setShowNotifs(false);
      markNotificationRead(n.id);
    }
  };

  const isOwnerUser = currentUser ? checkIsOwner(currentUser.email) : false;
  const isAdminUser = currentUser ? checkIsAdmin(currentUser.email) : false;

  return (
    <>
      <div className={`fixed top-4 left-4 right-4 h-16 px-5 flex items-center justify-between z-40 glass-panel shadow-lg ${enableAnimations ? 'animate-slide-down' : ''}`}>
        {/* Left Side: Brand with New SVG Logo */}
        <div className="flex items-center gap-3">
           <svg 
             viewBox="0 0 100 100" 
             className="w-9 h-9 drop-shadow-md animate-float"
             style={{ animationDuration: '8s' }}
             fill="none" 
             xmlns="http://www.w3.org/2000/svg"
           >
             <defs>
               <linearGradient id="logo_grad_top" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#3B82F6" />
                 <stop offset="100%" stopColor="#8B5CF6" />
               </linearGradient>
             </defs>
             <circle cx="50" cy="50" r="15" fill="url(#logo_grad_top)" />
             <ellipse cx="50" cy="50" rx="40" ry="12" stroke="url(#logo_grad_top)" strokeWidth="6" transform="rotate(0 50 50)" />
             <ellipse cx="50" cy="50" rx="40" ry="12" stroke="url(#logo_grad_top)" strokeWidth="6" transform="rotate(60 50 50)" />
             <ellipse cx="50" cy="50" rx="40" ry="12" stroke="url(#logo_grad_top)" strokeWidth="6" transform="rotate(120 50 50)" />
           </svg>
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
             FusionHub
           </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="p-2.5 rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-all relative active:scale-95">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown - Liquid Style */}
            {showNotifs && (
              <div className={`absolute right-0 top-16 w-80 glass-panel p-2 z-50 overflow-hidden ${enableAnimations ? 'animate-pop-in' : ''}`}>
                 <div className="px-3 py-2 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">Notifications</h3>
                    <span className="text-[10px] bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                 </div>
                 <div className="max-h-72 overflow-y-auto no-scrollbar pt-2">
                   {notifications.length === 0 ? (
                     <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                        <Bell className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">All caught up!</p>
                     </div>
                   ) : (
                     notifications.map(n => (
                       <div 
                         key={n.id} 
                         onClick={() => n.type === 'message' ? handleNotificationClick(n) : undefined}
                         className={`p-3 mb-2 rounded-2xl transition-all border border-transparent ${n.read ? 'opacity-60' : 'bg-white/40 dark:bg-white/10 border-white/40 shadow-sm'} ${n.type === 'message' ? 'cursor-pointer hover:bg-white/60 dark:hover:bg-white/20' : ''}`}
                       >
                         <div className="flex items-start gap-3">
                            {n.data?.avatar ? (
                                <img src={n.data.avatar} className="w-9 h-9 rounded-full object-cover border border-white/50 shadow-sm" alt="avatar" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-500">
                                    {n.type === 'message' ? <MessageCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">{n.content}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                
                                {n.type === 'friend_request' && n.data?.requesterId && !n.read && (
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleAccept(n.data.requesterId, n.id); }}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] py-1.5 rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }}
                                            className="flex-1 bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 text-gray-600 dark:text-gray-300 text-[10px] py-1.5 rounded-lg font-bold active:scale-95 transition-transform"
                                        >
                                            Ignore
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

          {/* Profile / Settings Button */}
          {location.pathname === '/profile' ? (
             <button onClick={() => navigate('/settings')} className="p-2.5 rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-all active:scale-95">
               <Settings className="w-5 h-5 text-gray-700 dark:text-gray-200" />
             </button>
          ) : (
             <button onClick={() => navigate('/profile')} className="relative group">
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 dark:border-white/20 shadow-lg group-hover:scale-105 transition-transform ${enableAnimations ? 'animate-pop-in' : ''}`}>
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                       <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Badges */}
                {isOwnerUser && (
                   <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 border border-white shadow-sm animate-bounce-soft">
                      <Crown className="w-3 h-3 text-white fill-white" />
                   </div>
                )}
             </button>
          )}
        </div>
      </div>
      {/* Spacer because TopBar is fixed */}
      <div className="h-24"></div> 
    </>
  );
};