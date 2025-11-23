
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, Save, ArrowLeft, MessageCircle, UserPlus, Check, Lock, Calendar, Mail, Users as UsersIcon, ShieldCheck, Crown, X, ZoomIn, ZoomOut, Link as LinkIcon, Edit3 } from 'lucide-react';
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
  const { currentUser, users, updateProfile, sendFriendRequest, checkIsAdmin, checkIsOwner, checkIsOnline, enableAnimations, appConfig } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;

  if (!appConfig.features.profile && !isOwnProfile) {
    return <ComingSoon title="Profile" />;
  }

  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  const [isEditing, setIsEditing] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.PREFER_NOT_TO_SAY);

  useEffect(() => {
    if (isOwnProfile && profileUser) {
      setUsername(profileUser.username);
      setDescription(profileUser.description && !profileUser.description.startsWith('{') ? profileUser.description : ''); 
      setAvatar(profileUser.avatar);
      setBirthdate(profileUser.birthdate || '');
      setGender(profileUser.gender || Gender.PREFER_NOT_TO_SAY);
    }
  }, [isOwnProfile, profileUser]);

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

  const handleSave = () => {
    if (currentUser) {
      updateProfile({
        ...currentUser,
        username,
        description, 
        avatar,
        birthdate,
        gender
      });
      setIsEditing(false);
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
         const reader = new FileReader();
         reader.onloadend = () => {
           setAvatar(reader.result as string);
         };
         reader.readAsDataURL(file);
       }
     }
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isRequested = profileUser.requests.includes(currentUser?.id || '');
  const canViewDetails = isOwnProfile || !profileUser.isPrivateProfile || isFriend;
  const isAdminUser = checkIsAdmin(profileUser.email);
  const isOwnerUser = checkIsOwner(profileUser.email);
  const isOnline = checkIsOnline(profileUser.id);
  const displayAvatar = isEditing ? avatar : profileUser.avatar;

  const displayDescription = (profileUser.description && profileUser.description.startsWith('{')) ? "Admin Account" : profileUser.description;

  return (
    <div className="h-full overflow-y-auto pb-32 no-scrollbar relative gpu-accelerated bg-gray-50 dark:bg-black">
      
      {/* Heavy Animated Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Main Image Layer - Parallax Drift */}
          <div 
             className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out opacity-20 dark:opacity-30 ${enableAnimations ? 'animate-zoom-pan' : ''}`}
             style={{ 
                 backgroundImage: `url("${displayAvatar}")`,
                 filter: 'blur(90px) saturate(200%)', 
             }}
          />
      </div>

      {/* Full Screen Avatar Modal */}
      {showFullAvatar && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl transition-opacity duration-500" onClick={() => setShowFullAvatar(false)}></div>
          
          <button 
            className="absolute top-6 right-6 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full text-black dark:text-white transition-colors z-[202] backdrop-blur-md"
            onClick={() => setShowFullAvatar(false)}
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className={`relative z-[201] w-full h-full overflow-auto no-scrollbar flex items-center justify-center transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1) ${isZoomed ? 'cursor-zoom-out items-start' : 'cursor-zoom-in'}`}
            onClick={toggleZoom}
          >
            <img 
              src={displayAvatar} 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error'; }}
              alt="Full Profile" 
              className={`transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) select-none rounded-3xl shadow-2xl ${
                isZoomed 
                  ? 'min-w-[100vw] w-auto h-auto max-w-none' 
                  : 'max-w-[95%] max-h-[85vh] object-contain animate-pop-in-elastic'
              }`} 
            />
          </div>
        </div>
      )}

      {/* Header Area */}
      {isOwnProfile ? (
        <div className="relative z-10">
          <TopBar />
        </div>
      ) : (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center animate-slide-down-heavy">
           <button 
             onClick={() => navigate(-1)} 
             className="p-2.5 rounded-full glass-panel text-gray-900 dark:text-white hover:bg-white/40 transition-all shadow-lg backdrop-blur-xl border border-white/40 active:scale-90"
           >
             <ArrowLeft className="w-6 h-6" />
           </button>
           <div className="glass-panel px-4 py-2 font-bold text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
             {profileUser.username}
           </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative pt-24 px-5 z-10">
         
         {/* Top Section: Avatar + Stats (Instagram Layout) */}
         <div className="flex items-center gap-6 mb-6">
            {/* Avatar - Left Side */}
            <div 
              className={`relative flex-shrink-0 w-24 h-24 transform-gpu cursor-pointer group ${enableAnimations ? 'animate-pop-in-elastic' : ''}`}
              onClick={() => !isEditing && setShowFullAvatar(true)}
            >
               {/* Rings/Status */}
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-400 dark:from-blue-600 dark:to-purple-600 rounded-full blur-xl opacity-40 animate-pulse-slow"></div>
               
               <img 
                 src={displayAvatar} 
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                 alt="Profile" 
                 className={`w-full h-full rounded-full object-cover border-[3px] ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white dark:border-white/10'} shadow-xl relative z-10 bg-gray-100`} 
               />

               {isOwnerUser && <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full z-20 shadow-sm border border-white"><Crown className="w-3 h-3 text-white fill-white" /></div>}
               {!isOwnerUser && isAdminUser && <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full z-20 shadow-sm border border-white"><ShieldCheck className="w-3 h-3 text-white" /></div>}

               {isEditing && (
                 <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full cursor-pointer hover:bg-black/50 transition-colors">
                   <Camera className="w-8 h-8 text-white opacity-80" />
                   <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
               )}
            </div>

            {/* Right Side: Stats & Username */}
            <div className={`flex-1 flex flex-col justify-center ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '100ms' }}>
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 truncate flex items-center gap-2">
                    {profileUser.username}
                    {profileUser.isPrivateProfile && !isOwnProfile && <Lock className="w-4 h-4 text-gray-400" />}
                </h2>
                
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <span className="block text-lg font-bold text-gray-900 dark:text-white">{profileUser.friends.length}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Friends</span>
                    </div>
                    {/* Placeholder stats to match layout feeling */}
                    <div className="text-center opacity-40">
                        <span className="block text-lg font-bold text-gray-900 dark:text-white">0</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Posts</span>
                    </div>
                    <div className="text-center opacity-40">
                        <span className="block text-lg font-bold text-gray-900 dark:text-white">0</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Following</span>
                    </div>
                </div>
            </div>
         </div>

         {/* Bio Section */}
         <div className={`mb-6 space-y-2 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '200ms' }}>
            <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
               {profileUser.username} {/* Using username as Name as per schema, or could add Name field */}
            </div>
            {isOnline && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold border border-green-500/20 mb-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Online</span>}
            
            <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line leading-relaxed">
               {displayDescription || "No bio yet."}
            </p>
            
            {/* Dummy Link to look like photo */}
            {/* In real app, user object would have website field */}
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="hover:underline cursor-pointer">fusionhub.app/{profileUser.username}</span>
            </div>
         </div>

         {/* Action Buttons */}
         {!isEditing && (
            <div className={`flex gap-3 mb-8 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '300ms' }}>
                {isOwnProfile ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                    >
                      Edit Profile
                    </button>
                ) : (
                    <>
                         <button 
                             onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                             disabled={(!canViewDetails && !profileUser.allowPrivateChat)}
                             className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
                         >
                             Message
                         </button>
                         {isFriend ? (
                            <button className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold text-sm cursor-default">
                                Following
                            </button>
                         ) : (
                            <button 
                                onClick={() => sendFriendRequest(profileUser.id)}
                                disabled={isRequested}
                                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${isRequested ? 'bg-gray-100 dark:bg-white/5 text-gray-500' : 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300'}`}
                            >
                                {isRequested ? 'Requested' : 'Follow'}
                            </button>
                         )}
                    </>
                )}
            </div>
         )}

         {/* Editing Form */}
         {isEditing && (
            <div className={`p-5 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-md mb-8 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full p-3 bg-white/50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/10 mt-1 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bio</label>
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full p-3 bg-white/50 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/10 mt-1 h-24 resize-none focus:border-blue-500 outline-none"
                        placeholder="Write something..."
                    />
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
                     <button onClick={handleSave} className="flex-1 py-3 text-sm font-bold bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30">Save</button>
                  </div>
                </div>
            </div>
         )}

         {/* Details / Content Grid */}
         {canViewDetails && !isEditing && (
            <div className={`grid grid-cols-1 gap-4 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '400ms' }}>
               {/* Just display some info blocks to look like content */}
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-sm">
                   <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500"><Calendar className="w-5 h-5" /></div>
                   <div>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">Born</p>
                       <p className="text-sm font-semibold text-gray-900 dark:text-white">{profileUser.birthdate || 'N/A'}</p>
                   </div>
               </div>
               
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-sm">
                   <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500"><UsersIcon className="w-5 h-5" /></div>
                   <div>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">Gender</p>
                       <p className="text-sm font-semibold text-gray-900 dark:text-white">{profileUser.gender || 'N/A'}</p>
                   </div>
               </div>
               
               {isOwnProfile && (
                   <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 backdrop-blur-sm">
                       <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500"><Mail className="w-5 h-5" /></div>
                       <div>
                           <p className="text-[10px] text-gray-500 font-bold uppercase">Email</p>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white break-all">{profileUser.email}</p>
                       </div>
                   </div>
               )}
            </div>
         )}
         
         {!canViewDetails && !isEditing && (
             <div className={`mt-8 text-center p-8 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`}>
                 <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                 <p className="text-sm text-gray-500 font-medium">This account is private.</p>
                 <p className="text-xs text-gray-400">Follow to see their content.</p>
             </div>
         )}
      </div>
    </div>
  );
};
