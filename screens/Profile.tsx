
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, ArrowLeft, Lock, Link as LinkIcon, ShieldCheck, Crown, X, Settings, MessageCircle, ChevronDown, AlignJustify, Copy, Share2, ExternalLink, Clock, Activity } from 'lucide-react';
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
  const { currentUser, users, updateProfile, sendFriendRequest, checkIsAdmin, checkIsOwner, checkIsOnline, enableAnimations, appConfig, getTimeSpent } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [timeSpent, setTimeSpent] = useState("0m");

  useEffect(() => {
      if (isOwnProfile) {
          const interval = setInterval(() => {
              setTimeSpent(getTimeSpent());
          }, 60000); 
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

  return (
    <div className={`h-full overflow-y-auto pb-32 no-scrollbar relative gpu-accelerated bg-white dark:bg-black ${enableAnimations ? 'animate-heavy-fade-in' : ''}`}>
      
      {/* Full Screen Avatar Modal */}
      {showFullAvatar && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center animate-heavy-fade-in overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-3xl transition-opacity duration-500" onClick={() => setShowFullAvatar(false)}></div>
          
          <button 
            className="absolute top-6 right-6 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full text-black dark:text-white transition-colors z-[202] backdrop-blur-md active:scale-90"
            onClick={() => setShowFullAvatar(false)}
          >
            <X className="w-8 h-8" />
          </button>

          <div 
            className={`relative z-[201] w-full h-full overflow-auto no-scrollbar flex items-center justify-center transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1) ${isZoomed ? 'cursor-zoom-out items-start' : 'cursor-zoom-in'}`}
            onClick={toggleZoom}
          >
            <img 
              src={displayAvatar} 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error'; }}
              alt="Full Profile" 
              className={`transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) select-none rounded-[3rem] shadow-2xl ${
                isZoomed 
                  ? 'min-w-[100vw] w-auto h-auto max-w-none rounded-none' 
                  : 'max-w-[90%] max-h-[80vh] object-contain animate-scale-elastic'
              }`} 
            />
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className={`fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-black/80 backdrop-blur-xl z-40 flex items-center justify-between px-4 sm:max-w-md sm:mx-auto border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ${enableAnimations ? 'animate-slide-down-heavy' : ''}`}>
          <div className="flex items-center gap-1">
             {isOwnProfile && (
                 <div className="flex items-center gap-1">
                     <Lock className="w-3.5 h-3.5 text-gray-800 dark:text-white" />
                     <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{profileUser.username}</h1>
                     <ChevronDown className="w-4 h-4 text-gray-800 dark:text-white mt-1" />
                     {isOwnerUser && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />}
                     {isAdminUser && !isOwnerUser && <ShieldCheck className="w-4 h-4 text-blue-500 ml-1" />}
                 </div>
             )}
             {!isOwnProfile && (
                 <button onClick={() => navigate(-1)} className="mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                     <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
                 </button>
             )}
             {!isOwnProfile && (
                 <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    {profileUser.username}
                    {isOwnerUser ? <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" /> : isAdminUser ? <ShieldCheck className="w-4 h-4 text-blue-500" /> : null}
                 </h1>
             )}
          </div>
          
          <div className="flex items-center gap-3">
              {isOwnProfile ? (
                 <>
                    <button className="text-gray-900 dark:text-white hover:opacity-70 transition-transform active:scale-95 active:rotate-45"><Settings className="w-6 h-6" onClick={() => navigate('/settings')}/></button>
                 </>
              ) : (
                  <button className="text-gray-900 dark:text-white hover:opacity-70 transition-transform active:scale-95"><AlignJustify className="w-6 h-6" /></button>
              )}
          </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-4">
         
         {/* Top Section */}
         <div className="flex items-center mb-6">
            {/* Avatar - Left Side */}
            <div className="relative mr-6">
                <div 
                  className={`relative w-24 h-24 transform-gpu cursor-pointer group ${enableAnimations ? 'animate-scale-elastic' : ''}`}
                  onClick={() => !isEditing && setShowFullAvatar(true)}
                >
                   <img 
                     src={displayAvatar} 
                     onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                     alt="Profile" 
                     className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-800 relative z-10 shadow-lg group-active:scale-95 transition-transform duration-300" 
                   />
                   
                   {isEditing && (
                     <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full cursor-pointer hover:bg-black/50 transition-colors animate-pulse">
                       <Camera className="w-8 h-8 text-white opacity-90" />
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                   )}
                </div>
            </div>

            {/* Time Spent - Right Side of Avatar */}
            {isOwnProfile && !isEditing && (
                <div className={`flex flex-col justify-center pl-4 border-l-2 border-gray-100 dark:border-gray-800 h-16 ${enableAnimations ? 'animate-slide-up-heavy opacity-0' : ''}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Time Active</span>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Activity className="w-5 h-5 animate-pulse-slow" />
                        <span className="text-2xl font-black tracking-tight">{timeSpent}</span>
                    </div>
                </div>
            )}
         </div>

         {/* Bio Section */}
         <div className={`mb-6 ${enableAnimations ? 'animate-slide-up-heavy opacity-0' : ''}`} style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <div className="flex flex-col items-start">
               <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-bold text-base text-gray-900 dark:text-white">{profileUser.name || profileUser.username}</span>
                  {isOwnerUser && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                  {isAdminUser && !isOwnerUser && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
               </div>
               
               <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed font-medium">
                   {displayDescription || "No bio yet."}
               </p>
               
               {/* Link & Buttons */}
               <div className="flex items-center gap-2 mt-4 w-full">
                   <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl flex-1 min-w-0 border border-gray-100 dark:border-gray-800">
                       <div className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><LinkIcon className="w-3 h-3 text-gray-900 dark:text-white" /></div>
                       <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">{profileLink}</span>
                   </div>
                   <button onClick={handleCopyLink} className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-transform border border-gray-100 dark:border-gray-800"><Copy className="w-4 h-4" /></button>
                   <button onClick={handleShare} className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-transform border border-gray-100 dark:border-gray-800"><Share2 className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         {/* Action Buttons */}
         {!isEditing && (
            <div className={`flex gap-3 mb-8 ${enableAnimations ? 'animate-slide-up-heavy opacity-0' : ''}`} style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                {isOwnProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors active:scale-95 shadow-sm"
                      >
                        Edit Profile
                      </button>
                    </>
                ) : (
                    <>
                         {isFriend ? (
                            <button className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm cursor-default opacity-80">
                                Following
                            </button>
                         ) : (
                            <button 
                                onClick={() => sendFriendRequest(profileUser.id)}
                                disabled={isRequested}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${isRequested ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 shadow-none' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/30'}`}
                            >
                                {isRequested ? 'Requested' : 'Follow'}
                            </button>
                         )}
                         <button 
                             onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                             disabled={(!canViewDetails && !profileUser.allowPrivateChat)}
                             className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors active:scale-95 shadow-sm"
                         >
                             Message
                         </button>
                    </>
                )}
            </div>
         )}

         {/* Editing Form */}
         {isEditing && (
            <div className={`p-5 rounded-3xl bg-gray-50 dark:bg-gray-900/50 mb-6 border border-gray-200 dark:border-gray-800 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 mt-1 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 mt-1 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Bio</label>
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full p-3 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 mt-1 h-24 resize-none focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Write something..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setIsEditing(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-200/50 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                     <button onClick={handleSave} className="flex-1 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Save Changes</button>
                  </div>
                </div>
            </div>
         )}
         
         {/* Private Account Lock */}
         {!canViewDetails && !isEditing && (
             <div className={`mt-10 text-center p-12 border-t border-gray-100 dark:border-gray-800 ${enableAnimations ? 'animate-slide-up-heavy opacity-0' : ''}`} style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
                 <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-5 animate-pulse-slow">
                     <Lock className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">Private Account</h3>
                 <p className="text-sm text-gray-500 font-medium">Follow this account to see their photos and videos.</p>
             </div>
         )}
      </div>
    </div>
  );
};
