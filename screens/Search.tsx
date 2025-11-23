
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Search as SearchIcon, UserPlus, Check, MessageCircle, ShieldCheck, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SearchScreen: React.FC = () => {
  const { users, currentUser, sendFriendRequest, enableAnimations, checkIsAdmin, checkIsOwner, appConfig } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  if (!appConfig.features.search) {
    return <ComingSoon title="Search" />;
  }

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  const isFriend = (userId: string) => currentUser?.friends.includes(userId);
  const [requested, setRequested] = useState<string[]>([]); 

  const handleRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sendFriendRequest(id);
    setRequested(prev => [...prev, id]);
  };

  const handleMessage = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    navigate('/chat', { state: { targetUser: user } });
  };

  return (
    <div className="h-full overflow-y-auto pb-24 transition-colors duration-300 scrollbar-hide">
      <TopBar />
      <main className="px-4 pt-4">
        <h1 className={`text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white ${enableAnimations ? 'animate-slide-in-right' : ''}`}>Search</h1>
        
        <div className={`relative mb-6 ${enableAnimations ? 'animate-elastic-up' : ''}`}>
          <SearchIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/60 dark:bg-dark-surface/60 backdrop-blur-sm border border-white/50 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-gray-900 dark:text-white transition-colors"
          />
        </div>

        <div className="space-y-3">
          {query && filteredUsers.length === 0 && (
            <p className="text-center text-gray-500 mt-10">No users found.</p>
          )}
          
          {filteredUsers.map((user, index) => {
            const canMessage = isFriend(user.id) || user.allowPrivateChat;
            const isAdminUser = checkIsAdmin(user.email);
            const isOwnerUser = checkIsOwner(user.email);
            
            return (
              <div 
                key={user.id} 
                onClick={() => navigate(`/user/${user.id}`)}
                className={`bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm border ${isOwnerUser ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : isAdminUser ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/50 dark:border-gray-700'} flex items-center justify-between transition-all hover:bg-white/90 dark:hover:bg-dark-surface/90 cursor-pointer group hover:scale-[1.02] ${enableAnimations ? 'animate-slide-up' : ''}`}
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                      <img src={user.avatar} alt={user.username} className={`w-12 h-12 rounded-full object-cover border ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-gray-100 dark:border-gray-700'}`} />
                      {isOwnerUser ? (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-sm animate-bounce">
                          <Crown className="w-3 h-3 text-white fill-white" />
                        </div>
                      ) : isAdminUser ? (
                        <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-sm animate-bounce">
                          <ShieldCheck className="w-3 h-3 text-white" />
                        </div>
                      ) : null}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {user.username}
                      {isOwnerUser ? (
                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">OWNER</span>
                      ) : isAdminUser ? (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>
                      ) : null}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[150px]">
                        {user.description || "No bio"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {canMessage && (
                    <button
                      onClick={(e) => handleMessage(e, user)}
                      className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      title="Send Message"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}

                  {isFriend(user.id) ? (
                    <span className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-full font-medium">Friend</span>
                  ) : (
                    <button 
                      onClick={(e) => handleRequest(e, user.id)}
                      disabled={requested.includes(user.id)}
                      className={`p-2 rounded-full transition-colors ${requested.includes(user.id) ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      title={requested.includes(user.id) ? "Request Sent" : "Add Friend"}
                    >
                      {requested.includes(user.id) ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
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
