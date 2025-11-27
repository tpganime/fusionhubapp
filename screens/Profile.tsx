
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, ArrowLeft, Lock, Link as LinkIcon, ShieldCheck, Crown, X, Settings, MessageCircle, ChevronDown, AlignJustify, Copy, Share2, Activity, Calendar, BarChart3, Mail } from 'lucide-react';
import { Gender } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const ProfileScreen: React.FC = () => {
  const { currentUser, users, updateProfile, sendFriendRequest, checkIsAdmin, checkIsOwner, enableAnimations, appConfig, getTimeSpent, getWeeklyStats } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [timeSpent, setTimeSpent] = useState("0m");
  const [showStatsModal, setShowStatsModal] = useState(false);

  useEffect(() => {
      if (isOwnProfile) {
          const interval = setInterval(() => {
              setTimeSpent(getTimeSpent());
          }, 30000); 
          setTimeSpent(getTimeSpent());
          return () => clearInterval(interval);
      }
  }, [isOwnProfile, getTimeSpent]);

  if (!appConfig.features.profile && !isOwnProfile) {
    return <ComingSoon title="Profile" />;
  }

  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  const [isEditing, setIsEditing] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const [username, setUsername] = useState('');
  const [name, setName] = useState(''); 
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.PREFER_NOT_TO_SAY);

  useEffect(() => {
    if (isOwnProfile && profileUser && !isEditing) {
      setUsername(profileUser.username);
      setName(profileUser.name || '');
      setDescription(profileUser.description && !profileUser.description.startsWith('{') ? profileUser.description : ''); 
      setAvatar(profileUser.avatar);
      setBirthdate(profileUser.birthdate || '');
      setGender(profileUser.gender || Gender.PREFER_NOT_TO_SAY);
    }
  }, [isOwnProfile, profileUser, isEditing]);

  useEffect(() => {
    if (showFullAvatar) {
      setIsZoomed(false);
    }
  }, [showFullAvatar]);

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        User not found
      </div>
    );
  }

  const handleSave = async () => {
    if (currentUser) {
      let finalDescription = description;
      if (currentUser.description && currentUser.description.startsWith('{')) {
         finalDescription = currentUser.description;
      }

      const success = await updateProfile({
        ...currentUser,
        username,
        name,
        description: finalDescription, 
        avatar,
        birthdate,
        gender
      });

      if (success) {
        alert("Profile Saved!");
        setIsEditing(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       try {
         const compressedBase64 = await compressImage(file);
         setAvatar(compressedBase64);
       } catch (err) {
         console.error("Image compression failed", err);
       }
     }
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  const profileLink = `fusionhub.app/u/${profileUser.username}`;

  const handleCopyLink = () => {
     navigator.clipboard.writeText(profileLink);
     alert("Profile link copied!");
  };

  const handleShare = async () => {
     if (navigator.share) {
         try {
             await navigator.share({
                 title: 'FusionHub Profile',
                 text: `Check out ${profileUser.username} on FusionHub!`,
                 url: window.location.href
             });
         } catch (e) { console.log('Error sharing', e); }
     } else {
         handleCopyLink();
     }
  };

  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isRequested = profileUser.requests.includes(currentUser?.id || '');
  const canViewDetails = isOwnProfile || !profileUser.isPrivateProfile || isFriend;
  
  const isAdminUser = checkIsAdmin(profileUser.email);
  const isOwnerUser = checkIsOwner(profileUser.email);
  
  const displayAvatar = isEditing ? avatar : profileUser.avatar;
  const displayDescription = (profileUser.description && profileUser.description.startsWith('{')) ? "Admin Account" : profileUser.description;

  // Stats for Modal
  const weeklyStats = isOwnProfile ? getWeeklyStats() : [];
  const maxTime = Math.max(...weeklyStats.map(s => s.ms), 1);

  const formatMs = (ms: number) => {
      if (ms === 0) return '0m';
      const m = Math.floor(ms / 60000);
      const h = Math.floor(m / 60);
      const min = m % 60;
      return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  return (
    <div className={`h-full overflow-y-auto pb-32 no-scrollbar relative gpu-accelerated bg-white dark:bg-black ${enableAnimations ? 'animate-fade-in' : ''}`}>
      
      {/* Full Avatar Modal */}
      {showFullAvatar && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in overflow-hidden">
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl transition-opacity duration-500" onClick={() => setShowFullAvatar(false)}></div>
          <button className="absolute top-6 right-6 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full text-black dark:text-white transition-colors z-[202] backdrop-blur-md" onClick={() => setShowFullAvatar(false)}><X className="w-6 h-6" /></button>
          <div className={`relative z-[201] w-full h-full overflow-auto no-scrollbar flex items-center justify-center ${isZoomed ? 'cursor-zoom-out items-start' : 'cursor-zoom-in'}`} onClick={toggleZoom}>
            <img src={displayAvatar} alt="Full Profile" className={`rounded-3xl shadow-2xl ${isZoomed ? 'min-w-[100vw] w-auto h-auto max-w-none' : 'max-w-[95%] max-h-[85vh] object-contain animate-pop-in'}`} />
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowStatsModal(false)}></div>
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pop-in">
                <button className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setShowStatsModal(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                </button>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" /> Weekly Activity
                </h3>
                
                <div className="flex items-end justify-between h-40 gap-2 mb-2">
                    {weeklyStats.map((stat, i) => {
                        const heightPercent = (stat.ms / maxTime) * 100;
                        const isToday = i === 6;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div className="w-full relative flex items-end justify-center h-full rounded-t-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    <div 
                                      className={`w-full ${isToday ? 'bg-blue-500' : 'bg-blue-300 dark:bg-blue-700'} rounded-t-md transition-all duration-1000 ease-out`}
                                      style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                                        {formatMs(stat.ms)}
                                    </div>
                                </div>
                                <span className={`text-[10px] mt-2 font-medium ${isToday ? 'text-blue-500' : 'text-gray-400'}`}>
                                    {stat.day}
                                </span>
                            </div>
                        )
                    })}
                </div>
                <p className="text-center text-xs text-gray-400 mt-4">Total active time for the last 7 days.</p>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/90 dark:bg-black/90 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:max-w-md sm:mx-auto border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-1">
             {isOwnProfile ? (
                 <>
                     <Lock className="w-3 h-3 text-gray-800 dark:text-white" />
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profileUser.username}</h1>
                     <ChevronDown className="w-4 h-4 text-gray-800 dark:text-white mt-1" />
                 </>
             ) : (
                 <>
                     <button onClick={() => navigate(-1)} className="mr-4"><ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" /></button>
                     <h1 className="text-lg font-bold text-gray-900 dark:text-white">{profileUser.username}</h1>
                 </>
             )}
             {isOwnerUser && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />}
             {isAdminUser && !isOwnerUser && <ShieldCheck className="w-4 h-4 text-blue-500 ml-1" />}
          </div>
          <div className="flex items-center gap-4">
              {isOwnProfile ? <button><Settings className="w-6 h-6 text-gray-900 dark:text-white" onClick={() => navigate('/settings')}/></button> : <button><AlignJustify className="w-6 h-6 text-gray-900 dark:text-white" /></button>}
          </div>
      </div>

      <div className="pt-16 px-4">
         {/* User Info Section - Style Updated */}
         <div className="mb-6">
             <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">User Info</h2>
             <div className={`p-5 liquid-card flex items-center gap-5 ${enableAnimations ? 'animate-slide-up-fade' : ''}`}>
                {/* Avatar Left */}
                <div className="relative flex-shrink-0">
                   <div 
                     className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 to-purple-500 cursor-pointer shadow-lg"
                     onClick={() => !isEditing && setShowFullAvatar(true)}
                   >
                      <img src={displayAvatar} alt="avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" />
                   </div>
                   {isEditing && (
                     <label className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full text-white cursor-pointer shadow-md hover:bg-blue-700 transition-colors">
                       <Camera className="w-4 h-4" />
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                   )}
                </div>

                {/* Info Right */}
                <div className="flex-1 min-w-0 space-y-1">
                   <div>
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate leading-tight">
                           {profileUser.name || profileUser.username}
                       </h2>
                       <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {isAdminUser ? (isOwnerUser ? "Owner" : "Administrator") : "Member"}
                       </p>
                   </div>
                   
                   {/* Email - Only visible to self */}
                   {isOwnProfile && (
                       <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                           <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                           <span className="truncate">{profileUser.email}</span>
                       </div>
                   )}
                   
                   {/* Joined Date */}
                   <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Joined:</span>
                        <span>Nov 2025</span>
                   </div>
                </div>
             </div>
         </div>

         {/* Bio / Description */}
         <div className={`mb-6 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '100ms' }}>
             <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Bio</h2>
             <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300 leading-relaxed min-h-[80px]">
                 {displayDescription || "No bio available."}
             </div>
         </div>

         {/* Activity Stats */}
         {isOwnProfile && (
             <div className={`mb-6 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '200ms' }}>
                 <div className="relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Activity className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wide">Time Active</span>
                       </div>
                       <button 
                          onClick={() => setShowStatsModal(true)}
                          className="p-1.5 bg-white dark:bg-black/20 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{timeSpent}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Total time spent in app</p>
                 </div>
             </div>
         )}

         {/* Action Buttons */}
         {!isEditing && (
            <div className={`flex gap-3 mb-8 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '300ms' }}>
                {isOwnProfile ? (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity shadow-lg active:scale-95"
                    >
                        Edit Profile
                    </button>
                ) : (
                    <>
                       {isFriend ? (
                          <button className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm">Following</button>
                       ) : (
                          <button onClick={() => sendFriendRequest(profileUser.id)} disabled={isRequested} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg ${isRequested ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{isRequested ? 'Requested' : 'Follow'}</button>
                       )}
                       <button onClick={() => navigate('/chat', { state: { targetUser: profileUser } })} disabled={(!canViewDetails && !profileUser.allowPrivateChat)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Message</button>
                    </>
                )}
                <button onClick={handleShare} className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"><Share2 className="w-5 h-5" /></button>
            </div>
         )}

         {/* Edit Form */}
         {isEditing && (
            <div className={`p-5 rounded-2xl bg-white dark:bg-gray-900 mb-6 border border-gray-200 dark:border-gray-800 shadow-xl ${enableAnimations ? 'animate-slide-up' : ''}`}>
                <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Display Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" placeholder="Name" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" placeholder="Username" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bio</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none mt-1" placeholder="Tell us about yourself..." />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setIsEditing(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
                     <button onClick={handleSave} className="flex-1 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg">Save Changes</button>
                  </div>
                </div>
            </div>
         )}

         {/* Private Lock */}
         {!canViewDetails && !isEditing && (
             <div className="mt-10 text-center p-10">
                 <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 shadow-inner">
                     <Lock className="w-6 h-6 text-gray-400" />
                 </div>
                 <h3 className="font-bold text-gray-900 dark:text-white">This account is private</h3>
                 <p className="text-xs text-gray-500 mt-1">Follow to see their posts and info.</p>
             </div>
         )}
      </div>
    </div>
  );
};
