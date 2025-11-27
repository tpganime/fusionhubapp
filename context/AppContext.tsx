
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode, useRef } from 'react';
import { User, Message, Notification as AppNotification, Gender, AppConfig, AnimationSpeed } from '../types';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL, OWNER_EMAIL, DEFAULT_CONFIG, BROADCAST_ID } from '../constants';

interface WeeklyStat {
  day: string;
  date: string;
  ms: number;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  notifications: AppNotification[];
  knownAccounts: User[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  enableAnimations: boolean;
  animationSpeed: AnimationSpeed;
  enableLiquid: boolean;
  glassOpacity: number;
  showPermissionPrompt: boolean;
  notificationPermission: NotificationPermission;
  appConfig: AppConfig;
  isAdmin: boolean;
  isOwner: boolean;
  onlineUsers: string[];
  login: (user: User) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchAccount: (user: User) => Promise<void>;
  removeKnownAccount: (userId: string) => void;
  signup: (user: User) => Promise<void>;
  updateProfile: (updatedUser: User) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  broadcastMessage: (content: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requesterId: string) => Promise<void>;
  unfriend: (targetUserId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  toggleLiquid: () => void;
  setGlassOpacity: (opacity: number) => void;
  markConversationAsRead: (senderId: string) => void;
  checkIsAdmin: (email: string) => boolean;
  checkIsOwner: (email: string) => boolean;
  checkIsOnline: (userId: string) => boolean;
  enableNotifications: () => Promise<void>;
  closePermissionPrompt: () => void;
  updateAppConfig: (newConfig: AppConfig) => Promise<void>;
  getTimeSpent: () => string;
  getWeeklyStats: () => WeeklyStat[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'fh_theme_v1',
  CURRENT_USER_ID: 'fh_current_user_id_v1',
  ANIMATIONS: 'fh_animations_v1',
  ANIM_SPEED: 'fh_anim_speed_v1',
  LIQUID: 'fh_liquid_v1',
  GLASS_OPACITY: 'fh_glass_opacity_v1',
  CACHE_USERS: 'fh_cache_users_v1',
  CACHE_MESSAGES: 'fh_cache_messages_v1',
  LAST_RESET: 'fh_last_reset_date',
  KNOWN_ACCOUNTS: 'fh_known_accounts_v1'
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
      name: dbUser.name || '',
      email: dbUser.email || '',
      password: dbUser.password, // Required for account switching persistence
      avatar: dbUser.avatar || 'https://via.placeholder.com/150',
      description: dbUser.description,
      birthdate: dbUser.birthdate,
      gender: dbUser.gender as Gender,
      isPrivateProfile: !!dbUser.is_private_profile,
      allowPrivateChat: !!dbUser.allow_private_chat,
      friends: Array.isArray(dbUser.friends) ? dbUser.friends : [],
      requests: Array.isArray(dbUser.requests) ? dbUser.requests : [],
      lastSeen: dbUser.last_seen,
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
  name: user.name,
  email: user.email,
  password: user.password,
  avatar: user.avatar,
  description: user.description,
  birthdate: user.birthdate,
  gender: user.gender,
  is_private_profile: user.isPrivateProfile,
  allow_private_chat: user.allowPrivateChat,
  friends: user.friends || [],
  requests: user.requests || [],
  last_seen: user.lastSeen,
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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const [knownAccounts, setKnownAccounts] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.KNOWN_ACCOUNTS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  const sessionStartRef = useRef(Date.now());

  // -- PERSISTENT SETTINGS INITIALIZATION --
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    let initial: 'light' | 'dark' = 'light';
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.THEME);
        if (stored === 'dark' || stored === 'light') initial = stored;
      } catch (e) {}
    }
    if (typeof document !== 'undefined') {
        if (initial === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }
    return initial;
  });

  const [enableAnimations, setEnableAnimations] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem(STORAGE_KEYS.ANIMATIONS) !== 'false'; } catch(e) { return true; }
    }
    return true;
  });

  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(() => {
    if (typeof window !== 'undefined') {
      try { 
        const stored = localStorage.getItem(STORAGE_KEYS.ANIM_SPEED);
        if (stored === 'fast' || stored === 'balanced' || stored === 'relaxed') return stored;
      } catch(e) {}
    }
    return 'balanced';
  });

  const [enableLiquid, setEnableLiquid] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return localStorage.getItem(STORAGE_KEYS.LIQUID) !== 'false'; } catch(e) { return true; }
    }
    return true;
  });

  const [glassOpacity, setGlassOpacity] = useState(() => {
    if (typeof window !== 'undefined') {
      try { 
        const stored = localStorage.getItem(STORAGE_KEYS.GLASS_OPACITY);
        if (stored) return parseFloat(stored);
      } catch(e) {}
    }
    return 0.35;
  });

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  const currentUserRef = useRef<User | null>(null);
  const usersRef = useRef<User[]>([]);
  const notificationsRef = useRef<AppNotification[]>([]);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.KNOWN_ACCOUNTS, JSON.stringify(knownAccounts));
  }, [knownAccounts]);

  const checkIsOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const checkIsAdmin = (email: string) => email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || checkIsOwner(email);
  const checkIsOnline = (userId: string) => onlineUsers.includes(userId);
  const isOwner = currentUser ? checkIsOwner(currentUser.email) : false;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.email) : false;

  // -- CONFIG SYNC --
  const syncConfigFromUsers = (userList: User[]) => {
    const mainAdmin = userList.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    const targetUser = mainAdmin || userList.find(u => checkIsAdmin(u.email));

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

  // -- SETTINGS EFFECTS --
  useLayoutEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useLayoutEffect(() => {
    if (enableLiquid) document.body.classList.remove('no-liquid');
    else document.body.classList.add('no-liquid');
    localStorage.setItem(STORAGE_KEYS.LIQUID, String(enableLiquid));
  }, [enableLiquid]);

  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity.toString());
    if (glassOpacity <= 0.05) document.documentElement.style.setProperty('--glass-filter', 'none');
    else document.documentElement.style.setProperty('--glass-filter', 'blur(20px) saturate(180%)');
    localStorage.setItem(STORAGE_KEYS.GLASS_OPACITY, glassOpacity.toString());
  }, [glassOpacity]);

  useEffect(() => {
    document.documentElement.setAttribute('data-anim-speed', animationSpeed);
    localStorage.setItem(STORAGE_KEYS.ANIM_SPEED, animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANIMATIONS, String(enableAnimations));
  }, [enableAnimations]);

  // -- TIME TRACKING --
  useEffect(() => {
    if (!currentUser) return;
    const getISTDate = () => new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];

    sessionStartRef.current = Date.now();
    const dailyKey = `fh_time_spent_${currentUser.id}`;
    const historyKey = `fh_time_history_${currentUser.id}`;

    const saveTime = () => {
       const today = getISTDate();
       const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);

       if (lastReset && lastReset !== today) {
           const yesterdayTime = parseInt(localStorage.getItem(dailyKey) || '0', 10);
           let history: Record<string, number> = {};
           try { history = JSON.parse(localStorage.getItem(historyKey) || '{}'); } catch(e) {}
           if (lastReset) history[lastReset] = yesterdayTime;
           localStorage.setItem(historyKey, JSON.stringify(history));
           localStorage.setItem(dailyKey, '0');
           localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
           sessionStartRef.current = Date.now(); 
           return;
       }
       const stored = parseInt(localStorage.getItem(dailyKey) || '0', 10);
       const currentSession = Date.now() - sessionStartRef.current;
       localStorage.setItem(dailyKey, (stored + currentSession).toString());
       sessionStartRef.current = Date.now(); 
    };

    const today = getISTDate();
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    if (!lastReset) localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
    else if (lastReset !== today) saveTime(); 

    const interval = setInterval(saveTime, 30000);
    window.addEventListener('beforeunload', saveTime);
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', saveTime); saveTime(); }
  }, [currentUser?.id]);

  const getTimeSpent = () => {
    if (!currentUser) return "0m";
    const key = `fh_time_spent_${currentUser.id}`;
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    const currentSession = Date.now() - sessionStartRef.current;
    const totalMs = stored + currentSession;
    const m = Math.floor(totalMs / 60000);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  };

  const getWeeklyStats = (): WeeklyStat[] => {
    if (!currentUser) return [];
    const historyKey = `fh_time_history_${currentUser.id}`;
    const dailyKey = `fh_time_spent_${currentUser.id}`;
    let history: Record<string, number> = {};
    try { history = JSON.parse(localStorage.getItem(historyKey) || '{}'); } catch(e) {}
    
    const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];
    const todayStored = parseInt(localStorage.getItem(dailyKey) || '0', 10);
    const currentSession = Date.now() - sessionStartRef.current;
    history[today] = todayStored + currentSession;

    const stats: WeeklyStat[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); 
        stats.push({ day: dayLabel, date: dateKey, ms: history[dateKey] || 0 });
    }
    return stats;
  };

  // Sound Effects
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

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      playNotificationSound();
      new Notification("Notifications Enabled", { body: "You will now receive alerts!", icon: '/favicon.ico' });
    }
    setShowPermissionPrompt(false);
  }; 
  const closePermissionPrompt = () => setShowPermissionPrompt(false);

  const saveAccountToHistory = (user: User) => {
    setKnownAccounts(prev => {
        // Prevent duplicates, keep latest
        const filtered = prev.filter(u => u.id !== user.id);
        return [...filtered, user];
    });
  };

  const login = async (user: User) => { 
      setCurrentUser(user); 
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id); 
      saveAccountToHistory(user);
      checkPermissionStatus(); 
  };

  const loginWithCredentials = async (email: string, pass: string) => {
      const found = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === pass);
      if (found) await login(found);
      else throw new Error("Invalid credentials");
  };

  const switchAccount = async (user: User) => {
      await login(user);
  };

  const removeKnownAccount = (userId: string) => {
      setKnownAccounts(prev => prev.filter(u => u.id !== userId));
  };

  const logout = () => { setCurrentUser(null); localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID); setNotifications([]); };
  const signup = async (user: User) => {
      setUsers(prev => [...prev, user]);
      await login(user);
      const { error } = await supabase.from('users').insert(mapUserToDB(user));
      if (error) console.error("Signup DB Error:", error);
  };

  const updateProfile = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    saveAccountToHistory(updatedUser); // Update info in known accounts if profile changes
    try {
        const { error } = await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', updatedUser.id);
        if (error) {
            console.error("Profile Update Error:", error);
            alert(`Update Failed: ${error.message}`);
            return false;
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

  const updateAppConfig = async (newConfig: AppConfig) => {
    if (!isAdmin || !currentUser) return;
    setAppConfig(newConfig);
    const configString = JSON.stringify(newConfig);
    const updatedUser = { ...currentUser, description: configString };
    await updateProfile(updatedUser);
  };

  const deleteAccount = async () => { 
      if (currentUser) {
          await supabase.from('users').delete().eq('id', currentUser.id);
          removeKnownAccount(currentUser.id);
          logout(); 
      }
  };
  const deactivateAccount = async () => { logout(); };
  
  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    const newMsg: Message = { id: generateUUID(), senderId: currentUser.id, receiverId, content, timestamp: Date.now(), read: false };
    // Optimistic update
    setMessages(prev => [...prev, newMsg]);
    playSendSound();
    
    const { error } = await supabase.from('messages').insert(mapMessageToDB(newMsg));
    if (error) {
        console.error(error);
        triggerNotification("Error", "Message failed to send.");
        setMessages(prev => prev.filter(m => m.id !== newMsg.id));
    }
  };

  const broadcastMessage = async (content: string) => {
      if (!isAdmin || !currentUser) return;
      await sendMessage(BROADCAST_ID, content);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    // Optimistic Update locally
    setUsers(prev => prev.map(u => {
        if (u.id === targetUserId) {
            if (u.requests.includes(currentUser.id)) return u;
            return { ...u, requests: [...u.requests, currentUser.id] };
        }
        return u;
    }));
    
    const { data } = await supabase.from('users').select('requests').eq('id', targetUserId).single();
    if (data) {
        let currentRequests = data.requests || [];
        
        // RESEND LOGIC: Remove then re-add to force a change event on the receiver
        if (currentRequests.includes(currentUser.id)) {
            const filtered = currentRequests.filter((id: string) => id !== currentUser.id);
            // 1. Remove
            await supabase.from('users').update({ requests: filtered }).eq('id', targetUserId);
            // 2. Add back (wait slightly to ensure distinct events)
            setTimeout(async () => {
                await supabase.from('users').update({ requests: [...filtered, currentUser.id] }).eq('id', targetUserId);
            }, 100);
        } else {
            // First time request
            await supabase.from('users').update({ requests: [...currentRequests, currentUser.id] }).eq('id', targetUserId);
        }
    }
  };

  const acceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;
    const myNewFriends = [...currentUser.friends, requesterId];
    const myNewRequests = currentUser.requests.filter(r => r !== requesterId);
    
    setCurrentUser(prev => prev ? ({ ...prev, friends: myNewFriends, requests: myNewRequests }) : null);
    
    await supabase.from('users').update({ friends: myNewFriends, requests: myNewRequests }).eq('id', currentUser.id);
    
    const { data } = await supabase.from('users').select('friends').eq('id', requesterId).single();
    if (data) {
        const theirFriends = data.friends || [];
        if (!theirFriends.includes(currentUser.id)) {
            await supabase.from('users').update({ friends: [...theirFriends, currentUser.id] }).eq('id', requesterId);
        }
    }
  };

  const unfriend = async (targetUserId: string) => {
      if (!currentUser) return;
      
      const myNewFriends = currentUser.friends.filter(id => id !== targetUserId);
      setCurrentUser(prev => prev ? ({ ...prev, friends: myNewFriends }) : null);
      setUsers(prev => prev.map(u => {
          if (u.id === currentUser.id) return { ...u, friends: myNewFriends };
          if (u.id === targetUserId) return { ...u, friends: u.friends.filter(f => f !== currentUser.id) };
          return u;
      }));

      // DB Updates
      await supabase.from('users').update({ friends: myNewFriends }).eq('id', currentUser.id);
      
      const { data } = await supabase.from('users').select('friends').eq('id', targetUserId).single();
      if (data) {
          const theirNewFriends = (data.friends || []).filter((id: string) => id !== currentUser.id);
          await supabase.from('users').update({ friends: theirNewFriends }).eq('id', targetUserId);
      }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markConversationAsRead = async (senderId: string) => {
    if (!currentUser) return;
    
    const unreadMessages = messages.filter(m => 
        m.senderId === senderId && 
        m.receiverId === currentUser.id && 
        !m.read
    );

    if (unreadMessages.length === 0) return;

    const unreadIds = unreadMessages.map(m => m.id);

    setMessages(prev => prev.map(m => 
        (unreadIds.includes(m.id)) ? { ...m, read: true } : m
    ));

    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadIds);
    
    if (error) console.error("Failed to mark messages as read:", error);
  };

  const checkPermissionStatus = () => {
    if ("Notification" in window && window.Notification.permission === "default") {
      setShowPermissionPrompt(true);
    }
    if ("Notification" in window) {
      setNotificationPermission(window.Notification.permission);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleAnimations = () => setEnableAnimations(prev => !prev);
  const toggleLiquid = () => setEnableLiquid(prev => !prev);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => { if (isMounted) setIsLoading(false); }, 5000);

    const fetchData = async () => {
      try {
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        try {
            const cachedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHE_USERS) || '[]');
            if (cachedUsers.length) { setUsers(cachedUsers); syncConfigFromUsers(cachedUsers); }
            const cachedMsgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES) || '[]');
            if (cachedMsgs.length) setMessages(cachedMsgs);
            if (savedId && cachedUsers.length) {
                const found = cachedUsers.find((u: User) => u.id === savedId);
                if (found) setCurrentUser(found);
            }
        } catch(e) {}

        const { data: usersData, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        
        if (isMounted) {
            const mappedUsers = usersData.map(mapUserFromDB);
            setUsers(mappedUsers);
            syncConfigFromUsers(mappedUsers);
            
            const { data: msgsData } = await supabase.from('messages').select('*').order('timestamp', { ascending: false }).limit(100);
            if (msgsData) setMessages(msgsData.map(mapMessageFromDB).reverse());

            if (savedId) {
                const found = mappedUsers.find(u => u.id === savedId);
                if (found) { setCurrentUser(found); checkPermissionStatus(); }
            }
            setIsLoading(false);
            clearTimeout(safetyTimeout);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; clearTimeout(safetyTimeout); };
  }, []);

  // -- REALTIME SUBSCRIPTION --
  useEffect(() => {
    const channel = supabase.channel('realtime:app_data')
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
           const notif: AppNotification = { id: Date.now().toString(), type: 'system', content: `📢 ${senderName}: ${newMsg.content}`, read: false, timestamp: Date.now(), data: {} };
           setNotifications(prev => [notif, ...prev]);
           triggerNotification(`Announcement from ${senderName}`, newMsg.content);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = mapMessageFromDB(payload.new);
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedUser = mapUserFromDB(payload.new);
          setUsers(prev => {
             const exists = prev.find(u => u.id === updatedUser.id);
             return exists ? prev.map(u => u.id === updatedUser.id ? updatedUser : u) : [...prev, updatedUser];
          });

          // ROBUST FRIEND REQUEST NOTIFICATION LOGIC
          if (currentUserRef.current && updatedUser.id === currentUserRef.current.id) {
            setCurrentUser(updatedUser);
            const currentRequests = updatedUser.requests || [];
            
            // Check for any request ID that we haven't notified about recently
            for (const reqId of currentRequests) {
                // Check if we already have a notification for this user in the current session
                const alreadyNotified = notificationsRef.current.some(n => 
                    n.type === 'friend_request' && n.data?.requesterId === reqId
                );

                if (!alreadyNotified) {
                   // Fetch requester info if missing from cache
                   let requester = usersRef.current.find(u => u.id === reqId);
                   if (!requester) {
                       const { data } = await supabase.from('users').select('*').eq('id', reqId).single();
                       if (data) requester = mapUserFromDB(data);
                   }

                   if (requester) {
                     playNotificationSound();
                     const notif: AppNotification = {
                       id: `req_${reqId}_${Date.now()}`, // Unique ID
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
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = Object.keys(state);
        setOnlineUsers(onlineIds);
        if (currentUser) channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, messages, notifications, knownAccounts, theme, isLoading, enableAnimations, animationSpeed, enableLiquid, glassOpacity, showPermissionPrompt, notificationPermission,
      appConfig, isAdmin, isOwner, onlineUsers,
      login, loginWithCredentials, logout, switchAccount, removeKnownAccount, signup, updateProfile, deleteAccount, deactivateAccount,
      sendMessage, broadcastMessage, sendFriendRequest, acceptFriendRequest, unfriend, markNotificationRead,
      toggleTheme, toggleAnimations, setAnimationSpeed, toggleLiquid, setGlassOpacity, markConversationAsRead, checkIsAdmin, checkIsOwner, checkIsOnline, enableNotifications, closePermissionPrompt, updateAppConfig, getTimeSpent, getWeeklyStats
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
