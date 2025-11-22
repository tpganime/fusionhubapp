import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  toggleTheme: () => void;
  markConversationAsRead: (senderId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'fh_theme_v1',
  CURRENT_USER_ID: 'fh_current_user_id_v1'
};

// -- Helpers to map between DB (snake_case) and App (camelCase) --

const mapUserFromDB = (dbUser: any): User => ({
  id: dbUser.id,
  username: dbUser.username,
  email: dbUser.email,
  password: dbUser.password,
  avatar: dbUser.avatar,
  description: dbUser.description,
  birthdate: dbUser.birthdate,
  gender: dbUser.gender as Gender,
  isPrivateProfile: dbUser.is_private_profile,
  allowPrivateChat: dbUser.allow_private_chat,
  friends: dbUser.friends || [],
  requests: dbUser.requests || [],
  blocked: dbUser.blocked || []
});

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
  blocked: user.blocked
});

const mapMessageFromDB = (dbMsg: any): Message => ({
  id: dbMsg.id,
  senderId: dbMsg.sender_id,
  receiverId: dbMsg.receiver_id,
  content: dbMsg.content,
  timestamp: Number(dbMsg.timestamp),
  read: dbMsg.read
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

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  // 1. Initial Data Fetch & Auto Login
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      let initialUsers: User[] = [];
      let initialMessages: Message[] = [];

      // Fetch Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      
      if (usersError) {
        console.error('Supabase users fetch failed:', usersError.message);
      } else if (usersData) {
        initialUsers = usersData.map(mapUserFromDB);
      }
      setUsers(initialUsers);

      // Fetch Messages
      const { data: msgsData, error: msgsError } = await supabase.from('messages').select('*');
      if (msgsError) {
        console.error('Supabase messages fetch failed:', msgsError.message);
      } else if (msgsData) {
        initialMessages = msgsData.map(mapMessageFromDB);
      }
      setMessages(initialMessages);

      // Auto Login Check (User Persistence)
      const storedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (storedId) {
        // Try to find in loaded users, or fetch specific if not found
        const found = initialUsers.find(u => u.id === storedId);
        if (found) {
            setCurrentUser(found);
        } else {
            // Fallback: try fetching specific user
            const { data: singleUser } = await supabase.from('users').select('*').eq('id', storedId).single();
            if (singleUser) {
                const mapped = mapUserFromDB(singleUser);
                setCurrentUser(mapped);
                setUsers(prev => [...prev, mapped]);
            }
        }
      }

      setIsLoading(false);
    };

    fetchData();

    // 2. Realtime Subscriptions
    const channel = supabase.channel('public-changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers(prev => {
                if (prev.some(u => u.id === payload.new.id)) return prev;
                return [...prev, mapUserFromDB(payload.new)];
            });
          } else if (payload.eventType === 'UPDATE') {
            setUsers(prev => prev.map(u => u.id === payload.new.id ? mapUserFromDB(payload.new) : u));
            // If the updated user is the current user, update that state too
            setCurrentUser(curr => curr?.id === payload.new.id ? mapUserFromDB(payload.new) : curr);
          } else if (payload.eventType === 'DELETE') {
             setUsers(prev => prev.filter(u => u.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Only add if not already present (deduplication for optimistic updates)
            setMessages(prev => {
                if (prev.some(m => m.id === payload.new.id)) return prev;
                return [...prev, mapMessageFromDB(payload.new)];
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? mapMessageFromDB(payload.new) : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Generate Notifications locally based on data
  useEffect(() => {
    if (currentUser) {
      const newNotifs: Notification[] = [];
      // Friend Requests
      currentUser.requests.forEach(reqId => {
        // If user is blocked, don't show their requests
        if (currentUser.blocked && currentUser.blocked.includes(reqId)) return;

        const requester = users.find(u => u.id === reqId);
        if (requester) {
          newNotifs.push({
            id: `req-${reqId}`,
            type: 'friend_request',
            content: `${requester.username} sent you a friend request`,
            read: false, // In a real app, track read state in DB
            timestamp: Date.now(),
            data: { requesterId: reqId, avatar: requester.avatar }
          });
        }
      });
      setNotifications(newNotifs);
    } else {
      setNotifications([]);
    }
  }, [currentUser, users]);

  // Theme Persistence
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

  // -- Actions --

  const login = async (user: User) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    setCurrentUser(user);
  };

  const loginWithCredentials = async (email: string, password: string) => {
    // Direct DB check
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    // Check password (simple comparison for this app version)
    if (data.password !== password) {
        throw new Error('Invalid email or password');
    }

    const user = mapUserFromDB(data);
    await login(user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    setCurrentUser(null);
  };

  const signup = async (newUser: User) => {
    // IMPORTANT: Verify we can save to DB before updating local state
    const dbUser = mapUserToDB(newUser);
    const { error } = await supabase.from('users').insert([dbUser]);
    
    if (error) {
        console.error('Supabase signup error:', error);
        throw new Error(error.message || 'Failed to create account. Please try again.');
    }
    
    // Optimistic update after successful API call
    setUsers(prev => [...prev, newUser]);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    setCurrentUser(newUser);
  };

  const updateProfile = async (updatedUser: User) => {
    // Optimistic update
    setCurrentUser(updatedUser); 
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    const dbUser = mapUserToDB(updatedUser);
    const { error } = await supabase.from('users').update(dbUser).eq('id', updatedUser.id);
    if (error) console.warn('Profile update saved locally (Supabase unavailable):', error.message || error);
  };

  const deleteAccount = async () => {
    if (currentUser) {
      setUsers(prev => prev.filter(u => u.id !== currentUser.id));
      const { error } = await supabase.from('users').delete().eq('id', currentUser.id);
      if (error) console.warn('Account deletion local only (Supabase unavailable):', error.message || error);
      logout();
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    
    // Block check
    if (currentUser.blocked?.includes(receiverId)) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId,
      content,
      timestamp: Date.now(),
      read: false
    };
    
    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    const dbMsg = mapMessageToDB(newMessage);
    const { error } = await supabase.from('messages').insert([dbMsg]);
    if (error) console.warn('Message saved locally (Supabase unavailable):', error.message || error);
  };

  const markConversationAsRead = async (senderId: string) => {
    if (!currentUser) return;
    
    const unreadIds = messages
      .filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.read)
      .map(m => m.id);

    if (unreadIds.length > 0) {
      // Optimistic update
      setMessages(prev => prev.map(m => unreadIds.includes(m.id) ? { ...m, read: true } : m));
      
      const { error } = await supabase.from('messages').update({ read: true }).in('id', unreadIds);
      if (error) console.warn('Read status updated locally (Supabase unavailable)');
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    // Block check
    if (currentUser.blocked?.includes(targetUserId)) return;

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;
    
    // Also check if target has blocked current user (simulated by checking their block list if available in local state)
    if (targetUser.blocked?.includes(currentUser.id)) return; 

    if (!targetUser.requests.includes(currentUser.id) && !targetUser.friends.includes(currentUser.id)) {
      const updatedRequests = [...targetUser.requests, currentUser.id];
      
      // Optimistic update for target user
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, requests: updatedRequests } : u));

      const { error } = await supabase.from('users').update({ requests: updatedRequests }).eq('id', targetUserId);
      if (error) console.warn('Friend request saved locally (Supabase unavailable)');
    }
  };

  const acceptFriendRequest = async (requesterId: string) => {
    if (!currentUser) return;
    
    // Update Current User: Remove request, add friend
    const updatedCurrentUser = {
        ...currentUser,
        requests: currentUser.requests.filter(id => id !== requesterId),
        friends: [...currentUser.friends, requesterId]
    };
    await updateProfile(updatedCurrentUser);

    // Update Requester: Add current user to their friends
    const requester = users.find(u => u.id === requesterId);
    if (requester) {
        const updatedRequesterFriends = [...requester.friends, currentUser.id];
        
        // Optimistic update for requester
        setUsers(prev => prev.map(u => u.id === requesterId ? { ...u, friends: updatedRequesterFriends } : u));

        const { error } = await supabase.from('users').update({ friends: updatedRequesterFriends }).eq('id', requesterId);
        if (error) console.warn('Friend acceptance saved locally (Supabase unavailable)');
    }
  };

  const blockUser = async (targetUserId: string) => {
    if (!currentUser) return;

    // 1. Update Current User: Add to blocked, remove from friends/requests
    const currentBlocked = currentUser.blocked || [];
    if (currentBlocked.includes(targetUserId)) return;

    const updatedBlocked = [...currentBlocked, targetUserId];
    const updatedFriends = currentUser.friends.filter(id => id !== targetUserId);
    const updatedRequests = currentUser.requests.filter(id => id !== targetUserId);

    const updatedCurrentUser = {
      ...currentUser,
      blocked: updatedBlocked,
      friends: updatedFriends,
      requests: updatedRequests
    };

    await updateProfile(updatedCurrentUser);

    // 2. Update Target User: Remove current user from their friends/requests
    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser) {
      const targetFriends = targetUser.friends.filter(id => id !== currentUser.id);
      const targetRequests = targetUser.requests.filter(id => id !== currentUser.id);
      
      // Optimistic
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, friends: targetFriends, requests: targetRequests } : u));
      
      const { error } = await supabase.from('users').update({
        friends: targetFriends,
        requests: targetRequests
      }).eq('id', targetUserId);
      
      if (error) console.warn('Block target update failed:', error);
    }
  };

  const unblockUser = async (targetUserId: string) => {
    if (!currentUser) return;
    
    const currentBlocked = currentUser.blocked || [];
    const updatedBlocked = currentBlocked.filter(id => id !== targetUserId);
    
    const updatedCurrentUser = {
      ...currentUser,
      blocked: updatedBlocked
    };

    await updateProfile(updatedCurrentUser);
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
      blockUser,
      unblockUser,
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