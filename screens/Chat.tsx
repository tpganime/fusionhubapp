
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { User } from '../types';
import { Send, ArrowLeft, CheckCheck, ShieldCheck, Crown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BROADCAST_ID } from '../constants';

const formatLastSeen = (dateString?: string) => {
  if (!dateString) return 'Offline';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Last seen just now';
  if (diffInSeconds < 3600) return `Last seen ${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `Last seen ${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `Last seen ${Math.floor(diffInSeconds / 86400)}d ago`;
  return `Last seen ${date.toLocaleDateString()}`;
};

export const ChatScreen: React.FC = () => {
  const { currentUser, users, messages, sendMessage, markConversationAsRead, enableAnimations, checkIsAdmin, checkIsOwner, checkIsOnline, appConfig } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.targetUser) {
      setSelectedUser(location.state.targetUser);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (!appConfig.features.chat) {
    return <ComingSoon title="Chat" />;
  }

  const chatUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (currentUser?.friends.includes(u.id) || messages.some(m => 
        m.receiverId !== BROADCAST_ID && 
        ((m.senderId === u.id && m.receiverId === currentUser?.id) || (m.senderId === currentUser?.id && m.receiverId === u.id))
    ))
  );

  const getConversation = (userId: string) => {
    if (!currentUser) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === currentUser.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  };

  const conversation = selectedUser ? getConversation(selectedUser.id) : [];

  useEffect(() => {
    if (conversation.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation.length, selectedUser?.id]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      const hasUnread = conversation.some(m => 
        m.senderId === selectedUser.id && 
        m.receiverId === currentUser.id && 
        !m.read
      );
      
      if (hasUnread) {
        markConversationAsRead(selectedUser.id);
      }
    }
  }, [selectedUser, messages, currentUser, markConversationAsRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && selectedUser) {
      sendMessage(selectedUser.id, inputText);
      setInputText('');
    }
  };

  if (!selectedUser) {
    return (
      <div className="h-full overflow-y-auto pb-32 no-scrollbar gpu-accelerated" style={{ perspective: 'none', transformStyle: 'flat' }}>
        <TopBar />
        <main className="px-5 pt-2">
          <h1 className={`text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={{ animationFillMode: 'both' }}>Messages</h1>
          
          <div className="space-y-3">
            {chatUsers.length === 0 ? (
              <div className={`text-center py-10 opacity-50 ${enableAnimations ? 'animate-fade-in' : ''}`}>
                <p>No active chats.</p>
              </div>
            ) : (
              chatUsers.map((user, index) => {
                const userMsgs = getConversation(user.id);
                const lastMsg = userMsgs[userMsgs.length - 1];
                const hasUnread = lastMsg && lastMsg.senderId === user.id && !lastMsg.read;
                const isAdminUser = checkIsAdmin(user.email);
                const isOwnerUser = checkIsOwner(user.email);
                const isOnline = checkIsOnline(user.id);

                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center p-4 liquid-card hover:bg-white/40 dark:hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95 transform-gpu will-change-transform ${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`}
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                  >
                    <div className="relative">
                      <img src={user.avatar} alt={user.username} className={`w-14 h-14 rounded-full object-cover border-2 ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white/50'}`} />
                      {hasUnread && <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>}
                      {isOnline && !hasUnread && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse-slow"></span>}
                    </div>
                    <div className="ml-4 text-left flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className={`font-bold text-lg truncate flex items-center gap-1 ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {user.name || user.username}
                            {isOwnerUser ? <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" /> : isAdminUser ? <ShieldCheck className="w-3 h-3 text-blue-500" /> : null}
                        </h3>
                        {lastMsg && <span className="text-[10px] text-gray-500 font-medium">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      </div>
                      <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {lastMsg ? (lastMsg.senderId === currentUser?.id ? `You: ${lastMsg.content}` : lastMsg.content) : 'Tap to chat'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </main>
      </div>
    );
  }

  const isOwnerUser = checkIsOwner(selectedUser.email);
  const isAdminUser = checkIsAdmin(selectedUser.email);
  const isSelectedUserOnline = checkIsOnline(selectedUser.id);

  return (
    <div className={`h-full flex flex-col no-scrollbar gpu-accelerated ${enableAnimations ? 'animate-fade-in' : ''}`} style={{ perspective: 'none', transformStyle: 'flat' }}>
      {/* Liquid Header */}
      <div className="fixed top-4 left-4 right-4 h-16 glass-panel px-4 flex items-center z-40 justify-between">
        <div className="flex items-center gap-3">
            <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors text-gray-800 dark:text-white">
            <ArrowLeft className="w-6 h-6" />
            </button>
            <button 
            onClick={() => navigate(`/user/${selectedUser.id}`)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
            <div className={`relative ${enableAnimations ? 'animate-pop-in' : ''}`}>
                <img src={selectedUser.avatar} alt="avatar" className={`w-10 h-10 rounded-full object-cover border ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white/50'}`} />
                {isSelectedUserOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800 shadow-sm animate-pulse"></span>}
            </div>
            <div className={`flex flex-col items-start ${enableAnimations ? 'animate-slide-up' : ''}`}>
                <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1">
                    {selectedUser.name || selectedUser.username}
                    {isOwnerUser ? <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" /> : isAdminUser ? <ShieldCheck className="w-3 h-3 text-blue-500" /> : null}
                </span>
                <span className={`text-[10px] font-bold ${isSelectedUserOnline ? 'text-green-500' : 'text-gray-400'}`}>
                    {isSelectedUserOnline ? 'Online' : formatLastSeen(selectedUser.lastSeen)}
                </span>
            </div>
            </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-44 pt-24 no-scrollbar">
        {conversation.length === 0 ? (
           <div className={`text-center mt-20 opacity-50 ${enableAnimations ? 'animate-pop-in' : ''}`}>
             <div className="w-20 h-20 bg-white/30 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl">👋</div>
             <p className="text-sm text-gray-500 dark:text-gray-400">Say hello to {selectedUser.username}!</p>
           </div>
        ) : (
           conversation.map((msg, idx) => {
             const isMe = msg.senderId === currentUser?.id;
             const shouldAnimate = enableAnimations && idx >= conversation.length - 10;
             
             return (
               <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} transform-gpu will-change-transform ${shouldAnimate ? 'animate-slide-up-fade opacity-0' : ''}`} 
                  style={{ animationDelay: shouldAnimate ? `${(idx - (conversation.length - 10)) * 50}ms` : '0s', animationFillMode: 'both' }}
                >
                 <div className={`max-w-[80%] px-5 py-3 text-sm backdrop-blur-md shadow-sm border ${
                   isMe 
                     ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[1.5rem] rounded-br-sm border-transparent' 
                     : 'bg-white/60 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-[1.5rem] rounded-bl-sm border-white/40 dark:border-white/10'
                 }`}>
                   {msg.content}
                   <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                     <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     {isMe && (
                       <span title={msg.read ? "Read" : "Delivered"}>
                           <CheckCheck size={14} className={msg.read ? "text-green-300" : "text-blue-200"} />
                       </span>
                     )}
                   </div>
                 </div>
               </div>
             );
           })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`fixed bottom-28 left-0 right-0 px-4 z-[70] pointer-events-none ${enableAnimations ? 'animate-slide-up' : ''}`}>
        <form 
          onSubmit={handleSend} 
          className="pointer-events-auto flex items-center gap-2 p-1.5 shadow-2xl sm:max-w-md sm:mx-auto bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-[2rem]"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 bg-transparent px-5 py-3 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 font-medium"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()} 
            className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white shadow-lg disabled:opacity-50 transition-all hover:scale-110 active:scale-95"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
