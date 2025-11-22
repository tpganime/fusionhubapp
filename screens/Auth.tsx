import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, Mail } from 'lucide-react';
import { User } from '../types';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, users } = useApp();
  const navigate = useNavigate();

  // Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const handleCheckUsername = (val: string) => {
    setUsername(val);
    if (val.length > 2) {
      const exists = users.some(u => u.username.toLowerCase() === val.toLowerCase());
      setUsernameAvailable(!exists);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login with Email and Password
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      login(user); // This persists the user in AppContext via localStorage
      navigate('/home');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameAvailable) {
        setError('Username is taken or invalid');
        return;
    }
    
    // Check if email exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setError('Email already registered');
        return;
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      email,
      avatar: `https://picsum.photos/200?random=${Date.now()}`, // Random avatar
      isPrivateProfile: false,
      allowPrivateChat: true,
      friends: [],
      requests: []
    };
    signup(newUser);
    navigate('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden mesh-bg transition-colors duration-300">
      {/* Background Blobs - Keep these for extra flair on login */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob dark:opacity-40 dark:mix-blend-normal dark:bg-blue-900"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000 dark:opacity-40 dark:mix-blend-normal dark:bg-purple-900"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000 dark:opacity-40 dark:mix-blend-normal dark:bg-pink-900"></div>

      <div className="w-full max-w-md glass-panel dark:bg-dark-surface/60 p-8 rounded-3xl shadow-2xl z-10 border border-white/30 dark:border-white/10">
        <h1 className="text-3xl font-bold text-center mb-2 text-black">
          FusionHub
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">{isLogin ? 'Welcome Back' : 'Create Account'}</p>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          
          {/* Username Field - Only for Signup */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleCheckUsername(e.target.value)}
                  className={`w-full p-3 rounded-xl border ${usernameAvailable === false ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20'} focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-gray-900 dark:text-white placeholder-gray-400`}
                  placeholder="Choose a username"
                  required={!isLogin}
                />
                {username.length > 2 && (
                  <div className="absolute right-3 top-3.5">
                      {usernameAvailable ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                      ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                  </div>
                )}
              </div>
              {usernameAvailable === false && (
                  <p className="text-xs text-red-500 ml-1">Username is not available</p>
              )}
            </div>
          )}

          {/* Email Field - For both Login and Signup */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">Email</label>
            <div className="relative">
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full p-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                 placeholder="Enter your email"
                 required
               />
               <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-between items-center pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <button type="button" className="text-xs text-blue-500 hover:underline dark:text-blue-400">Forgot Password?</button>
            </div>
          )}

          {error && <p className="text-sm text-center text-red-500 bg-red-100 dark:bg-red-900/30 py-2 rounded-lg border border-red-200 dark:border-red-900">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center space-x-2 mt-4"
          >
            <span>{isLogin ? 'Login' : 'Sign Up'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => { 
                  setIsLogin(!isLogin); 
                  setError(''); 
                  setEmail('');
                  setPassword('');
                  setUsername('');
              }}
              className="ml-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};