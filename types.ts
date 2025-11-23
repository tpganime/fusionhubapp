
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY = 'Prefer not to say'
}

export interface User {
  id: string;
  username: string;
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
