
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { User } from '../types';
import { Send, ArrowLeft, CheckCheck, ShieldCheck, Crown, Info, Ban } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const { currentUser, users, messages, sendMessage, sendTypingSignal, typingStatus, markConversationAsRead, enableAnimations, checkIsAdmin, checkIsOwner, checkIsOnline, appConfig } = useApp();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive selected user from URL query param 'uid'
  const uid = searchParams.get('uid');
  const selectedUser = useMemo(() => {
    return users.find(u => u.id === uid) || null;
  }, [users, uid]);

  const setSelectedUser = (user: User | null) => {
    if (user) {
        navigate(`/chat?uid=${user.id}`);
    } else {
        navigate('/chat');
    }
  };

  if (!appConfig.features.chat) {
    return <ComingSoon title="Chat" />;
  }

  // Memoize Chat List to prevent lag on every render/keystroke
  const chatUsers = useMemo(() => {
    if (!currentUser) return [];
    
    // Filter out users who blocked current user from list if desired, or keep them.
    // Keeping them allows viewing history.
    
    return users.filter(u => 
        u.id !== currentUser?.id && 
        !u.isDeactivated && // Hide deactivated users from main list? or show them. Let's hide.
        !currentUser.blockedUsers.includes(u.id) && // Hide users I blocked
        (currentUser?.friends.includes(u.id) || messages.some(m => 
            m.receiverId !== BROADCAST_ID && 
            ((m.senderId === u.id && m.receiverId === currentUser?.id) || (m.senderId === currentUser?.id && m.receiverId === u.id))
        ))
    );
  }, [users, currentUser, messages]);

  // Memoize Conversation to prevent lag
  const conversation = useMemo(() => {
    if (!currentUser || !selectedUser) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
      (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, currentUser, selectedUser]);

  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
  }, [selectedUser, conversation, currentUser, markConversationAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
      
      // Throttle typing signal to once every 2 seconds
      const now = Date.now();
      if (selectedUser && now - lastTypingSentRef.current > 2000) {
          sendTypingSignal(selectedUser.id);
          lastTypingSentRef.current = now;
      }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    
    try {
      await sendMessage(selectedUser.id, text);
    } catch (error) {
      console.error("Failed to send message", error);
      setInputText(text); // Restore on error
      alert("Failed to send message. Please try again.");
    }
  };

  const handleProfileClick = (e: React.MouseEvent, userId?: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    const targetId = userId || selectedUser?.id;
    if (targetId) {
        navigate(`/user/${targetId}`);
    }
  };

  // ---------------- VIEW: CHAT LIST ----------------
  if (!selectedUser) {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <TopBar />
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-2 pb-24">
          <h1 className={`text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={{ animationFillMode: 'both' }}>Messages</h1>
          
          <div className="space-y-3">
            {chatUsers.length === 0 ? (
              <div className={`text-center py-10 opacity-50 ${enableAnimations ? 'animate-fade-in' : ''}`}>
                <p className="text-gray-500">No active chats.</p>
                <button onClick={() => navigate('/search')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold">Start a chat</button>
              </div>
            ) : (
              chatUsers.map((user, index) => {
                // We use a simpler filter here since we are mapping valid chatUsers
                const userMsgs = messages.filter(m => 
                  (m.senderId === currentUser?.id && m.receiverId === user.id) ||
                  (m.senderId === user.id && m.receiverId === currentUser?.id)
                ).sort((a, b) => a.timestamp - b.timestamp);

                const lastMsg = userMsgs[userMsgs.length - 1];
                const hasUnread = lastMsg && lastMsg.senderId === user.id && !lastMsg.read;
                const isAdminUser = checkIsAdmin(user.email);
                const isOwnerUser = checkIsOwner(user.email);
                const isOnline = checkIsOnline(user.id);
                const isTyping = typingStatus[user.id];

                return (
                  <div
                    key={user.id}
                    className={`relative w-full flex items-center p-4 liquid-card hover:bg-white/40 dark:hover:bg-white/10 transition-all active:scale-[0.98] ${enableAnimations ? 'animate-slide-up-fade opacity-0' : ''}`}
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                    onClick={() => setSelectedUser(user)}
                  >
                    <button 
                        onClick={(e) => handleProfileClick(e, user.id)}
                        className="relative flex-shrink-0 z-20 cursor-pointer"
                    >
                      <img src={user.avatar} alt={user.username} className={`w-14 h-14 rounded-full object-cover border-2 ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white/50'}`} />
                      {hasUnread && <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></span>}
                      {isOnline && !hasUnread && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse-slow"></span>}
                    </button>
                    
                    <div className="ml-4 flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className={`font-bold text-lg truncate flex items-center gap-1 ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {user.name || user.username}
                            {isOwnerUser ? <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" /> : isAdminUser ? <ShieldCheck className="w-3 h-3 text-blue-500" /> : null}
                        </h3>
                        {lastMsg && <span className="text-[10px] text-gray-500 font-medium">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      </div>
                      <p className={`text-sm truncate ${isTyping ? 'text-blue-500 font-bold animate-pulse' : hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isTyping ? 'Typing...' : (lastMsg ? (lastMsg.senderId === currentUser?.id ? `You: ${lastMsg.content}` : lastMsg.content) : 'Tap to chat')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- VIEW: ACTIVE CONVERSATION ----------------
  const isOwnerUser = checkIsOwner(selectedUser.email);
  const isAdminUser = checkIsAdmin(selectedUser.email);
  const isSelectedUserOnline = checkIsOnline(selectedUser.id);
  const isTyping = typingStatus[selectedUser.id];
  
  const isBlocked = currentUser?.blockedUsers.includes(selectedUser.id);
  const isBlockedBy = selectedUser.blockedUsers.includes(currentUser?.id || '');
  const isDeactivated = selectedUser.isDeactivated;
  
  const isDisabled = isBlocked || isBlockedBy || isDeactivated;
  let statusText = isTyping ? 'Typing...' : (isSelectedUserOnline ? 'Online' : formatLastSeen(selectedUser.lastSeen));
  if (isDeactivated) statusText = 'Deactivated';
  else if (isBlocked) statusText = 'Blocked';

  return (
    <div className={`flex flex-col h-full bg-transparent ${enableAnimations ? 'animate-fade-in' : ''}`}>
      
      {/* Sticky Header */}
      <div className="flex-none z-50 px-4 pt-4 pb-2 bg-gradient-to-b from-gray-50/95 to-gray-50/0 dark:from-black/95 dark:to-black/0">
          <div className="h-16 glass-panel px-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2 w-full">
                <button 
                    onClick={() => setSelectedUser(null)} 
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-800 dark:text-white flex items-center justify-center active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                
                {/* Header Profile Info - Clickable */}
                <button 
                    onClick={(e) => handleProfileClick(e)}
                    className="flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/10 p-1.5 pr-4 rounded-full transition-all flex-1 min-w-0 active:scale-95 text-left"
                >
                    <div className={`relative flex-shrink-0 ${enableAnimations ? 'animate-pop-in' : ''}`}>
                        <img src={selectedUser.avatar} alt="avatar" className={`w-10 h-10 rounded-full object-cover border ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white/50'}`} />
                        {isSelectedUserOnline && !isDeactivated && !isBlocked && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-800 shadow-sm animate-pulse"></span>}
                    </div>
                    <div className={`flex flex-col items-start min-w-0 flex-1 ${enableAnimations ? 'animate-slide-up' : ''}`}>
                        <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1 truncate w-full">
                            {selectedUser.name || selectedUser.username}
                            {isOwnerUser ? <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" /> : isAdminUser ? <ShieldCheck className="w-3 h-3 text-blue-500 flex-shrink-0" /> : null}
                        </span>
                        <span className={`text-[10px] font-bold ${isTyping ? 'text-blue-500 animate-pulse' : (isDeactivated || isBlocked) ? 'text-red-500' : isSelectedUserOnline ? 'text-green-500' : 'text-gray-400'}`}>
                            {statusText}
                        </span>
                    </div>
                    <Info className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
            </div>
          </div>
      </div>

      {/* Message List Area - Scrollable Flex Item */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
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
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${shouldAnimate ? 'animate-slide-up-fade opacity-0' : ''}`} 
                  style={{ animationDelay: shouldAnimate ? `${(idx - (conversation.length - 10)) * 50}ms` : '0s', animationFillMode: 'both' }}
                >
                 <div className={`max-w-[80%] px-4 py-2 text-sm shadow-sm border ${
                   isMe 
                     ? 'bg-blue-600 text-white rounded-[1.2rem] rounded-br-sm border-transparent' 
                     : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-[1.2rem] rounded-bl-sm border-gray-100 dark:border-gray-700'
                 }`}>
                   {msg.content}
                   <div className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                     <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     {isMe && (
                       <span title={msg.read ? "Read" : "Delivered"}>
                           <CheckCheck size={14} className={msg.read ? "text-green-300" : "text-blue-300/70"} />
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

      {/* Input Area - Fixed at bottom within flex container, leaving space for BottomNav */}
      <div className="flex-none p-4 pb-24 z-40 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent dark:from-black dark:via-black/80">
        <form 
          onSubmit={handleSend} 
          className={`flex items-center gap-2 p-1.5 shadow-xl sm:max-w-md sm:mx-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] w-full ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={isDisabled ? (isBlocked ? "You blocked this user" : isDeactivated ? "User deactivated" : "Chat unavailable") : "Type a message..."}
            autoComplete="off"
            disabled={isDisabled}
            className="flex-1 bg-transparent px-5 py-3 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 font-medium min-w-0"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isDisabled} 
            className="p-3 bg-blue-600 rounded-full text-white shadow-lg disabled:opacity-50 transition-all hover:scale-110 active:scale-95 flex-shrink-0 flex items-center justify-center"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
