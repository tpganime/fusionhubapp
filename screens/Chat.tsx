
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { User, Message } from '../types';
import { Send, ArrowLeft, CheckCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const ChatScreen: React.FC = () => {
  const { currentUser, users, messages, sendMessage, markConversationAsRead } = useApp();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle incoming navigation from Search or Profile
  useEffect(() => {
    if (location.state?.targetUser) {
      setSelectedUser(location.state.targetUser);
      // Clear location state to avoid sticking
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Get list of friends or people with chat history
  const chatUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (currentUser?.friends.includes(u.id) || messages.some(m => (m.senderId === u.id && m.receiverId === currentUser?.id) || (m.senderId === currentUser?.id && m.receiverId === u.id)))
  );

  const getConversation = (userId: string) => {
    if (!currentUser) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === currentUser.id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  };

  // Calculate conversation for current selected user
  const conversation = selectedUser ? getConversation(selectedUser.id) : [];

  // Mark messages as read when conversation is active
  useEffect(() => {
    if (selectedUser && currentUser) {
      // Only call if there are unread messages to avoid loops/renders
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

  // Scroll to bottom only when conversation length changes (new message), not on read status change
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

  // -- Chat List View --
  if (!selectedUser) {
    return (
      <div className="min-h-screen pb-24 transition-colors duration-300">
        <TopBar />
        <main className="px-4 pt-2">
          <h1 className="text-2xl font-bold mb-4 px-1 text-gray-900 dark:text-white">Chats</h1>
          <div className="space-y-2">
            {chatUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-400 dark:text-gray-600">
                <p>No chats yet.</p>
                <p className="text-sm">Go to Search to find people!</p>
              </div>
            ) : (
              chatUsers.map(user => {
                // Find last message
                const userMsgs = getConversation(user.id);
                const lastMsg = userMsgs[userMsgs.length - 1];
                const hasUnread = lastMsg && lastMsg.senderId === user.id && !lastMsg.read;

                return (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center p-3 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white dark:border-gray-800 hover:bg-white dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="relative">
                      <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                      {hasUnread && <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-dark-surface"></span>}
                    </div>
                    <div className="ml-3 text-left flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`font-semibold truncate ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{user.username}</h3>
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

  // -- Chat Detail View --
  return (
    <div className="h-screen flex flex-col transition-colors duration-300">
      {/* Chat Header */}
      <div className="h-16 glass-panel dark:bg-dark-surface/80 flex items-center px-4 shadow-sm z-20 dark:border-gray-800">
        <button onClick={() => setSelectedUser(null)} className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-white/10 text-gray-900 dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => navigate(`/user/${selectedUser.id}`)}
          className="flex items-center flex-1 hover:opacity-80 transition-opacity"
        >
          <img src={selectedUser.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
          <span className="ml-3 font-semibold text-gray-900 dark:text-white">{selectedUser.username}</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {conversation.length === 0 ? (
           <div className="text-center mt-10">
             <img src={selectedUser.avatar} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover opacity-50" />
             <p className="text-xs text-gray-400">Start a conversation with {selectedUser.username}</p>
           </div>
        ) : (
           conversation.map(msg => {
             const isMe = msg.senderId === currentUser?.id;
             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                         {msg.read ? (
                           <CheckCheck size={14} className="text-white" />
                         ) : (
                           <CheckCheck size={14} className="text-blue-200" />
                         )}
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

      {/* Input Area (Sticky above bottom nav) */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-30 pointer-events-none">
        <form onSubmit={handleSend} className="pointer-events-auto flex items-center gap-2 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl p-2 rounded-full shadow-lg border border-white/50 dark:border-gray-700">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button type="submit" disabled={!inputText.trim()} className="p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
