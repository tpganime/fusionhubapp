
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, ArrowLeft, Lock, Link as LinkIcon, ShieldCheck, Crown, X, Settings, MessageCircle, ChevronDown, AlignJustify, Copy, Share2, Activity, Calendar } from 'lucide-react';
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
  const { currentUser, users, updateProfile, sendFriendRequest, checkIsAdmin, checkIsOwner, enableAnimations, appConfig, getTimeSpent } = useApp();
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
    <div className={`h-full overflow-y-auto pb-32 no-scrollbar relative gpu-accelerated bg-white dark:bg-black ${enableAnimations ? 'animate-fade-in' : ''}`}>
      
      {showFullAvatar && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in overflow-hidden">
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-2xl transition-opacity duration-500" onClick={() => setShowFullAvatar(false)}></div>
          <button className="absolute top-6 right-6 p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-full text-black dark:text-white transition-colors z-[202] backdrop-blur-md" onClick={() => setShowFullAvatar(false)}><X className="w-6 h-6" /></button>
          <div className={`relative z-[201] w-full h-full overflow-auto no-scrollbar flex items-center justify-center ${isZoomed ? 'cursor-zoom-out items-start' : 'cursor-zoom-in'}`} onClick={toggleZoom}>
            <img src={displayAvatar} alt="Full Profile" className={`rounded-3xl shadow-2xl ${isZoomed ? 'min-w-[100vw] w-auto h-auto max-w-none' : 'max-w-[95%] max-h-[85vh] object-contain animate-pop-in'}`} />
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
         {/* User Info Card - Style #1 */}
         <div className={`p-5 mb-4 liquid-card flex items-center gap-5 ${enableAnimations ? 'animate-slide-up-fade' : ''}`}>
            {/* Avatar Left */}
            <div className="relative flex-shrink-0">
               <div 
                 className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-blue-400 to-purple-500 cursor-pointer"
                 onClick={() => !isEditing && setShowFullAvatar(true)}
               >
                  <img src={displayAvatar} alt="avatar" className="w-full h-full rounded-full object-cover border-2 border-white dark:border-black" />
               </div>
               {isEditing && (
                 <label className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full text-white cursor-pointer shadow-md">
                   <Camera className="w-4 h-4" />
                   <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
               )}
            </div>

            {/* Info Right */}
            <div className="flex-1 min-w-0">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{profileUser.name || profileUser.username}</h2>
               <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  {isAdminUser ? (isOwnerUser ? "FusionHub Owner" : "FusionHub Admin") : "Member"}
               </p>
               <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {displayDescription || "No bio available."}
               </p>
            </div>
         </div>

         {/* Additional Info / Stats */}
         <div className={`grid grid-cols-2 gap-3 mb-6 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '100ms' }}>
             {isOwnProfile && (
               <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-1 text-gray-500">
                     <Activity className="w-3 h-3" />
                     <span className="text-[10px] font-bold uppercase">Time Active</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{timeSpent}</p>
               </div>
             )}
             
             {isOwnProfile && (
               <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-1 text-gray-500">
                     <Calendar className="w-3 h-3" />
                     <span className="text-[10px] font-bold uppercase">Joined</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Nov 2025</p>
               </div>
             )}
         </div>

         {/* Buttons */}
         {!isEditing && (
            <div className={`flex gap-2 mb-6 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '200ms' }}>
                {isOwnProfile ? (
                    <button onClick={() => setIsEditing(true)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-200 transition-colors active:scale-95">
                        Edit Profile
                    </button>
                ) : (
                    <>
                       {isFriend ? (
                          <button className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 font-bold text-sm">Following</button>
                       ) : (
                          <button onClick={() => sendFriendRequest(profileUser.id)} disabled={isRequested} className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white ${isRequested ? 'bg-gray-400' : 'bg-blue-600'}`}>{isRequested ? 'Requested' : 'Follow'}</button>
                       )}
                       <button onClick={() => navigate('/chat', { state: { targetUser: profileUser } })} disabled={(!canViewDetails && !profileUser.allowPrivateChat)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-sm">Message</button>
                    </>
                )}
                <button onClick={handleShare} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white"><Share2 className="w-5 h-5" /></button>
            </div>
         )}

         {isEditing && (
            <div className={`p-4 rounded-xl bg-gray-50 dark:bg-gray-900 mb-6 border border-gray-100 dark:border-gray-800 ${enableAnimations ? 'animate-slide-up' : ''}`}>
                <div className="space-y-4">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm" placeholder="Name" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm" placeholder="Username" />
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm h-24 resize-none" placeholder="Bio" />
                  <div className="flex gap-3">
                     <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancel</button>
                     <button onClick={handleSave} className="flex-1 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg">Save</button>
                  </div>
                </div>
            </div>
         )}

         {/* Private Lock */}
         {!canViewDetails && !isEditing && (
             <div className="mt-10 text-center p-10">
                 <div className="w-14 h-14 rounded-full border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center mx-auto mb-3">
                     <Lock className="w-6 h-6 text-gray-400" />
                 </div>
                 <h3 className="font-bold text-gray-900 dark:text-white">This account is private</h3>
             </div>
         )}
      </div>
    </div>
  );
};
