
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
  signup: (user: User) => Promise<void>;
  updateProfile: (updatedUser: User) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  broadcastMessage: (content: string) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requesterId: string) => Promise<void>;
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
  LAST_RESET: 'fh_last_reset_date'
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
  
  const sessionStartRef = useRef(Date.now());

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

  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('balanced');
  const [enableLiquid, setEnableLiquid] = useState(true);
  const [glassOpacity, setGlassOpacity] = useState(0.35);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  const currentUserRef = useRef<User | null>(null);
  const usersRef = useRef<User[]>([]);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { usersRef.current = users; }, [users]);

  // -- TIME TRACKING WITH HISTORY ARCHIVING --
  useEffect(() => {
    if (!currentUser) return;
    
    // Function to get current IST date string (YYYY-MM-DD)
    const getISTDate = () => {
        return new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];
    };

    sessionStartRef.current = Date.now();
    const dailyKey = `fh_time_spent_${currentUser.id}`;
    const historyKey = `fh_time_history_${currentUser.id}`;

    const saveTime = () => {
       const today = getISTDate();
       const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);

       if (lastReset && lastReset !== today) {
           // It's a new day (12 AM IST passed), archive yesterday's time before resetting
           const yesterdayTime = parseInt(localStorage.getItem(dailyKey) || '0', 10);
           
           let history: Record<string, number> = {};
           try { history = JSON.parse(localStorage.getItem(historyKey) || '{}'); } catch(e) {}
           
           if (lastReset) history[lastReset] = yesterdayTime;
           localStorage.setItem(historyKey, JSON.stringify(history));

           // Reset counter for new day
           localStorage.setItem(dailyKey, '0');
           localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
           sessionStartRef.current = Date.now(); 
           return;
       }

       // Normal update for today
       const stored = parseInt(localStorage.getItem(dailyKey) || '0', 10);
       const currentSession = Date.now() - sessionStartRef.current;
       localStorage.setItem(dailyKey, (stored + currentSession).toString());
       sessionStartRef.current = Date.now(); 
    };

    // Initial check on load
    const today = getISTDate();
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    if (!lastReset) {
        localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
    } else if (lastReset !== today) {
        // Handle case where app was loaded on a new day
        saveTime(); 
    }

    const interval = setInterval(saveTime, 30000);
    window.addEventListener('beforeunload', saveTime);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveTime);
      saveTime();
    }
  }, [currentUser?.id]);

  const getTimeSpent = () => {
    if (!currentUser) return "0m";
    const key = `fh_time_spent_${currentUser.id}`;
    const stored = parseInt(localStorage.getItem(key) || '0', 10);
    const currentSession = Date.now() - sessionStartRef.current;
    const totalMs = stored + currentSession;
    
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getWeeklyStats = (): WeeklyStat[] => {
    if (!currentUser) return [];
    
    const historyKey = `fh_time_history_${currentUser.id}`;
    const dailyKey = `fh_time_spent_${currentUser.id}`;
    let history: Record<string, number> = {};
    try { history = JSON.parse(localStorage.getItem(historyKey) || '{}'); } catch(e) {}

    // Add current today time to tracking
    const today = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];
    const todayStored = parseInt(localStorage.getItem(dailyKey) || '0', 10);
    const currentSession = Date.now() - sessionStartRef.current;
    history[today] = todayStored + currentSession;

    const stats: WeeklyStat[] = [];
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        // Ensure same format logic
        const dateKey = d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(',')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); 
        
        stats.push({
            day: dayLabel,
            date: dateKey,
            ms: history[dateKey] || 0
        });
    }
    return stats;
  };

  const checkIsOwner = (email: string) => email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const checkIsAdmin = (email: string) => email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || checkIsOwner(email);
  const checkIsOnline = (userId: string) => onlineUsers.includes(userId);
  const isOwner = currentUser ? checkIsOwner(currentUser.email) : false;
  const isAdmin = currentUser ? checkIsAdmin(currentUser.email) : false;

  useLayoutEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useLayoutEffect(() => {
    if (enableLiquid) document.body.classList.remove('no-liquid');
    else document.body.classList.add('no-liquid');
  }, [enableLiquid]);

  useEffect(() => {
    document.documentElement.style.setProperty('--glass-opacity', glassOpacity.toString());
    if (glassOpacity <= 0.05) document.documentElement.style.setProperty('--glass-filter', 'none');
    else document.documentElement.style.setProperty('--glass-filter', 'blur(20px) saturate(180%)');
  }, [glassOpacity]);

  useEffect(() => {
    document.documentElement.setAttribute('data-anim-speed', animationSpeed);
  }, [animationSpeed]);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      new Notification("Notifications Enabled", { body: "You will now receive alerts!", icon: '/favicon.ico' });
    }
    setShowPermissionPrompt(false);
  }; 
  const closePermissionPrompt = () => setShowPermissionPrompt(false);
  const login = async (user: User) => { setCurrentUser(user); localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id); };
  const loginWithCredentials = async (email: string, pass: string) => {
      const found = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === pass);
      if (found) await login(found);
      else throw new Error("Invalid credentials");
  };
  const logout = () => { setCurrentUser(null); localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID); };
  const signup = async (user: User) => { setUsers(prev => [...prev, user]); await login(user); };
  const updateProfile = async (u: User) => { setCurrentUser(u); return true; }; 
  const deleteAccount = async () => { logout(); };
  const deactivateAccount = async () => { logout(); };
  const sendMessage = async () => {};
  const broadcastMessage = async () => {};
  const sendFriendRequest = async () => {};
  const acceptFriendRequest = async () => {};
  const markNotificationRead = () => {};
  const markConversationAsRead = () => {};
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleAnimations = () => setEnableAnimations(prev => !prev);
  const toggleLiquid = () => setEnableLiquid(prev => !prev);
  const setAnimationSpeedFn = (s: AnimationSpeed) => setAnimationSpeed(s);
  const setGlassOpacityFn = (n: number) => setGlassOpacity(n);
  const updateAppConfig = async () => {};

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
        if (isMounted) {
            console.warn("Data fetch timed out - forcing app load.");
            setIsLoading(false);
        }
    }, 5000);

    const fetchData = async () => {
      try {
        const cachedUsersStr = localStorage.getItem(STORAGE_KEYS.CACHE_USERS);
        const cachedMessagesStr = localStorage.getItem(STORAGE_KEYS.CACHE_MESSAGES);
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        
        let cachedUsersList: User[] = [];

        if (cachedUsersStr) {
          try {
            cachedUsersList = JSON.parse(cachedUsersStr);
            if (cachedUsersList.length > 0 && isMounted) {
                setUsers(cachedUsersList);
            }
          } catch (e) {}
        }

        if (cachedMessagesStr && isMounted) {
          try {
            const cachedMsgs = JSON.parse(cachedMessagesStr);
            if (cachedMsgs.length > 0) setMessages(cachedMsgs);
          } catch (e) {}
        }

        if (savedId && cachedUsersList.length > 0 && isMounted) {
            const found = cachedUsersList.find(u => u.id === savedId);
            if (found) {
                setCurrentUser(found);
                setIsLoading(false);
                clearTimeout(safetyTimeout);
            }
        }

        const { data: usersData, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        
        if (isMounted) {
            const mappedUsers = usersData.map(mapUserFromDB);
            setUsers(mappedUsers);
            
            const { data: msgsData, error: msgError } = await supabase.from('messages').select('*').order('timestamp', { ascending: false }).limit(100);
            if (!msgError) {
                const mappedMsgs = msgsData.map(mapMessageFromDB).reverse();
                setMessages(mappedMsgs);
            }

            if (savedId) {
                const found = mappedUsers.find(u => u.id === savedId);
                if (found) {
                    setCurrentUser(found);
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
    
    return () => { 
        isMounted = false; 
        clearTimeout(safetyTimeout); 
    };
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser, users, messages, notifications, theme, isLoading, enableAnimations, animationSpeed, enableLiquid, glassOpacity, showPermissionPrompt, notificationPermission,
      appConfig, isAdmin, isOwner, onlineUsers,
      login, loginWithCredentials, logout, signup, updateProfile, deleteAccount, deactivateAccount,
      sendMessage, broadcastMessage, sendFriendRequest, acceptFriendRequest, markNotificationRead,
      toggleTheme, toggleAnimations, setAnimationSpeed: setAnimationSpeedFn, toggleLiquid, setGlassOpacity: setGlassOpacityFn, markConversationAsRead, checkIsAdmin, checkIsOwner, checkIsOnline, enableNotifications, closePermissionPrompt, updateAppConfig, getTimeSpent, getWeeklyStats
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
