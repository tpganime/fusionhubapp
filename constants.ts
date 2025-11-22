import { AppShortcut, User, Message, Gender } from './types';

export const HOME_SHORTCUTS: AppShortcut[] = [
  { name: "Anime", url: "https://www.hindianimezone.in/", icon: "hindianimezone.in", description: "Stream Anime" },
  { name: "Music", url: "https://fusionmusic.lovable.app/", description: "Listen to Music" },
  { name: "Game server 1", url: "https://www.crazygames.com/", icon: "crazygames.com", description: "Crazy Games" },
  { name: "Game server 2", url: "https://poki.com/", icon: "poki.com", description: "Poki Games" },
  { name: "Watch together", url: "https://app.kosmi.io/", icon: "kosmi.io", description: "Watch with Friends" }
];

export const PRIVACY_POLICY_TEXT = `Last updated: November 6, 2025

1. Information We Collect
We collect information you provide directly to us, including:
• Account information (email, username, password)
• Profile information (avatar, description, birthdate, gender)
• Messages and chat content
• Friend connections and interactions

2. How We Use Your Information
We use the information we collect to:
• Provide, maintain, and improve our services
• Enable communication between users
• Send you technical notices and support messages
• Respond to your comments and questions
• Protect against fraudulent or illegal activity

3. Information Sharing
We do not sell your personal information. We may share your information:
• With other users as part of the app's functionality (profile, messages)
• With service providers who assist in operating our platform
• When required by law or to protect rights and safety

4. Data Security
We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.

5. Your Privacy Controls
You can control your privacy through:
• Making your profile private (only friends can view)
• Controlling who can send you private messages
• Blocking users
• Deleting your account at any time

6. Data Retention
We retain your information as long as your account is active. When you delete your account, we will delete your personal information within 30 days, except where we are required to retain it by law.

7. Children's Privacy
Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.

8. Changes to This Policy
We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.

9. Contact Us
If you have any questions about this Privacy Policy, please contact us through the app or email us at support@fusionhub.com`;

export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'DemoUser',
    email: 'demo@example.com',
    password: 'password',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    description: 'Welcome to FusionHub! I am a demo user.',
    birthdate: '1995-08-15',
    gender: Gender.MALE,
    isPrivateProfile: false,
    allowPrivateChat: true,
    friends: ['2', '3'],
    requests: ['4']
  },
  {
    id: '2',
    username: 'Sarah_Sky',
    email: 'sarah@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    description: 'Lover of coffee and code. ☕️💻',
    birthdate: '1998-03-22',
    gender: Gender.FEMALE,
    isPrivateProfile: false,
    allowPrivateChat: true,
    friends: ['1'],
    requests: []
  },
  {
    id: '3',
    username: 'GamerX',
    email: 'gamer@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    description: 'Competitive gamer. Catch me on Server 1.',
    gender: Gender.OTHER,
    isPrivateProfile: true,
    allowPrivateChat: false,
    friends: ['1'],
    requests: []
  },
  {
    id: '4',
    username: 'MysteryGuest',
    email: 'guest@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoey',
    description: 'Just looking around.',
    gender: Gender.FEMALE,
    isPrivateProfile: false,
    allowPrivateChat: true,
    friends: [],
    requests: []
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: '2',
    receiverId: '1',
    content: 'Hey! Welcome to the app.',
    timestamp: Date.now() - 86400000,
    read: true
  },
  {
    id: 'm2',
    senderId: '1',
    receiverId: '2',
    content: 'Thanks! It looks great so far.',
    timestamp: Date.now() - 86000000,
    read: true
  },
  {
    id: 'm3',
    senderId: '2',
    receiverId: '1',
    content: 'Did you check out the music shortcut?',
    timestamp: Date.now() - 3600000,
    read: false
  }
];
