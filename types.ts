

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY = 'Prefer not to say'
}

export type AnimationSpeed = 'fast' | 'balanced' | 'relaxed';

export interface User {
  id: string;
  username: string; // This is the handle (e.g. _t.a.n.m.a.y_17)
  name?: string;    // This is the display name (e.g. CHAUDHARY TANMAY)
  password?: string; // In a real app, never store plain text
  email: string;
  avatar: string;
  description?: string;
  birthdate?: string;
  gender?: Gender;
  isPrivateProfile: boolean;
  allowPrivateChat: boolean;
  friends: string[]; // list of user IDs
  requests: string[]; // list of user IDs
  lastSeen?: string;
  isDeactivated?: boolean;
  blockedUsers: string[]; // list of IDs this user has blocked
  instagramLink?: string;
  isPremium?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface AppShortcut {
  name: string;
  url: string;
  icon?: string;
  description?: string;
}

export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'system';
  content: string;
  read: boolean;
  timestamp: number;
  data?: any;
}

export interface AppConfig {
  features: {
    home: boolean;
    chat: boolean;
    search: boolean;
    profile: boolean;
    shortcuts: {
      [key: string]: boolean;
    };
  };
}