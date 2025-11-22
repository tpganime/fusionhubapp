import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Message, Notification, Gender } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  messages: Message[];
  notifications: Notification[];
  theme: 'light' | 'dark';
  isLoading: boolean;
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
  markConversationAsRead: (senderId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'fh_theme_v1',
  CURRENT_USER_ID: 'fh_current_user_id_v1'
};

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";

// -- Helpers to map between DB (snake_case) and App (camelCase) --

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

const mapMessageFromDB = (dbMsg: any): Message => ({
  id: dbMsg.id,
  senderId: dbMsg.sender_id,
  receiverId: dbMsg.receiver_id,
  content: dbMsg.content,
  timestamp: Number(dbMsg.timestamp),
  read: !!dbMsg.read
});

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Refs to access state inside subscription callbacks
  const currentUserRef = useRef<User | null>(null);
  const usersRef = useRef<User[]>([]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Sound and Notification Helper
  const triggerNotification = (title: string, body: string, icon?: string) => {
    const isHidden = document.hidden;
    const hasPermission = "Notification" in window && Notification.permission === "granted";

    if (isHidden && hasPermission) {
      // Background: Use system notification with system sound (remove silent: true)
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          silent: false // Ensure system default sound plays
        });
      } catch (e) {
        console.error("Notification error:", e);
      }
    } else {
      // Foreground OR No Permission: Play custom sound
      try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.6;
        audio.play().catch(e => console.warn("Audio autoplay blocked until user interaction:", e));
      } catch (e) {
        console.error("Audio play error:", e);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  };

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Users
        const { data: usersData, error: userError } = await supabase.from('users').select('*');
        if (userError) throw userError;
        const mappedUsers = usersData.map(mapUserFromDB);
        setUsers(mappedUsers);
        
        // 2. Fetch Messages
        const { data: msgsData, error: msgError } = await supabase.from('messages').select('*');
        if (msgError) throw msgError;
        setMessages(msgsData.map(mapMessageFromDB));

        // 3. Auto Login
        const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        if (savedId) {
          const found = mappedUsers.find(u => u.id === savedId);
          if (found) {
            setCurrentUser(found);
            requestNotificationPermission();
          }
        }

        // 4. Load Theme
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);

      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase.channel('public:data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = mapMessageFromDB(payload.new);
        setMessages(prev => [...prev, newMsg]);

        // Handle Notifications for Messages
        if (currentUserRef.current && newMsg.receiverId === currentUserRef.current.id) {
          const sender = usersRef.current.find(u => u.id === newMsg.senderId);
          const senderName = sender ? sender.username : 'Someone';

          // App Internal Notification
          const notif: Notification = {
            id: Date.now().toString(),
            type: 'message',
            content: `New message from ${senderName}`,
            read: false,
            timestamp: Date.now(),
            data: { targetUser: sender, avatar: sender?.avatar }
          };
          setNotifications(prev => [notif, ...prev]);

          // Trigger Sound and System Notification
          triggerNotification(`Message from ${senderName}`, newMsg.content, sender?.avatar);
        }
      })
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
                 const notif: Notification = {
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
     // Simulate auth check against loaded users (Real app would use Supabase Auth)
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
    // State updates via realtime subscription
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    const { error } = await supabase.from('users').delete().eq('id', currentUser.id);
    if (!error) logout();
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    const newMsg: Message = {
      id: crypto.randomUUID(),
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
    
    // Optimistic
    setMessages(prev => prev.map(m => 
      (m.senderId === senderId && m.receiverId === currentUser.id && !m.read) 
        ? { ...m, read: true } 
        : m
    ));

    // DB Update (Batch update not simple in Supabase JS without stored procedure, doing individual for simplicity or rely on backend trigger in real app)
    // For this demo, we'll update locally mainly. To persist read status:
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

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      messages,
      notifications,
      theme,
      isLoading,
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