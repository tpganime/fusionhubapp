import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { User, Message } from '../types';
import { Send, ArrowLeft, CheckCheck, ShieldCheck, AlertTriangle, Crown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BROADCAST_ID } from '../constants';

export const ChatScreen: React.FC = () => {
  const { currentUser, users, messages, sendMessage, markConversationAsRead, enableAnimations, checkIsAdmin, checkIsOwner, appConfig } = useApp();
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
    if (selectedUser && currentUser) {
      const hasUnread = messages.some(m => 
        m.senderId === selectedUser.id && 
        m.receiverId === currentUser.id && 
        !m.read
      );
      if (hasUnread) {
        markConversationAsRead(selectedUser.id);
      }
    }
  }, [selectedUser, messages, currentUser, markConversationAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length, selectedUser?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && selectedUser) {
      sendMessage(selectedUser.id, inputText);
      setInputText('');
    }
  };

  if (!selectedUser) {
    return (
      <div className="h-full overflow-y-auto pb-24 transition-colors duration-300 scrollbar-hide">
        <TopBar />
        <main className="px-4 pt-2">
          <h1 className={`text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white transform-gpu ${enableAnimations ? 'animate-slide-in-right' : ''}`}>Chats</h1>
          
          <div className="space-y-2">
            {chatUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                <p>No chats yet.</p>
                <p className="text-sm">Go to Search to find people!</p>
              </div>
            ) : (
              chatUsers.map((user, index) => {
                const userMsgs = getConversation(user.id);
                const lastMsg = userMsgs[userMsgs.length - 1];
                const hasUnread = lastMsg && lastMsg.senderId === user.id && !lastMsg.read;
                const isAdminUser = checkIsAdmin(user.email);
                const isOwnerUser = checkIsOwner(user.email);

                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center p-3 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white dark:border-gray-800 hover:bg-white dark:hover:bg-white/5 transition-all hover:scale-[1.02] active:scale-95 transform-gpu ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                  >
                    <div className="relative">
                      <img src={user.avatar} alt={user.username} className={`w-12 h-12 rounded-full object-cover border ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`} />
                      {hasUnread && <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-dark-surface animate-pulse"></span>}
                      {isOwnerUser ? (
                         <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-[2px] shadow-sm"><Crown className="w-3 h-3 text-white fill-white" /></div>
                      ) : isAdminUser ? (
                         <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-[2px] shadow-sm"><ShieldCheck className="w-3 h-3 text-white" /></div>
                      ) : null}
                    </div>
                    <div className="ml-3 text-left flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`font-semibold truncate flex items-center gap-1 ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {user.username}
                            {isOwnerUser ? <span className="text-[10px] text-yellow-500">👑</span> : isAdminUser ? <span className="text-[10px] text-blue-500">🛡️</span> : null}
                        </h3>
                        {lastMsg && <span className="text-[10px] text-gray-400">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      </div>
                      <p className={`text-xs truncate ${hasUnread ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
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

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${enableAnimations ? 'animate-fade-in' : ''}`}>
      <div className="h-16 glass-panel dark:bg-dark-surface/80 flex items-center px-4 shadow-sm z-20 dark:border-gray-800">
        <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => navigate(`/user/${selectedUser.id}`)}
          className="flex items-center flex-1 hover:opacity-80 transition-opacity"
        >
          <img src={selectedUser.avatar} alt="avatar" className={`w-8 h-8 rounded-full object-cover ${isOwnerUser ? 'border-2 border-yellow-400' : isAdminUser ? 'border-2 border-blue-500' : ''}`} />
          <span className="ml-3 font-semibold text-gray-900 dark:text-white flex items-center gap-1">
              {selectedUser.username}
              {isOwnerUser ? <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" /> : isAdminUser ? <ShieldCheck className="w-3 h-3 text-blue-500" /> : null}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 scrollbar-hide">
        {conversation.length === 0 ? (
           <div className="text-center mt-10">
             <img src={selectedUser.avatar} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover opacity-50" />
             <p className="text-xs text-gray-400">Start a conversation with {selectedUser.username}</p>
           </div>
        ) : (
           conversation.map((msg, idx) => {
             const isMe = msg.senderId === currentUser?.id;
             // Only animate the last 10 messages to save resources on long chats
             const shouldAnimate = enableAnimations && idx >= conversation.length - 10;
             
             return (
               <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} transform-gpu ${shouldAnimate ? 'animate-slide-up opacity-0' : ''}`} 
                  style={{ animationDelay: shouldAnimate ? `${(idx - (conversation.length - 10)) * 50}ms` : '0s', animationFillMode: 'both' }}
                >
                 <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                   isMe 
                     ? 'bg-blue-500 text-white rounded-br-none' 
                     : 'bg-white dark:bg-dark-surface text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-none'
                 }`}>
                   {msg.content}
                   <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                     <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     {isMe && (
                       <span title={msg.read ? "Read" : "Delivered"}>
                           <CheckCheck size={16} className={msg.read ? "text-green-400" : "text-blue-200"} />
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

      <div className={`fixed bottom-20 left-0 right-0 px-4 z-30 pointer-events-none transform-gpu ${enableAnimations ? 'animate-slide-up' : ''}`}>
        <form onSubmit={handleSend} className="pointer-events-auto flex items-center gap-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl p-2 rounded-full shadow-lg border border-white/50 dark:border-gray-700 sm:max-w-md sm:mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button type="submit" disabled={!inputText.trim()} className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 disabled:opacity-50 transition-colors transform active:scale-90 duration-100 shadow-md">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};