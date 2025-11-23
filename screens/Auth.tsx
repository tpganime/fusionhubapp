
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { User } from '../types';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loginWithCredentials, signup, users, isLoading, currentUser, enableAnimations } = useApp();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (currentUser && !isLoading) {
      navigate('/home');
    }
  }, [currentUser, isLoading, navigate]);

  const handleCheckUsername = (val: string) => {
    setUsername(val);
    if (val.length > 2) {
      const exists = users.some(u => u.username.toLowerCase() === val.toLowerCase());
      setUsernameAvailable(!exists);
    } else {
      setUsernameAvailable(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        await loginWithCredentials(email.trim(), password);
        navigate('/home');
    } catch (err: any) {
        setError(err.message || 'Invalid email or password');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!usernameAvailable) {
        setError('Username is taken or invalid');
        return;
    }
    
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        setError('Email already registered');
        return;
    }
    
    setIsSubmitting(true);

    try {
        const newUser: User = {
          id: generateUUID(),
          username,
          password,
          email: email.trim(),
          avatar: `https://picsum.photos/200?random=${Date.now()}`,
          isPrivateProfile: false,
          allowPrivateChat: true,
          friends: [],
          requests: [],
        };
        await signup(newUser);
        navigate('/home');
    } catch (err: any) {
        setError(err.message || 'Failed to create account.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin mb-4 drop-shadow-lg" />
            <p className="text-white font-medium drop-shadow-md">Loading FusionHub...</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

      {/* Liquid Glass Card */}
      <div className={`w-full max-w-md liquid-card p-10 z-10 ${enableAnimations ? 'animate-fade-in' : ''}`}>
        <div className="text-center mb-8 flex flex-col items-center">
            <svg 
              viewBox="0 0 100 100" 
              className="w-24 h-24 mb-4 animate-float drop-shadow-lg"
              style={{ animationDuration: '6s' }}
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logo_grad_auth" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="15" fill="url(#logo_grad_auth)" />
              <ellipse cx="50" cy="50" rx="40" ry="12" stroke="url(#logo_grad_auth)" strokeWidth="6" transform="rotate(0 50 50)" />
              <ellipse cx="50" cy="50" rx="40" ry="12" stroke="url(#logo_grad_auth)" strokeWidth="6" transform="rotate(60 50 50)" />
              <ellipse cx="50" cy="50" rx="40" ry="12" stroke="url(#logo_grad_auth)" strokeWidth="6" transform="rotate(120 50 50)" />
            </svg>
            <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent drop-shadow-sm">
            FusionHub
            </h1>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-2">
                {isLogin ? 'Welcome Back!' : 'Join the Future'}
            </h2>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
          
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-2 uppercase tracking-wide">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleCheckUsername(e.target.value)}
                  className={`w-full p-4 liquid-input text-gray-900 dark:text-white placeholder-gray-500 ${usernameAvailable === false ? 'border-red-400' : ''}`}
                  placeholder="Choose a username"
                  required={!isLogin}
                />
                {username.length > 2 && (
                  <div className="absolute right-4 top-4">
                      {usernameAvailable ? (
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                      ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-2 uppercase tracking-wide">Email</label>
            <div className="relative">
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full p-4 pl-12 liquid-input text-gray-900 dark:text-white placeholder-gray-500"
                 placeholder="name@example.com"
                 required
               />
               <Mail className="absolute left-4 top-4 text-gray-500 w-5 h-5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-2 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 liquid-input text-gray-900 dark:text-white placeholder-gray-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-100/50 border border-red-200 text-red-600 text-sm text-center backdrop-blur-md">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:scale-100"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <span>{isLogin ? 'Login' : 'Create Account'}</span>}
            {!isSubmitting && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isLogin ? "New here?" : "Have an account?"}
            <button
              onClick={() => { 
                  setIsLogin(!isLogin); 
                  setError(''); 
                  setEmail('');
                  setPassword('');
                  setUsername('');
              }}
              className="ml-2 text-blue-600 dark:text-blue-300 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
