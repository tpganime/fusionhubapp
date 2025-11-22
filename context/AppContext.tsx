import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Message, Notification, Gender } from '../types';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  notifications: Notification[];
  theme: 'light' | 'dark';
  login: (user: User) => void;
  logout: () => void;
  signup: (user: User) => void;
  updateProfile: (updatedUser: User) => void;
  deleteAccount: () => void;
  sendMessage: (receiverId: string, content: string) => void;
  sendFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (requesterId: string) => void;
  markNotificationRead: (id: string) => void;
  toggleTheme: () => void;
  markConversationAsRead: (senderId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'fh_users_v1',
  CURRENT_USER: 'fh_current_user_v1',
  MESSAGES: 'fh_messages_v1',
  THEME: 'fh_theme_v1'
};

// Empty initial mock data
const MOCK_USERS: User[] = [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : MOCK_USERS;
    } catch (e) {
      return MOCK_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed) {
        const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        const allUsers = savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
        return allUsers.find((u: User) => u.id === parsed.id) || parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.MESSAGES && e.newValue) {
        setMessages(JSON.parse(e.newValue));
      }
      if (e.key === STORAGE_KEYS.USERS && e.newValue) {
        setUsers(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    if (currentUser) {
      const freshUser = users.find(u => u.id === currentUser.id) || currentUser;
      if (JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
         setCurrentUser(freshUser);
      }
    }
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      generateNotifications();
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setNotifications([]);
    }
  }, [currentUser, users, messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const generateNotifications = () => {
    if (!currentUser) return;
    const newNotifs: Notification[] = [];

    // 1. Friend Requests
    currentUser.requests.forEach(reqId => {
      const requester = users.find(u => u.id === reqId);
      if (requester) {
        newNotifs.push({
          id: `req-${reqId}`,
          type: 'friend_request',
          content: `${requester.username} sent you a friend request`,
          read: false,
          timestamp: Date.now(),
          data: { requesterId: reqId, avatar: requester.avatar }
        });
      }
    });

    // 2. Welcome Message
    newNotifs.push({ 
      id: 'welcome', 
      type: 'system', 
      content: `Welcome back, ${currentUser.username}!`, 
      read: true, 
      timestamp: Date.now() 
    });

    setNotifications(newNotifs);
  };

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const signup = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const updateProfile = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  const deleteAccount = () => {
    if (currentUser) {
      setUsers(prev => prev.filter(u => u.id !== currentUser.id));
      setCurrentUser(null);
    }
  };

  const sendMessage = (receiverId: string, content: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId,
      content,
      timestamp: Date.now(),
      read: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const markConversationAsRead = (senderId: string) => {
    if (!currentUser) return;
    
    const hasUnread = messages.some(m => 
      m.senderId === senderId && 
      m.receiverId === currentUser.id && 
      !m.read
    );

    if (hasUnread) {
      setMessages(prev => prev.map(m => {
        if (m.senderId === senderId && m.receiverId === currentUser.id && !m.read) {
          return { ...m, read: true };
        }
        return m;
      }));
    }
  };

  const sendFriendRequest = (targetUserId: string) => {
    if (!currentUser) return;
    
    setUsers(prev => prev.map(u => {
      if (u.id === targetUserId) {
        if (!u.requests.includes(currentUser.id) && !u.friends.includes(currentUser.id)) {
          return { ...u, requests: [...u.requests, currentUser.id] };
        }
      }
      return u;
    }));
  };

  const acceptFriendRequest = (requesterId: string) => {
    if (!currentUser) return;
    
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          requests: u.requests.filter(id => id !== requesterId),
          friends: [...u.friends, requesterId]
        };
      }
      if (u.id === requesterId) {
        return {
          ...u,
          friends: [...u.friends, currentUser.id]
        };
      }
      return u;
    }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, 
      users, 
      messages, 
      notifications, 
      theme,
      login, 
      logout, 
      signup, 
      updateProfile, 
      deleteAccount,
      sendMessage, 
      sendFriendRequest,
      acceptFriendRequest,
      markNotificationRead,
      toggleTheme,
      markConversationAsRead
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