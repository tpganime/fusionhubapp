
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Search as SearchIcon, UserPlus, Check, MessageCircle, ShieldCheck, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SearchScreen: React.FC = () => {
  const { users, currentUser, sendFriendRequest, enableAnimations, checkIsAdmin, checkIsOwner, checkIsOnline, appConfig } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!appConfig.features.search) {
    return <ComingSoon title="Search" />;
  }

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.username.toLowerCase().includes(query.toLowerCase()) || (u.name && u.name.toLowerCase().includes(query.toLowerCase())))
  );

  const isFriend = (userId: string) => currentUser?.friends.includes(userId);
  const isRequestSent = (user: any) => {
      const reqs = user.requests || [];
      return reqs.includes(currentUser?.id);
  };

  const handleRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sendFriendRequest(id);
  };

  const handleMessage = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    navigate('/chat', { state: { targetUser: user } });
  };

  return (
    <div className="h-full overflow-y-auto pb-32 no-scrollbar gpu-accelerated">
      <TopBar />
      <main className="px-5 pt-2">
        <h1 className={`text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationFillMode: 'both' }}>Discover</h1>
        
        <div className={`relative mb-6 transform-gpu ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <SearchIcon className="absolute left-5 top-4 text-gray-500 w-5 h-5 z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-14 pr-4 py-4 liquid-input text-gray-900 dark:text-white placeholder-gray-500 font-medium shadow-sm transition-all focus:scale-[1.02]"
          />
        </div>

        <div className="space-y-3">
          {query && filteredUsers.length === 0 && (
            <div className={`text-center py-10 opacity-50 ${enableAnimations ? 'animate-heavy-fade-in' : ''}`}>
                <p>No users found.</p>
            </div>
          )}
          
          {filteredUsers.map((user, index) => {
            const canMessage = isFriend(user.id) || user.allowPrivateChat;
            const isAdminUser = checkIsAdmin(user.email);
            const isOwnerUser = checkIsOwner(user.email);
            const isOnline = checkIsOnline(user.id);
            const requested = isRequestSent(user);
            
            return (
              <div 
                key={user.id} 
                onClick={() => navigate(`/user/${user.id}`)}
                className={`liquid-card p-4 flex items-center justify-between transition-all hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer group hover:scale-[1.02] transform-gpu will-change-transform ${enableAnimations ? 'animate-slide-up-heavy' : ''}`}
                style={{ animationDelay: `${200 + (index * 60)}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                      <img src={user.avatar} alt={user.username} className={`w-14 h-14 rounded-full object-cover border-2 ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white/50 shadow-sm'}`} />
                      {isOnline && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse-slow"></span>}
                      {isOwnerUser ? (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-sm">
                          <Crown className="w-3 h-3 text-white fill-white" />
                        </div>
                      ) : isAdminUser ? (
                        <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-sm">
                          <ShieldCheck className="w-3 h-3 text-white" />
                        </div>
                      ) : null}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      {user.username}
                    </h3>
                    {user.name && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{user.name}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[140px]">
                        {user.description || "No bio"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {canMessage && (
                    <button
                      onClick={(e) => handleMessage(e, user)}
                      className="p-2.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20 active:scale-95"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}

                  {isFriend(user.id) ? (
                    <span className="px-3 py-1.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-full font-bold border border-green-500/20">Friend</span>
                  ) : (
                    <button 
                      onClick={(e) => handleRequest(e, user.id)}
                      disabled={requested}
                      className={`p-2.5 rounded-full transition-colors border active:scale-95 ${requested ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent' : 'bg-gray-100/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/50 border-gray-200 dark:border-gray-700'}`}
                    >
                      {requested ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
