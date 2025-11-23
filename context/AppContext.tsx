import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Message, Notification as AppNotification, Gender } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  notifications: AppNotification[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  enableAnimations: boolean;
  login: (user: User) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (user: User) => Promise<void>;
  updateProfile: (updatedUser: User) => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requesterId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  markConversationAsRead: (senderId: string) => void;
  isOwner: (email: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'fh_theme_v1',
  CURRENT_USER_ID: 'fh_current_user_id_v1',
  ANIMATIONS: 'fh_animations_v1',
  CACHE_USERS: 'fh_cache_users_v1',
  CACHE_MESSAGES: 'fh_cache_messages_v1'
};

const OWNER_EMAIL = 'chaudharytanmay664@gmail.com';

// -- Helpers --

// Robust UUID generator that works in all environments
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const mapUserFromDB = (dbUser: any): User => {
  try {
    return {
      id: dbUser.id,
      username: dbUser.username || 'Unknown',
      email: dbUser.email || '',
      password: dbUser.password,
      avatar: dbUser.avatar || 'https://via.placeholder.com/150',
      description: dbUser.description,
      birthdate: dbUser.birthdate,
      gender: dbUser.gender as Gender,
      isPrivateProfile: !!dbUser.is_private_profile,
      allowPrivateChat: !!dbUser.allow_private_chat,
      friends: Array.isArray(dbUser.friends) ? dbUser.friends : [],
      requests: Array.isArray(dbUser.requests) ? dbUser.requests : [],
    };
  } catch (e) {
    console.error("Error mapping user:", e, dbUser);
    return {
      id: dbUser.id || 'unknown',
      username: 'Error User',
      email: '',
      avatar: '',
      isPrivateProfile: false,
      allowPrivateChat: false,
      friends: [],
      requests: [],
    };
  }
};

const mapUserToDB = (user: User) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  password: user.password,
  avatar: user.avatar,
  description: user.description,
  birthdate: user.birthdate,
  gender: user.gender,
  is_private_profile: user.isPrivateProfile,
  allow_private_chat: user.allowPrivateChat,
  friends: user.friends,
  requests: user.requests,
});

const mapMessageFromDB = (dbMsg: any): Message => {
  const ts = Number(dbMsg.timestamp);
  // Handle both numeric timestamps (bigint) and ISO strings (timestamptz)
  const finalTs = isNaN(ts) ? new Date(dbMsg.timestamp).getTime() : ts;
  
  return {
    id: dbMsg.id,
    senderId: dbMsg.sender_id,
    receiverId: dbMsg.receiver_id,
    content: dbMsg.content,
    timestamp: isNaN(finalTs) ? Date.now() : finalTs, // Fallback to now if parsing fails completely
    read: !!dbMsg.read
  };
};

const mapMessageToDB = (msg: Message) => ({
  id: msg.id,
  sender_id: msg.senderId,
  receiver_id: msg.receiverId,
  content: msg.content,
  timestamp: msg.timestamp,
  read: msg.read
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [enableAnimations, setEnableAnimations] = useState(true);

  // Refs to access state inside subscription callbacks
  const currentUserRef = useRef<User | null>(null);
  const usersRef = useRef<User[]>([]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // Cache persistence - Update LocalStorage when state changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CACHE_USERS, JSON.stringify(users));
    }
  }, [users]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CACHE_MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Notification Helper (Sound Removed)
  const triggerNotification = (title: string, body: string, icon?: string) => {
    const isHidden = document.hidden;
    // Access global Notification object safely using a type assertion or window property
    const N = window.Notification as any; 
    const hasPermission = "Notification" in window && N.permission === "granted";

    if (isHidden && hasPermission) {
      // Background: Use system notification logic, but silent
      try {
        new N(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          silent: true 
        });
      } catch (e) {
        console.error("System notification error:", e);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && window.Notification.permission !== "granted") {
      await window.Notification.requestPermission();
    }
  };

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 0. CACHE LOADING (Fast Load) ---
        const cachedUsersStr = localStorage.getItem(STORAGE_KEYS.CACHE_USERS);
        const cachedMessagesStr = localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES);
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        
        let cachedUsersList: User[] = [];

        if (cachedUsersStr) {
          try {
            cachedUsersList = JSON.parse(cachedUsersStr);
            if (cachedUsersList.length > 0) setUsers(cachedUsersList);
          } catch (e) { console.error("Cache parse error users", e); }
        }

        if (cachedMessagesStr) {
          try {
            const cachedMsgs = JSON.parse(cachedMessagesStr);
            if (cachedMsgs.length > 0) setMessages(cachedMsgs);
          } catch (e) { console.error("Cache parse error msgs", e); }
        }

        // Instant Login if cached
        if (savedId && cachedUsersList.length > 0) {
            const found = cachedUsersList.find(u => u.id === savedId);
            if (found) {
                setCurrentUser(found);
                setIsLoading(false); // STOP LOADING IMMEDIATELY IF CACHE HIT
                requestNotificationPermission();
            }
        }

        // --- Load Settings ---
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);

        const savedAnim = localStorage.getItem(STORAGE_KEYS.ANIMATIONS);
        if (savedAnim !== null) setEnableAnimations(savedAnim === 'true');

        // --- 1. FETCH FRESH DATA (Background Sync) ---
        const { data: usersData, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        const mappedUsers = usersData.map(mapUserFromDB);
        setUsers(mappedUsers); // This will trigger the cache useEffect
        
        // --- 2. Fetch Fresh Messages ---
        const { data: msgsData, error: msgError } = await supabase.from('messages').select('*');
        if (msgError) throw msgError;
        const mappedMsgs = msgsData.map(mapMessageFromDB);
        setMessages(mappedMsgs); // This will trigger the cache useEffect

        // --- 3. Re-Verify Login with Fresh Data ---
        if (savedId) {
          const found = mappedUsers.find(u => u.id === savedId);
          if (found) {
            setCurrentUser(found); // Update current user with fresh data
            requestNotificationPermission();
          } else if (!cachedUsersList.length) {
            // If we didn't have cache and user not found in fresh data
            setIsLoading(false);
          }
        } else {
            setIsLoading(false);
        }

      } catch (err) {
        console.error("Initialization error:", err);
        setIsLoading(false); // Ensure we stop loading on error
      }
    };

    fetchData();
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase.channel('public:data')
      // Listen for new messages
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = mapMessageFromDB(payload.new);
        
        // Avoid duplicates (optimistic UI might have already added it)
        setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });

        // Handle Notifications for Messages
        if (currentUserRef.current && newMsg.receiverId === currentUserRef.current.id) {
          const sender = usersRef.current.find(u => u.id === newMsg.senderId);
          const senderName = sender ? sender.username : 'Someone';

          // App Internal Notification
          const notif: AppNotification = {
            id: Date.now().toString(),
            type: 'message',
            content: `New message from ${senderName}`,
            read: false,
            timestamp: Date.now(),
            data: { targetUser: sender, avatar: sender?.avatar }
          };
          setNotifications(prev => [notif, ...prev]);

          // Trigger System Notification (Silent)
          triggerNotification(`Message from ${senderName}`, newMsg.content, sender?.avatar);
        }
      })
      // Listen for message updates (e.g., read receipts)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = mapMessageFromDB(payload.new);
        // Update local state to reflect read status change or other updates
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      // Listen for user updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedUser = mapUserFromDB(payload.new);
          
          setUsers(prev => {
             const exists = prev.find(u => u.id === updatedUser.id);
             if (exists) return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
             return [...prev, updatedUser];
          });

          if (currentUserRef.current && updatedUser.id === currentUserRef.current.id) {
            setCurrentUser(updatedUser);
            
            // Check for new friend requests
            const oldReqs = currentUserRef.current.requests || [];
            const newReqs = updatedUser.requests || [];
            if (newReqs.length > oldReqs.length) {
               const newReqId = newReqs.find(id => !oldReqs.includes(id));
               const requester = usersRef.current.find(u => u.id === newReqId);
               if (requester) {
                 const notif: AppNotification = {
                   id: Date.now().toString(),
                   type: 'friend_request',
                   content: `${requester.username} sent you a friend request`,
                   read: false,
                   timestamp: Date.now(),
                   data: { requesterId: requester.id, avatar: requester.avatar }
                 };
                 setNotifications(prev => [notif, ...prev]);
                 triggerNotification('New Friend Request', `${requester.username} wants to be friends`, requester.avatar);
               }
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const login = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    requestNotificationPermission();
  };

  const loginWithCredentials = async (email: string, pass: string) => {
     const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
     if (found) {
       await login(found);
     } else {
       throw new Error("Invalid credentials");
     }
  };

  const signup = async (user: User) => {
    const { error } = await supabase.from('users').insert(mapUserToDB(user));
    if (error) throw error;
    // Realtime will update users list, but we can set optimistically
    setUsers(prev => [...prev, user]);
    await login(user);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    setNotifications([]);
  };

  const updateProfile = async (updatedUser: User) => {
    const { error } = await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', updatedUser.id);
    if (error) {
      console.error("Update failed", error);
      alert("Failed to update profile");
      return;
    }
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('users').delete().eq('id', currentUser.id);
    if (!error) logout();
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    const newMsg: Message = {
      id: generateUUID(),
      senderId: currentUser.id,
      receiverId,
      content,
      timestamp: Date.now(),
      read: false
    };
    
    // Optimistic update
    setMessages(prev => [...prev, newMsg]);

    const { error } = await supabase.from('messages').insert(mapMessageToDB(newMsg));
    if (error) {
       console.error("Send message failed", error);
       // Rollback
       setMessages(prev => prev.filter(m => m.id !== newMsg.id));
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;
    if (targetUser.requests.includes(currentUser.id)) return;

    const newRequests = [...targetUser.requests, currentUser.id];
    
    const { error } = await supabase.from('users').update({ requests: newRequests }).eq('id', targetUserId);
    if (error) console.error("Friend request failed", error);
  };

  const acceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;

    // 1. Add requester to my friends
    const myNewFriends = [...currentUser.friends, requesterId];
    const myNewRequests = currentUser.requests.filter(r => r !== requesterId);

    // 2. Add me to requester's friends
    const requester = users.find(u => u.id === requesterId);
    if (!requester) return;
    const theirNewFriends = [...requester.friends, currentUser.id];

    // Perform updates
    await supabase.from('users').update({ friends: myNewFriends, requests: myNewRequests }).eq('id', currentUser.id);
    await supabase.from('users').update({ friends: theirNewFriends }).eq('id', requesterId);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markConversationAsRead = async (senderId: string) => {
    if (!currentUser) return;
    
    // Optimistic Local Update
    setMessages(prev => prev.map(m => 
      (m.senderId === senderId && m.receiverId === currentUser.id && !m.read) 
        ? { ...m, read: true } 
        : m
    ));

    // DB Update to trigger realtime event for sender
    const unreadIds = messages
       .filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.read)
       .map(m => m.id);
    
    if (unreadIds.length > 0) {
      await supabase.from('messages').update({ read: true }).in('id', unreadIds);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleAnimations = () => {
    setEnableAnimations(prev => {
      const newVal = !prev;
      localStorage.setItem(STORAGE_KEYS.ANIMATIONS, String(newVal));
      return newVal;
    });
  };

  const isOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL.toLowerCase();

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      messages,
      notifications,
      theme,
      isLoading,
      enableAnimations,
      login,
      loginWithCredentials,
      logout,
      signup,
      updateProfile,
      deleteAccount,
      sendMessage,
      sendFriendRequest,
      acceptFriendRequest,
      markNotificationRead,
      toggleTheme,
      toggleAnimations,
      markConversationAsRead,
      isOwner
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};