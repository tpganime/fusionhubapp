
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
        <div className="h-full flex flex-col items-center justify-center bg-black">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4 drop-shadow-lg" />
            <p className="text-white font-bold tracking-widest animate-pulse">LOADING</p>
        </div>
    );
  }

  // Animation Utilities
  const animClass = enableAnimations ? 'animate-slide-up-heavy opacity-0' : '';
  const getDelay = (ms: number) => enableAnimations ? { animationDelay: `${ms}ms`, animationFillMode: 'both' as const } : {};

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden gpu-accelerated">
      {/* Decorative Blobs - Heavy Movement */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-20%] w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 left-20 w-[600px] h-[600px] bg-pink-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

      {/* Liquid Glass Card */}
      <div className={`w-full max-w-md liquid-card p-8 sm:p-10 z-10 shadow-2xl backdrop-blur-3xl transform-gpu ${enableAnimations ? 'animate-scale-elastic' : ''}`}>
        
        <div className="text-center mb-10 flex flex-col items-center">
            <svg 
              viewBox="0 0 100 100" 
              className={`w-24 h-24 mb-6 drop-shadow-2xl ${enableAnimations ? 'animate-float-slow' : ''}`}
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logo_grad_auth" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="18" fill="url(#logo_grad_auth)" className="animate-pulse-slow" />
              <ellipse cx="50" cy="50" rx="42" ry="14" stroke="url(#logo_grad_auth)" strokeWidth="4" transform="rotate(0 50 50)" className="opacity-80" />
              <ellipse cx="50" cy="50" rx="42" ry="14" stroke="url(#logo_grad_auth)" strokeWidth="4" transform="rotate(60 50 50)" className="opacity-80" />
              <ellipse cx="50" cy="50" rx="42" ry="14" stroke="url(#logo_grad_auth)" strokeWidth="4" transform="rotate(120 50 50)" className="opacity-80" />
            </svg>

            <h1 className={`text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent drop-shadow-sm tracking-tight ${animClass}`} style={getDelay(100)}>
            FusionHub
            </h1>
            <h2 className={`text-lg font-bold text-gray-600 dark:text-gray-300 mt-2 ${animClass}`} style={getDelay(200)}>
                {isLogin ? 'Welcome Back!' : 'Join the Future'}
            </h2>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
          
          {!isLogin && (
            <div className={`space-y-1.5 ${animClass}`} style={getDelay(300)}>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2 uppercase tracking-wider">Username</label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleCheckUsername(e.target.value)}
                  className={`w-full p-4 liquid-input text-gray-900 dark:text-white placeholder-gray-400 font-medium ${usernameAvailable === false ? 'border-red-400/50 bg-red-50/20' : ''}`}
                  placeholder="Choose a handle"
                  required={!isLogin}
                />
                {username.length > 2 && (
                  <div className={`absolute right-4 top-4 ${enableAnimations ? 'animate-pop-in-heavy' : ''}`}>
                      {usernameAvailable ? (
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
                      ) : (
                          <AlertCircle className="w-5 h-5 text-red-500 drop-shadow-md" />
                      )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`space-y-1.5 ${animClass}`} style={getDelay(400)}>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2 uppercase tracking-wider">Email</label>
            <div className="relative group">
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full p-4 pl-12 liquid-input text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                 placeholder="name@example.com"
                 required
               />
               <Mail className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
            </div>
          </div>

          <div className={`space-y-1.5 ${animClass}`} style={getDelay(500)}>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-2 uppercase tracking-wider">Password</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 liquid-input text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <div className={`p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium text-center backdrop-blur-md ${enableAnimations ? 'animate-shake' : ''}`}>{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.6)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:scale-100 ${animClass} relative overflow-hidden`}
            style={getDelay(600)}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
            
            {isSubmitting ? <Loader2 className="animate-spin" /> : <span>{isLogin ? 'Login' : 'Create Account'}</span>}
            {!isSubmitting && <ArrowRight size={20} />}
          </button>
        </form>

        <div className={`mt-10 text-center ${animClass}`} style={getDelay(700)}>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {isLogin ? "New here?" : "Have an account?"}
            <button
              onClick={() => { 
                  setIsLogin(!isLogin); 
                  setError(''); 
                  setEmail('');
                  setPassword('');
                  setUsername('');
              }}
              className="ml-2 text-blue-600 dark:text-blue-400 font-extrabold hover:underline decoration-2 underline-offset-4"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
