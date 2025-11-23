
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

  // Local state for time display to trigger re-renders
  const [timeSpent, setTimeSpent] = useState("0m");

  useEffect(() => {
      if (isOwnProfile) {
          const interval = setInterval(() => {
              setTimeSpent(getTimeSpent());
          }, 60000); // Update every minute
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

  // Sync state with profileUser only if NOT editing to prevent overwriting user input
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
      
      // Critical Check: Prevent Admin from overwriting App Config
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

  // Correct profile link format
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
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/90 dark:bg-black/90 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:max-w-md sm:mx-auto border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-1">
             {isOwnProfile && (
                 <div className="flex items-center gap-1">
                     <Lock className="w-3 h-3 text-gray-800 dark:text-white" />
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profileUser.username}</h1>
                     <ChevronDown className="w-4 h-4 text-gray-800 dark:text-white mt-1" />
                     {isOwnerUser && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" />}
                     {isAdminUser && !isOwnerUser && <ShieldCheck className="w-4 h-4 text-blue-500 ml-1" />}
                 </div>
             )}
             {!isOwnProfile && (
                 <button onClick={() => navigate(-1)} className="mr-4">
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
          
          <div className="flex items-center gap-4">
              {isOwnProfile ? (
                 <>
                    <button className="text-gray-900 dark:text-white hover:opacity-70 transition-transform active:scale-95"><Settings className="w-6 h-6" onClick={() => navigate('/settings')}/></button>
                 </>
              ) : (
                  <button className="text-gray-900 dark:text-white hover:opacity-70 transition-transform active:scale-95"><AlignJustify className="w-6 h-6" /></button>
              )}
          </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-4">
         
         {/* Top Section: Avatar (Left) */}
         <div className="flex items-center mb-4">
            {/* Avatar - Left Side */}
            <div className="relative mr-6">
                <div 
                  className={`relative w-24 h-24 transform-gpu cursor-pointer ${enableAnimations ? 'animate-pop-in-elastic' : ''}`}
                  onClick={() => !isEditing && setShowFullAvatar(true)}
                >
                   {/* Clean avatar without extra rings */}
                   <img 
                     src={displayAvatar} 
                     onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                     alt="Profile" 
                     className="w-full h-full rounded-full object-cover border border-gray-200 dark:border-gray-800 relative z-10 shadow-sm" 
                   />

                   {isEditing && (
                     <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full cursor-pointer hover:bg-black/50 transition-colors">
                       <Camera className="w-8 h-8 text-white opacity-80" />
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                   )}
                </div>
            </div>

            {/* Time Spent - Right Side of Avatar (Only Own Profile) */}
            {isOwnProfile && !isEditing && (
                <div className={`flex flex-col justify-center pl-2 border-l border-gray-200 dark:border-gray-800 h-16 ${enableAnimations ? 'animate-slide-in-right' : ''}`} style={{ animationDelay: '100ms' }}>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide mb-1">Total Active Time</span>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-xl font-black tracking-tight">{timeSpent}</span>
                    </div>
                </div>
            )}
         </div>

         {/* Bio Section - Below Avatar */}
         <div className={`mb-4 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '200ms' }}>
            <div className="flex flex-col items-start">
               <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-gray-900 dark:text-white italic">{profileUser.name || profileUser.username}</span>
                  {isOwnerUser && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  {isAdminUser && !isOwnerUser && <ShieldCheck className="w-3 h-3 text-blue-500" />}
               </div>
               
               <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line leading-snug mt-1">
                   {displayDescription || "No bio yet."}
               </p>
               
               {/* Link & Buttons */}
               <div className="flex items-center gap-2 mt-3">
                   <div 
                     className="flex items-center gap-1 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg"
                   >
                       <div className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><LinkIcon className="w-3 h-3 text-gray-900 dark:text-white" /></div>
                       <span className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate max-w-[150px]">{profileLink}</span>
                   </div>
                   <button onClick={handleCopyLink} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-transform"><Copy className="w-4 h-4" /></button>
                   <button onClick={handleShare} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 active:scale-95 transition-transform"><Share2 className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         {/* Action Buttons */}
         {!isEditing && (
            <div className={`flex gap-2 mb-6 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '300ms' }}>
                {isOwnProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
                      >
                        Edit Profile
                      </button>
                    </>
                ) : (
                    <>
                         {isFriend ? (
                            <button className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm cursor-default">
                                Following
                            </button>
                         ) : (
                            <button 
                                onClick={() => sendFriendRequest(profileUser.id)}
                                disabled={isRequested}
                                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 ${isRequested ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-blue-500 text-white shadow-md hover:bg-blue-600'}`}
                            >
                                {isRequested ? 'Requested' : 'Follow'}
                            </button>
                         )}
                         <button 
                             onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                             disabled={(!canViewDetails && !profileUser.allowPrivateChat)}
                             className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 transition-colors active:scale-95"
                         >
                             Message
                         </button>
                    </>
                )}
            </div>
         )}

         {/* Editing Form */}
         {isEditing && (
            <div className={`p-4 rounded-xl bg-gray-50 dark:bg-gray-900 mb-6 border border-gray-100 dark:border-gray-800 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`}>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full p-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 mt-1 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-shadow focus:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full p-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 mt-1 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-shadow focus:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bio</label>
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full p-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 mt-1 h-20 resize-none focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-shadow focus:shadow-md"
                        placeholder="Write something..."
                    />
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancel</button>
                     <button onClick={handleSave} className="flex-1 py-2 text-sm font-bold bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 active:scale-95 transition-all">Save Changes</button>
                  </div>
                </div>
            </div>
         )}
         
         {/* Private Account Lock */}
         {!canViewDetails && !isEditing && (
             <div className={`mt-12 text-center p-10 border-t border-gray-100 dark:border-gray-800 ${enableAnimations ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '400ms' }}>
                 <div className="w-16 h-16 rounded-full border-2 border-gray-800 dark:border-gray-200 flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
                     <Lock className="w-8 h-8 text-gray-800 dark:text-gray-200" />
                 </div>
                 <h3 className="font-bold text-gray-900 dark:text-white">This account is private</h3>
                 <p className="text-sm text-gray-500">Follow to see their activity.</p>
             </div>
         )}
      </div>
    </div>
  );
};
