

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
  isSwitchAccountModalOpen: boolean;
  appConfig: AppConfig;
  isAdmin: boolean;
  isOwner: boolean;
  onlineUsers: string[];
  typingStatus: Record<string, boolean>;
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
  sendTypingSignal: (receiverId: string) => Promise<void>;
  broadcastMessage: (content: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requesterId: string) => Promise<void>;
  unfriend: (targetUserId: string) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
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
  openSwitchAccountModal: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'fh_theme_v1',
  CURRENT_USER_ID: 'fh_current_user_id_v1',
  ANIMATIONS: 'fh_animations_v1',
  ANIM_SPEED: 'fh_anim_speed_v1',
  LIQUID: 'fh_liquid_v1',
  GLASS_OPACITY: 'fh_glass_opacity_v1',
  CACHE_USERS: 'fh_cache_users_v2', 
  CACHE_MESSAGES: 'fh_cache_messages_v2',
  CACHE_NOTIFICATIONS: 'fh_cache_notifications_v2',
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
      password: dbUser.password, 
      avatar: dbUser.avatar || 'https://via.placeholder.com/150',
      description: dbUser.description,
      birthdate: dbUser.birthdate,
      gender: dbUser.gender as Gender,
      isPrivateProfile: !!dbUser.is_private_profile,
      allowPrivateChat: !!dbUser.allow_private_chat,
      friends: Array.isArray(dbUser.friends) ? dbUser.friends : [],
      requests: Array.isArray(dbUser.requests) ? dbUser.requests : [],
      lastSeen: dbUser.last_seen,
      isDeactivated: !!dbUser.is_deactivated,
      blockedUsers: Array.isArray(dbUser.blocked_users) ? dbUser.blocked_users : [],
      instagramLink: dbUser.instagram_link,
      isPremium: !!dbUser.is_premium,
      premiumExpiry: dbUser.premium_expiry ? Number(dbUser.premium_expiry) : undefined
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
      blockedUsers: []
    };
  }
};

const mapUserToDB = (user: User) => {
    // Safety check for premium expiry to prevent DB errors
    let expiry = null;
    if (user.premiumExpiry && !isNaN(user.premiumExpiry)) {
        expiry = user.premiumExpiry;
    }

    return {
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
      is_deactivated: user.isDeactivated,
      blocked_users: user.blockedUsers || [],
      instagram_link: user.instagramLink,
      is_premium: user.isPremium || false,
      premium_expiry: expiry 
    };
};

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
  timestamp: msg.timestamp, 
  read: msg.read
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- PREDICTIVE PRE-LOADING ---
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHE_USERS);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        const storedUsers = localStorage.getItem(STORAGE_KEYS.CACHE_USERS);
        if (savedId && storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            return parsedUsers.find((u: User) => u.id === savedId) || null;
        }
    } catch {}
    return null;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHE_NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) { return []; }
  });

  const [knownAccounts, setKnownAccounts] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.KNOWN_ACCOUNTS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  const [isLoading, setIsLoading] = useState(!currentUser); 

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSwitchAccountModalOpen, setIsSwitchAccountModalOpen] = useState(false);
  
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // -- PREMIUM RESTRICTIONS ENFORCEMENT & EXPIRY CHECK --
  useEffect(() => {
      if (currentUser) {
          // Check for Expiry
          if (currentUser.isPremium && currentUser.premiumExpiry) {
              if (Date.now() > currentUser.premiumExpiry) {
                  // Expired! Reset.
                  console.log("Premium Expired. Resetting...");
                  updateProfile({ ...currentUser, isPremium: false, premiumExpiry: undefined });
                  return;
              }
          }

          if (!currentUser.isPremium) {
              // If animations enabled, force disable
              if (enableAnimations) setEnableAnimations(false);
              // If glass opacity not 30%, force 30%
              if (glassOpacity !== 0.3) setGlassOpacity(0.3);
              // If speed not balanced, force balanced
              if (animationSpeed !== 'balanced') setAnimationSpeed('balanced');
          }
      }
  }, [currentUser, enableAnimations, glassOpacity, animationSpeed]);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  
  // -- BACKGROUND CACHING WITH DEBOUNCE --
  useEffect(() => {
    if (users.length > 0) {
      const timer = setTimeout(() => localStorage.setItem(STORAGE_KEYS.CACHE_USERS, JSON.stringify(users)), 500);
      return () => clearTimeout(timer);
    }
  }, [users]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => localStorage.setItem(STORAGE_KEYS.CACHE_MESSAGES, JSON.stringify(messages)), 500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.KNOWN_ACCOUNTS, JSON.stringify(knownAccounts));
  }, [knownAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CACHE_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const checkIsOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const checkIsAdmin = (email: string) => email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || checkIsOwner(email);
  const checkIsOnline = (userId: string) => onlineUsers.includes(userId);
  const isOwner = currentUser ? checkIsOwner(currentUser.email) : false;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.email) : false;

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
    // If opacity is near 0, remove filter to make it perfectly clear
    if (glassOpacity <= 0.05) {
        document.documentElement.style.setProperty('--glass-filter', 'none');
    } else {
        document.documentElement.style.setProperty('--glass-filter', 'blur(20px) saturate(180%)');
    }
    localStorage.setItem(STORAGE_KEYS.GLASS_OPACITY, glassOpacity.toString());
  }, [glassOpacity]);

  useEffect(() => {
    document.documentElement.setAttribute('data-anim-speed', animationSpeed);
    localStorage.setItem(STORAGE_KEYS.ANIM_SPEED, animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANIMATIONS, String(enableAnimations));
  }, [enableAnimations]);

  // -- OPTIMIZED TIME TRACKING (Strict 12 AM IST Reset) --
  useEffect(() => {
    if (!currentUser) return;
    const getISTDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

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
           const cutoff = new Date();
           cutoff.setDate(cutoff.getDate() - 8);
           const cutoffStr = cutoff.toISOString().split('T')[0];
           Object.keys(history).forEach(k => { if (k < cutoffStr) delete history[k]; });

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

    const interval = setInterval(saveTime, 10000); 
    window.addEventListener('beforeunload', saveTime);
    window.addEventListener('visibilitychange', () => {
        if (document.hidden) saveTime();
        else sessionStartRef.current = Date.now(); 
    });

    return () => { clearInterval(interval); window.removeEventListener('beforeunload', saveTime); saveTime(); };
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
    
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayStored = parseInt(localStorage.getItem(dailyKey) || '0', 10);
    const currentSession = Date.now() - sessionStartRef.current;
    history[today] = todayStored + currentSession;

    const stats: WeeklyStat[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setTime(d.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateKey = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); 
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: "Asia/Kolkata" }); 
        stats.push({ day: dayLabel, date: dateKey, ms: history[dateKey] || 0 });
    }
    return stats;
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
        const filtered = prev.filter(u => u.id !== user.id);
        return [...filtered, user];
    });
  };

  const updatePresence = async (user: User) => {
    if (channelRef.current) {
        await channelRef.current.track({ user_id: user.id, online_at: new Date().toISOString() });
    }
  };

  const login = async (user: User) => { 
      // If user was deactivated, reactivate on login
      if (user.isDeactivated) {
          const reactivatedUser = { ...user, isDeactivated: false };
          await supabase.from('users').update({ is_deactivated: false }).eq('id', user.id);
          setCurrentUser(reactivatedUser);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id); 
          saveAccountToHistory(reactivatedUser);
          updatePresence(reactivatedUser);
      } else {
          setCurrentUser(user); 
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id); 
          saveAccountToHistory(user);
          updatePresence(user);
      }
      
      checkPermissionStatus();
      setIsSwitchAccountModalOpen(false);
      
      const requests = user.requests || [];
      if (requests.length > 0) {
          const { data: requestUsers } = await supabase.from('users').select('*').in('id', requests);
          if (requestUsers) {
              const newNotifs: AppNotification[] = requestUsers.map((reqUser: any) => ({
                  id: `req_${reqUser.id}`, 
                  type: 'friend_request',
                  content: `${reqUser.username} sent you a friend request`,
                  read: false,
                  timestamp: Date.now(),
                  data: { requesterId: reqUser.id, avatar: reqUser.avatar }
              }));
              setNotifications(prev => {
                  const existingIds = new Set(prev.map(n => n.id));
                  const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
                  return [...uniqueNew, ...prev];
              });
          }
      }
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

  const logout = () => { 
      if (channelRef.current) {
          channelRef.current.untrack();
      }
      setCurrentUser(null); 
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID); 
      setNotifications([]); 
  };
  const signup = async (user: User) => {
      setUsers(prev => [...prev, user]);
      await login(user);
      const { error } = await supabase.from('users').insert(mapUserToDB(user));
      if (error) console.error("Signup DB Error:", error);
  };

  const updateProfile = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    saveAccountToHistory(updatedUser);
    try {
        const { error } = await supabase.from('users').update(mapUserToDB(updatedUser)).eq('id', updatedUser.id);
        if (error) {
            console.error("Profile Update Error:", error);
            // Show exact error message to user for debugging
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
  
  const deactivateAccount = async () => { 
      if (currentUser) {
          await updateProfile({ ...currentUser, isDeactivated: true });
          logout(); 
      }
  };
  
  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;

    // Check Block Status
    const receiver = users.find(u => u.id === receiverId);
    if (!receiver) return;

    if (currentUser.blockedUsers.includes(receiverId)) {
        alert("You have blocked this user.");
        return;
    }
    if (receiver.blockedUsers.includes(currentUser.id)) {
        alert("Message cannot be delivered.");
        return;
    }
    
    if (receiver.isDeactivated) {
        alert("This user has deactivated their account.");
        return;
    }

    const newMsg: Message = { id: generateUUID(), senderId: currentUser.id, receiverId, content, timestamp: Date.now(), read: false };
    
    // Optimistic Update
    setMessages(prev => [...prev, newMsg]);
    playSendSound();
    
    const currentCache = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES) || '[]');
    localStorage.setItem(STORAGE_KEYS.CACHE_MESSAGES, JSON.stringify([...currentCache, newMsg]));

    try {
        const { error } = await supabase.from('messages').insert(mapMessageToDB(newMsg));
        if (error) {
            console.error("Message Send Error:", error);
            setMessages(prev => prev.filter(m => m.id !== newMsg.id));
            
            // Helpful Error Handling for User
            if (error.message.includes('Internal error') || error.message.includes('invalid input syntax')) {
                 alert("DATABASE ERROR: The database needs to be updated. Please go to Settings -> Admin Panel -> Database Fixer and run the code.");
            } else if (error.code === '42P01') { 
                alert("System Error: The 'messages' table does not exist. Please ask the Admin to run the database setup.");
            } else {
                alert(`Failed to send message: ${error.message}`);
            }
        }
    } catch (e) {
        console.error("Network Exception:", e);
        setMessages(prev => prev.filter(m => m.id !== newMsg.id));
        alert("Failed to send message due to network error.");
    }
  };

  const sendTypingSignal = async (receiverId: string) => {
    if (!channelRef.current || !currentUserRef.current) return;
    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { from: currentUserRef.current.id, to: receiverId }
      });
    } catch(e) { console.error("Typing signal failed", e); }
  };

  const broadcastMessage = async (content: string) => {
      if (!isAdmin || !currentUser) return;
      await sendMessage(BROADCAST_ID, content);
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    try {
        setUsers(prev => prev.map(u => {
            if (u.id === targetUserId) {
                if (u.requests.includes(currentUser.id)) return u;
                return { ...u, requests: [...u.requests, currentUser.id] };
            }
            return u;
        }));
        
        const { data, error } = await supabase.from('users').select('requests').eq('id', targetUserId).single();
        if (error) throw error;

        if (data) {
            let currentRequests = data.requests || [];
            if (!currentRequests.includes(currentUser.id)) {
                const { error: updateError } = await supabase.from('users').update({ requests: [...currentRequests, currentUser.id] }).eq('id', targetUserId);
                if (updateError) throw updateError;
            }
        }
    } catch (error: any) {
        console.error("Failed to send friend request:", error);
        alert(`Failed to send request: ${error.message || 'Unknown error'}`);
        // Revert optimistic update
        setUsers(prev => prev.map(u => {
             if (u.id === targetUserId) {
                 return { ...u, requests: u.requests.filter(id => id !== currentUser.id) };
             }
             return u;
        }));
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

      await supabase.from('users').update({ friends: myNewFriends }).eq('id', currentUser.id);
      
      const { data } = await supabase.from('users').select('friends').eq('id', targetUserId).single();
      if (data) {
          const theirNewFriends = (data.friends || []).filter((id: string) => id !== currentUser.id);
          await supabase.from('users').update({ friends: theirNewFriends }).eq('id', targetUserId);
      }
  };

  const blockUser = async (targetUserId: string) => {
      if (!currentUser) return;
      const newBlocked = [...currentUser.blockedUsers, targetUserId];
      
      // Also unfriend if friends
      if (currentUser.friends.includes(targetUserId)) {
          await unfriend(targetUserId);
      }
      
      await updateProfile({ ...currentUser, blockedUsers: newBlocked });
  };

  const unblockUser = async (targetUserId: string) => {
      if (!currentUser) return;
      const newBlocked = currentUser.blockedUsers.filter(id => id !== targetUserId);
      await updateProfile({ ...currentUser, blockedUsers: newBlocked });
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
  
  // Restricted toggles
  const toggleAnimations = () => {
      if (currentUser && !currentUser.isPremium) return;
      setEnableAnimations(prev => !prev);
  };
  const toggleLiquid = () => setEnableLiquid(prev => !prev);
  
  const openSwitchAccountModal = (isOpen: boolean) => setIsSwitchAccountModalOpen(isOpen);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => { if (isMounted) setIsLoading(false); }, 5000);

    const fetchData = async () => {
      try {
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        try {
            // Priority: Load Cache First
            const cachedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHE_USERS) || '[]');
            if (cachedUsers.length) { 
                setUsers(cachedUsers); 
                syncConfigFromUsers(cachedUsers); 
            }
            const cachedMsgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES) || '[]');
            if (cachedMsgs.length) setMessages(cachedMsgs);
            
            if (savedId && cachedUsers.length) {
                const found = cachedUsers.find((u: User) => u.id === savedId);
                if (found) setCurrentUser(found);
            }
        } catch(e) {}

        // Then Fetch Network
        const { data: usersData, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        
        if (isMounted) {
            const mappedUsers = usersData.map(mapUserFromDB);
            setUsers(mappedUsers);
            syncConfigFromUsers(mappedUsers);
            
            const { data: msgsData } = await supabase.from('messages').select('*').order('timestamp', { ascending: false }).limit(200); // Increased limit
            if (msgsData) setMessages(msgsData.map(mapMessageFromDB).reverse());

            if (savedId) {
                const found = mappedUsers.find(u => u.id === savedId);
                if (found) { 
                    setCurrentUser(found); 
                    checkPermissionStatus();
                    
                    const requests = found.requests || [];
                    if (requests.length > 0) {
                        const { data: requestUsers } = await supabase.from('users').select('*').in('id', requests);
                        if (requestUsers) {
                            const newNotifs: AppNotification[] = requestUsers.map((reqUser: any) => ({
                                id: `req_${reqUser.id}`, 
                                type: 'friend_request',
                                content: `${reqUser.username} sent you a friend request`,
                                read: false,
                                timestamp: Date.now(),
                                data: { requesterId: reqUser.id, avatar: reqUser.avatar }
                            }));
                            setNotifications(prev => {
                                const existingIds = new Set(prev.map(n => n.id));
                                const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
                                return [...uniqueNew, ...prev];
                            });
                        }
                    }
                }
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
            // Check blocking
            const sender = usersRef.current.find(u => u.id === newMsg.senderId);
            if (sender && currentUserRef.current.blockedUsers.includes(sender.id)) {
                return; // Suppress blocked message notification
            }

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
      .on('broadcast', { event: 'typing' }, (payload) => {
         const { from, to } = payload.payload;
         if (currentUserRef.current && to === currentUserRef.current.id) {
             // Check if blocked
             if (currentUserRef.current.blockedUsers.includes(from)) return;

             if (typingTimeoutRef.current[from]) {
                 clearTimeout(typingTimeoutRef.current[from]);
             }
             setTypingStatus(prev => ({ ...prev, [from]: true }));
             
             typingTimeoutRef.current[from] = setTimeout(() => {
                 setTypingStatus(prev => {
                     const next = { ...prev };
                     delete next[from];
                     return next;
                 });
             }, 3000);
         }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedUser = mapUserFromDB(payload.new);
          setUsers(prev => {
             const exists = prev.find(u => u.id === updatedUser.id);
             return exists ? prev.map(u => u.id === updatedUser.id ? updatedUser : u) : [...prev, updatedUser];
          });

          if (currentUserRef.current && updatedUser.id === currentUserRef.current.id) {
             // Sync premium status to current session
             setCurrentUser(prev => prev ? ({ ...prev, isPremium: updatedUser.isPremium, premiumExpiry: updatedUser.premiumExpiry }) : updatedUser);

            const oldRequests = currentUserRef.current.requests || [];
            const newRequests = updatedUser.requests || [];
            
            const addedRequests = newRequests.filter(reqId => !oldRequests.includes(reqId));
            
            const notifiedRequestIds = new Set(notificationsRef.current.filter(n => n.type === 'friend_request').map(n => n.data?.requesterId));
            const missedRequests = newRequests.filter(reqId => !notifiedRequestIds.has(reqId));
            
            const idsToProcess = new Set([...addedRequests, ...missedRequests]);

            if (idsToProcess.size > 0) {
                setCurrentUser(updatedUser);

                for (const reqId of idsToProcess) {
                   // Check blocking
                   if (updatedUser.blockedUsers.includes(reqId)) continue;

                   let requester = usersRef.current.find(u => u.id === reqId);
                   if (!requester) {
                       const { data } = await supabase.from('users').select('*').eq('id', reqId).single();
                       if (data) requester = mapUserFromDB(data);
                   }

                   if (requester) {
                     const notifId = `req_${reqId}`; 
                     
                     setNotifications(prev => {
                         if (prev.some(n => n.id === notifId)) return prev;
                         
                         playNotificationSound();
                         const notif: AppNotification = {
                           id: notifId,
                           type: 'friend_request',
                           content: `${requester.username} sent you a friend request`,
                           read: false,
                           timestamp: Date.now(),
                           data: { requesterId: requester.id, avatar: requester.avatar }
                         };
                         triggerNotification('New Friend Request', `${requester.username} wants to be friends`, requester.avatar);
                         return [notif, ...prev];
                     });
                   }
                }
            }
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // The keys are just unique presence IDs, not user IDs. The values are arrays of state objects.
        const activeUserIds = new Set<string>();
        
        for (const key in state) {
            const presences = state[key] as any[];
            presences.forEach(p => {
                if (p.user_id) activeUserIds.add(p.user_id);
            });
        }
        
        setOnlineUsers(Array.from(activeUserIds));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
             if (currentUserRef.current) {
                 await channel.track({ user_id: currentUserRef.current.id, online_at: new Date().toISOString() });
             }
        }
      });
    
    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, messages, notifications, knownAccounts, theme, isLoading, enableAnimations, animationSpeed, enableLiquid, glassOpacity, showPermissionPrompt, notificationPermission, isSwitchAccountModalOpen,
      appConfig, isAdmin, isOwner, onlineUsers, typingStatus,
      login, loginWithCredentials, logout, switchAccount, removeKnownAccount, signup, updateProfile, deleteAccount, deactivateAccount,
      sendMessage, sendTypingSignal, broadcastMessage, sendFriendRequest, acceptFriendRequest, unfriend, blockUser, unblockUser, markNotificationRead,
      toggleTheme, toggleAnimations, setAnimationSpeed, toggleLiquid, setGlassOpacity, markConversationAsRead, checkIsAdmin, checkIsOwner, checkIsOnline, enableNotifications, closePermissionPrompt, updateAppConfig, getTimeSpent, getWeeklyStats, openSwitchAccountModal
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
