
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Volume2, Send, Database, Copy } from 'lucide-react';
import { HOME_SHORTCUTS } from '../constants';

export const AdminPanelScreen: React.FC = () => {
  const { appConfig, updateAppConfig, broadcastMessage, isAdmin } = useApp();
  const navigate = useNavigate();
  const [localConfig, setLocalConfig] = useState(appConfig);
  const [broadcastText, setBroadcastText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isAdmin) {
    navigate('/home');
    return null;
  }

  const handleToggleFeature = (feature: keyof typeof localConfig.features) => {
    if (feature === 'shortcuts') return;
    setLocalConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const handleToggleShortcut = (name: string) => {
    setLocalConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        shortcuts: {
          ...prev.features.shortcuts,
          [name]: !prev.features.shortcuts[name]
        }
      }
    }));
  };

  const saveConfig = async () => {
    await updateAppConfig(localConfig);
    alert('Configuration saved & broadcasted to all users.');
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setSending(true);
    await broadcastMessage(broadcastText);
    setBroadcastText('');
    setSending(false);
    alert('Message sent to all users.');
  };

  const sqlCode = `-- Run this in your Supabase SQL Editor to fix 'Messages not sending' and other errors.

-- 1. Create Tables (If they don't exist yet)
create table if not exists users (
  id uuid primary key,
  username text,
  email text,
  password text,
  avatar text,
  description text,
  friends text[] default '{}',
  requests text[] default '{}',
  last_seen timestamptz default now(),
  blocked_users text[] default '{}'
);

create table if not exists messages (
  id uuid primary key,
  sender_id text,
  receiver_id text,
  content text,
  timestamp bigint,  -- Changed to bigint for proper ordering
  read boolean default false
);

-- 2. Add Missing Columns to 'users' (Safe to run multiple times)
alter table users add column if not exists name text;
alter table users add column if not exists birthdate text;
alter table users add column if not exists gender text;
alter table users add column if not exists is_deactivated boolean default false;
alter table users add column if not exists blocked_users text[] default '{}';
alter table users add column if not exists instagram_link text;
alter table users add column if not exists is_private_profile boolean default false;
alter table users add column if not exists allow_private_chat boolean default true;

-- 3. Reset Policies (Fixes "policy already exists" or permission errors)
drop policy if exists "Allow all operations" on users;
drop policy if exists "Allow all operations" on messages;

-- 4. Enable Public Access (RLS)
alter table users enable row level security;
alter table messages enable row level security;

create policy "Allow all operations" on users for all using (true) with check (true);
create policy "Allow all operations" on messages for all using (true) with check (true);
`;

  const copySql = () => {
      navigator.clipboard.writeText(sqlCode);
      alert("SQL Code Copied! Paste it in Supabase SQL Editor.");
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden animate-fade-in">
      <div className="flex-none bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center z-50 shadow-sm">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative z-50 cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Admin Panel</h2>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 max-w-md mx-auto w-full no-scrollbar pb-24">
        
        {/* Broadcast */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
              <Volume2 className="w-6 h-6" />
              <h3 className="font-bold text-lg">System Broadcast</h3>
           </div>
           <textarea
             value={broadcastText}
             onChange={e => setBroadcastText(e.target.value)}
             placeholder="Type an announcement..."
             className="w-full p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 min-h-[100px] mb-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
           />
           <button 
             onClick={handleBroadcast}
             disabled={sending || !broadcastText.trim()}
             className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 relative z-10"
           >
             <Send className="w-4 h-4" /> Send to Everyone
           </button>
        </div>

        {/* Feature Toggles */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Main Features</h3>
          <div className="space-y-4">
             {['home', 'chat', 'search', 'profile'].map((feat) => (
                <div key={feat} className="flex items-center justify-between">
                   <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{feat}</span>
                   <label className="relative inline-flex items-center cursor-pointer z-10">
                     <input 
                        type="checkbox" 
                        checked={(localConfig.features as any)[feat]} 
                        onChange={() => handleToggleFeature(feat as any)} 
                        className="sr-only peer" 
                     />
                     <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                   </label>
                </div>
             ))}
          </div>
        </div>
        
        {/* Database Schema Generator */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-3 mb-4 text-purple-600 dark:text-purple-400">
              <Database className="w-6 h-6" />
              <h3 className="font-bold text-lg">Database Fixer</h3>
           </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">If messages aren't sending or user updates fail, copy and run this code in Supabase SQL Editor.</p>
           <div className="relative">
             <pre className="w-full p-3 bg-gray-900 rounded-xl text-green-400 text-[10px] overflow-x-auto font-mono h-32 border border-gray-700">
                {sqlCode}
             </pre>
             <button 
                onClick={copySql}
                className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors z-10"
             >
                <Copy className="w-4 h-4" />
             </button>
           </div>
        </div>

        <button 
           onClick={saveConfig}
           className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg transform transition-transform active:scale-95 flex items-center justify-center gap-2 relative z-10"
        >
           <Save className="w-5 h-5" /> Save Configuration
        </button>

      </main>
    </div>
  );
};
