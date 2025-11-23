
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode, useRef } from 'react';
import { User, Message, Notification as AppNotification, Gender, AppConfig } from '../types';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL, OWNER_EMAIL, DEFAULT_CONFIG, BROADCAST_ID } from '../constants';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  notifications: AppNotification[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  enableAnimations: boolean;
  enableLiquid: boolean;
  showPermissionPrompt: boolean;
  appConfig: AppConfig;
  isAdmin: boolean;
  isOwner: boolean;
  onlineUsers: string[];
  login: (user: User) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (user: User) => Promise<void>;
  updateProfile: (updatedUser: User) => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  broadcastMessage: (content: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requesterId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  toggleLiquid: () => void;
  markConversationAsRead: (senderId: string) => void;
  checkIsAdmin: (email: string) => boolean;
  checkIsOwner: (email: string) => boolean;
  checkIsOnline: (userId: string) => boolean;
  enableNotifications: () => Promise<void>;
  closePermissionPrompt: () => void;
  updateAppConfig: (newConfig: AppConfig) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'fh_theme_v1',
  CURRENT_USER_ID: 'fh_current_user_id_v1',
  ANIMATIONS: 'fh_animations_v1',
  LIQUID: 'fh_liquid_v1',
  CACHE_USERS: 'fh_cache_users_v1',
  CACHE_MESSAGES: 'fh_cache_messages_v1'
};

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
  const finalTs = isNaN(ts) ? new Date(dbMsg.timestamp).getTime() : ts;
  
  return {
    id: dbMsg.id,
    senderId: dbMsg.sender_id,
    receiverId: dbMsg.receiver_id,
    content: dbMsg.content,
    timestamp: isNaN(finalTs) ? Date.now() : finalTs,
    read: !!dbMsg.read
  };
};

const mapMessageToDB = (msg: Message) => ({
  id: msg.id,
  sender_id: msg.senderId,
  receiver_id: msg.receiverId,
  content: msg.content,
  timestamp: new Date(msg.timestamp).toISOString(),
  read: msg.read
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    let initial: 'light' | 'dark' = 'light';
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.THEME);
        if (stored === 'dark' || stored === 'light') initial = stored;
      } catch (e) { console.error(e); }
    }
    if (typeof document !== 'undefined') {
        if (initial === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }
    return initial;
  });

  const [enableAnimations, setEnableAnimations] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ANIMATIONS);
        return stored !== null ? stored === 'true' : true;
      } catch(e) { return true; }
    }
    return true;
  });

  const [enableLiquid, setEnableLiquid] = useState(() => {
    let initial = true;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.LIQUID);
        if (stored !== null) initial = stored === 'true';
      } catch(e) { console.error(e); }
    }
    if (typeof document !== 'undefined') {
        if (initial) document.body.classList.remove('no-liquid');
        else document.body.classList.add('no-liquid');
    }
    return initial;
  });

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  const currentUserRef = useRef<User | null>(null);
  const usersRef = useRef<User[]>([]);

  const checkIsOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const checkIsAdmin = (email: string) => email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || checkIsOwner(email);
  const checkIsOnline = (userId: string) => onlineUsers.includes(userId);

  const isOwner = currentUser ? checkIsOwner(currentUser.email) : false;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.email) : false;

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // Presence Tracking
  useEffect(() => {
    if (!currentUser) return;

    const presenceChannel = supabase.channel('global_presence');
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        // Supabase returns an array of presence objects for each key.
        // We assume the key is the user_id or mapped via the track payload.
        const activeIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
           presences.forEach((p: any) => {
             if (p.user_id) activeIds.add(p.user_id);
           });
        });
        setOnlineUsers(Array.from(activeIds));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ 
            user_id: currentUser.id, 
            online_at: new Date().toISOString() 
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.id]);

  useLayoutEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useLayoutEffect(() => {
    if (enableLiquid) {
      document.body.classList.remove('no-liquid');
    } else {
      document.body.classList.add('no-liquid');
    }
    localStorage.setItem(STORAGE_KEYS.LIQUID, String(enableLiquid));
  }, [enableLiquid]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANIMATIONS, String(enableAnimations));
  }, [enableAnimations]);

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

  const syncConfigFromUsers = (userList: User[]) => {
    const adminUser = userList.find(u => checkIsAdmin(u.email));
    const mainAdmin = userList.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    const targetUser = mainAdmin || adminUser;

    if (targetUser && targetUser.description && targetUser.description.startsWith('{')) {
      try {
        const parsed = JSON.parse(targetUser.description);
        if (parsed.features) {
          setAppConfig(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to parse app config", e);
      }
    }
  };

  const updateAppConfig = async (newConfig: AppConfig) => {
    if (!isAdmin || !currentUser) return;
    setAppConfig(newConfig);
    const configString = JSON.stringify(newConfig);
    const updatedUser = { ...currentUser, description: configString };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    await updateProfile(updatedUser);
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  const playSendSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const triggerNotification = (title: string, body: string, icon?: string) => {
    const isHidden = document.hidden;
    const N = window.Notification as any; 
    const hasPermission = "Notification" in window && N.permission === "granted";
    playNotificationSound();

    if (isHidden && hasPermission) {
      try {
        new N(title, { body, icon: icon || '/favicon.ico', silent: true });
      } catch (e) {}
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedUsersStr = localStorage.getItem(STORAGE_KEYS.CACHE_USERS);
        const cachedMessagesStr = localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES);
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        
        let cachedUsersList: User[] = [];

        if (cachedUsersStr) {
          try {
            cachedUsersList = JSON.parse(cachedUsersStr);
            if (cachedUsersList.length > 0) {
                setUsers(cachedUsersList);
                syncConfigFromUsers(cachedUsersList);
            }
          } catch (e) {}
        }

        if (cachedMessagesStr) {
          try {
            const cachedMsgs = JSON.parse(cachedMessagesStr);
            if (cachedMsgs.length > 0) setMessages(cachedMsgs);
          } catch (e) {}
        }

        if (savedId && cachedUsersList.length > 0) {
            const found = cachedUsersList.find(u => u.id === savedId);
            if (found) {
                setCurrentUser(found);
                setIsLoading(false);
                checkPermissionStatus();
            }
        }

        const { data: usersData, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        const mappedUsers = usersData.map(mapUserFromDB);
        setUsers(mappedUsers);
        syncConfigFromUsers(mappedUsers);
        
        const { data: msgsData, error: msgError } = await supabase.from('messages').select('*');
        if (msgError) throw msgError;
        const mappedMsgs = msgsData.map(mapMessageFromDB);
        setMessages(mappedMsgs);

        if (savedId) {
          const found = mappedUsers.find(u => u.id === savedId);
          if (found) {
            setCurrentUser(found);
            checkPermissionStatus();
          } else if (!cachedUsersList.length) {
            setIsLoading(false);
          }
        } else {
            setIsLoading(false);
        }

      } catch (err) {
        console.error("Initialization error:", err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('public:data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = mapMessageFromDB(payload.new);
        setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
        });

        if (currentUserRef.current && newMsg.receiverId === currentUserRef.current.id) {
          const sender = usersRef.current.find(u => u.id === newMsg.senderId);
          const senderName = sender ? sender.username : 'Someone';
          playNotificationSound();
          const notif: AppNotification = {
            id: Date.now().toString(),
            type: 'message',
            content: `New message from ${senderName}`,
            read: false,
            timestamp: Date.now(),
            data: { targetUser: sender, avatar: sender?.avatar }
          };
          setNotifications(prev => [notif, ...prev]);
          triggerNotification(`Message from ${senderName}`, newMsg.content, sender?.avatar);
        }

        if (newMsg.receiverId === BROADCAST_ID) {
           if (currentUserRef.current && newMsg.senderId === currentUserRef.current.id) return;
           const sender = usersRef.current.find(u => u.id === newMsg.senderId);
           const senderName = sender?.username || "Admin";
           playNotificationSound();
           const notif: AppNotification = {
             id: Date.now().toString(),
             type: 'system',
             content: `📢 ${senderName}: ${newMsg.content}`,
             read: false,
             timestamp: Date.now(),
             data: {}
           };
           setNotifications(prev => [notif, ...prev]);
           triggerNotification(`Announcement from ${senderName}`, newMsg.content);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = mapMessageFromDB(payload.new);
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedUser = mapUserFromDB(payload.new);
          setUsers(prev => {
             const exists = prev.find(u => u.id === updatedUser.id);
             if (checkIsAdmin(updatedUser.email)) {
                const newList = exists ? prev.map(u => u.id === updatedUser.id ? updatedUser : u) : [...prev, updatedUser];
                syncConfigFromUsers(newList);
                return newList;
             }
             if (exists) return prev.map(u => u.id === updatedUser.id ? updatedUser : u);
             return [...prev, updatedUser];
          });

          if (currentUserRef.current && updatedUser.id === currentUserRef.current.id) {
            setCurrentUser(updatedUser);
            const oldReqs = currentUserRef.current.requests || [];
            const newReqs = updatedUser.requests || [];
            if (newReqs.length > oldReqs.length) {
               const newReqId = newReqs.find(id => !oldReqs.includes(id));
               const requester = usersRef.current.find(u => u.id === newReqId);
               if (requester) {
                 playNotificationSound();
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

  const checkPermissionStatus = () => {
    if ("Notification" in window && window.Notification.permission === "default") {
      setShowPermissionPrompt(true);
    }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await window.Notification.requestPermission();
    if (permission === "granted") {
      playNotificationSound();
      new Notification("Notifications Enabled", { body: "You will now receive alerts!", icon: '/favicon.ico' });
    }
    setShowPermissionPrompt(false);
  };

  const closePermissionPrompt = () => setShowPermissionPrompt(false);
  
  const login = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    checkPermissionStatus();
  };
  
  const loginWithCredentials = async (email: string, pass: string) => {
     const found = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === pass);
     if (found) await login(found);
     else throw new Error("Invalid credentials");
  };
  
  const signup = async (user: User) => {
    const { error } = await supabase.from('users').insert(mapUserToDB(user));
    if (error) throw error;
    setUsers(prev => [...prev, user]);
    await login(user);
  };
  
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    setNotifications([]);
    setOnlineUsers([]);
  };
  
  const updateProfile = async (updatedUser: User) => {
    const { error } = await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', updatedUser.id);
    if (error) alert("Failed to update profile");
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
    setMessages(prev => [...prev, newMsg]);
    playSendSound();
    const { error } = await supabase.from('messages').insert(mapMessageToDB(newMsg));
    if (error) setMessages(prev => prev.filter(m => m.id !== newMsg.id));
  };
  
  const broadcastMessage = async (content: string) => {
    if (!isAdmin || !currentUser) return;
    await sendMessage(BROADCAST_ID, content);
  };
  
  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    // 1. Optimistic Update (Immediate UI Feedback)
    setUsers(prev => prev.map(u => {
      if (u.id === targetUserId) {
        if (u.requests.includes(currentUser.id)) return u;
        return { ...u, requests: [...u.requests, currentUser.id] };
      }
      return u;
    }));

    // 2. Reliable DB Update (Fetch fresh data to avoid race conditions)
    try {
      const { data: targetUserRemote } = await supabase.from('users').select('requests').eq('id', targetUserId).single();
      
      if (targetUserRemote) {
        const currentRequests = targetUserRemote.requests || [];
        if (!currentRequests.includes(currentUser.id)) {
           await supabase.from('users').update({ 
             requests: [...currentRequests, currentUser.id] 
           }).eq('id', targetUserId);
        }
      }
    } catch (err) {
      console.error("Failed to send request", err);
      // Optional: Revert optimistic update on failure
    }
  };
  
  const acceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;

    // 1. Optimistic Update
    const updatedCurrentUser = {
        ...currentUser,
        friends: [...currentUser.friends, requesterId],
        requests: currentUser.requests.filter(r => r !== requesterId)
    };
    setCurrentUser(updatedCurrentUser);
    
    setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) return updatedCurrentUser;
        if (u.id === requesterId) {
             return { ...u, friends: [...u.friends, currentUser.id] };
        }
        return u;
    }));

    // 2. DB Update
    const myNewFriends = updatedCurrentUser.friends;
    const myNewRequests = updatedCurrentUser.requests;
    
    await supabase.from('users').update({ friends: myNewFriends, requests: myNewRequests }).eq('id', currentUser.id);
    
    // Fetch latest friend's friend list to safely append
    const { data: requesterRemote } = await supabase.from('users').select('friends').eq('id', requesterId).single();
    if (requesterRemote) {
       const theirFriends = requesterRemote.friends || [];
       if (!theirFriends.includes(currentUser.id)) {
         await supabase.from('users').update({ friends: [...theirFriends, currentUser.id] }).eq('id', requesterId);
       }
    }
  };
  
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markConversationAsRead = async (senderId: string) => {
    if (!currentUser) return;
    setMessages(prev => prev.map(m => (m.senderId === senderId && m.receiverId === currentUser.id && !m.read) ? { ...m, read: true } : m));
    const unreadIds = messages.filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.read).map(m => m.id);
    if (unreadIds.length > 0) await supabase.from('messages').update({ read: true }).in('id', unreadIds);
  };
  
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleAnimations = () => setEnableAnimations(prev => !prev);
  const toggleLiquid = () => setEnableLiquid(prev => !prev);

  return (
    <AppContext.Provider value={{
      currentUser, users, messages, notifications, theme, isLoading, enableAnimations, enableLiquid, showPermissionPrompt,
      appConfig, isAdmin, isOwner, onlineUsers,
      login, loginWithCredentials, logout, signup, updateProfile, deleteAccount,
      sendMessage, broadcastMessage, sendFriendRequest, acceptFriendRequest, markNotificationRead,
      toggleTheme, toggleAnimations, toggleLiquid, markConversationAsRead, checkIsAdmin, checkIsOwner, checkIsOnline, enableNotifications, closePermissionPrompt, updateAppConfig
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
