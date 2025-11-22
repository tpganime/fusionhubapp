import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { Search as SearchIcon, UserPlus, Check, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SearchScreen: React.FC = () => {
  const { users, currentUser, sendFriendRequest } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  const isFriend = (userId: string) => currentUser?.friends.includes(userId);
  const [requested, setRequested] = useState<string[]>([]); 

  const handleRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent navigating to profile
    sendFriendRequest(id);
    setRequested(prev => [...prev, id]);
  };

  const handleMessage = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    navigate('/chat', { state: { targetUser: user } });
  };

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300">
      <TopBar />
      <main className="px-4 pt-4">
        <h1 className="text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white">Search</h1>
        
        <div className="relative mb-6">
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
          
          {filteredUsers.map(user => {
            const canMessage = isFriend(user.id) || user.allowPrivateChat;
            
            return (
              <div 
                key={user.id} 
                onClick={() => navigate(`/user/${user.id}`)}
                className="bg-white/70 dark:bg-dark-surface/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 dark:border-gray-700 flex items-center justify-between transition-all hover:bg-white/90 dark:hover:bg-dark-surface/90 cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.username}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[150px]">{user.description || "No bio"}</p>
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