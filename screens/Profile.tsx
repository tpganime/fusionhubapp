
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, ArrowLeft, Lock, Link as LinkIcon, ShieldCheck, Crown, X, Settings, MessageCircle, ChevronDown, AlignJustify, Copy, Share2, ExternalLink } from 'lucide-react';
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
  const [name, setName] = useState(''); // New Name field
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.PREFER_NOT_TO_SAY);

  useEffect(() => {
    if (isOwnProfile && profileUser) {
      setUsername(profileUser.username);
      setName(profileUser.name || '');
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
        name,
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

  const handleCopyLink = () => {
     navigator.clipboard.writeText("https://tanmay.code.blog");
     alert("Link copied!");
  };

  const handleShare = async () => {
     if (navigator.share) {
         try {
             await navigator.share({
                 title: 'FusionHub Profile',
                 text: `Check out ${profileUser.username} on FusionHub!`,
                 url: 'https://tanmay.code.blog'
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
    <div className="h-full overflow-y-auto pb-32 no-scrollbar relative gpu-accelerated bg-white dark:bg-black">
      
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
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/90 dark:bg-black/90 backdrop-blur-md z-40 flex items-center justify-between px-4 sm:max-w-md sm:mx-auto border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1">
             {isOwnProfile && (
                 <div className="flex items-center gap-1">
                     <Lock className="w-3 h-3 text-gray-800 dark:text-white" />
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profileUser.username}</h1>
                     <ChevronDown className="w-4 h-4 text-gray-800 dark:text-white mt-1" />
                     {isOwnerUser && <div className="bg-yellow-400 p-0.5 rounded-full ml-1"><Crown className="w-2 h-2 text-white fill-white"/></div>}
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
                    {isOwnerUser ? <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" /> : isAdminUser ? <ShieldCheck className="w-3 h-3 text-blue-500" /> : null}
                 </h1>
             )}
          </div>
          
          <div className="flex items-center gap-4">
              {isOwnProfile ? (
                 <>
                    <button className="text-gray-900 dark:text-white hover:opacity-70"><Settings className="w-6 h-6" onClick={() => navigate('/settings')}/></button>
                 </>
              ) : (
                  <button className="text-gray-900 dark:text-white hover:opacity-70"><AlignJustify className="w-6 h-6" /></button>
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
                   {/* Gradient Ring */}
                   <div className="absolute -inset-[3px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                       <div className="h-full w-full rounded-full bg-white dark:bg-black border-2 border-transparent"></div>
                   </div>
                   
                   <img 
                     src={displayAvatar} 
                     onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                     alt="Profile" 
                     className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-black relative z-10" 
                   />

                   {/* Note Bubble */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-gray-800 shadow-md rounded-xl px-2 py-1 flex flex-col items-center animate-bounce-soft">
                       <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Note...</span>
                       <div className="w-1.5 h-1.5 bg-white dark:bg-gray-800 rotate-45 absolute -bottom-0.5"></div>
                   </div>

                   {isEditing && (
                     <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full cursor-pointer hover:bg-black/50 transition-colors">
                       <Camera className="w-8 h-8 text-white opacity-80" />
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                   )}
                </div>
            </div>
         </div>

         {/* Bio Section - Below Avatar */}
         <div className={`mb-4 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '150ms' }}>
            <div className="flex flex-col items-start">
               <span className="font-bold text-sm text-gray-900 dark:text-white italic">{profileUser.name || profileUser.username}</span>
               
               <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line leading-snug mt-1">
                   {displayDescription || "No bio yet."}
               </p>
               
               {/* Link & Buttons */}
               <div className="flex items-center gap-2 mt-2">
                   <a 
                     href="https://tanmay.code.blog" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center gap-1 p-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                   >
                       <div className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm"><LinkIcon className="w-3 h-3 text-gray-900 dark:text-white" /></div>
                       <span className="text-xs font-bold text-blue-600 dark:text-blue-400">tanmay.code.blog</span>
                       <ExternalLink className="w-3 h-3 text-gray-400 ml-1" />
                   </a>
                   <button onClick={handleCopyLink} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"><Copy className="w-4 h-4" /></button>
                   <button onClick={handleShare} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"><Share2 className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         {/* Action Buttons */}
         {!isEditing && (
            <div className={`flex gap-2 mb-6 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '200ms' }}>
                {isOwnProfile ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                      <button 
                        className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        View archive
                      </button>
                    </>
                ) : (
                    <>
                         {isFriend ? (
                            <button className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm">
                                Following
                            </button>
                         ) : (
                            <button 
                                onClick={() => sendFriendRequest(profileUser.id)}
                                disabled={isRequested}
                                className={`flex-1 py-1.5 rounded-lg font-semibold text-sm transition-colors ${isRequested ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-blue-500 text-white'}`}
                            >
                                {isRequested ? 'Requested' : 'Follow'}
                            </button>
                         )}
                         <button 
                             onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                             disabled={(!canViewDetails && !profileUser.allowPrivateChat)}
                             className="flex-1 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 transition-colors"
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
                        className="w-full p-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 mt-1 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full p-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 mt-1 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bio</label>
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="w-full p-2 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 mt-1 h-20 resize-none focus:border-blue-500 outline-none"
                        placeholder="Write something..."
                    />
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancel</button>
                     <button onClick={handleSave} className="flex-1 py-2 text-sm font-bold bg-blue-500 text-white rounded-lg shadow-md">Save</button>
                  </div>
                </div>
            </div>
         )}
         
         {/* Private Account Lock */}
         {!canViewDetails && !isEditing && (
             <div className="mt-12 text-center p-10 border-t border-gray-100 dark:border-gray-800">
                 <div className="w-16 h-16 rounded-full border-2 border-gray-800 dark:border-gray-200 flex items-center justify-center mx-auto mb-4">
                     <Lock className="w-8 h-8 text-gray-800 dark:text-gray-200" />
                 </div>
                 <h3 className="font-bold text-gray-900 dark:text-white">This account is private</h3>
                 <p className="text-sm text-gray-500">Follow to see their photos and videos.</p>
             </div>
         )}

         {/* Content Area (Photos) */}
         {canViewDetails && !isEditing && (
            <div className={`mt-2 ${enableAnimations ? 'animate-slide-up-heavy' : ''}`} style={{ animationDelay: '300ms' }}>
                 {/* Tabs */}
                 <div className="flex justify-around border-t border-gray-200 dark:border-gray-800 mb-1">
                     <div className="border-t-2 border-black dark:border-white py-3 px-4">
                         <AlignJustify className="w-6 h-6 text-black dark:text-white" />
                     </div>
                     <div className="py-3 px-4">
                         <Settings className="w-6 h-6 text-gray-400" />
                     </div>
                 </div>

                 {/* Photo Grid Placeholder */}
                 <div className="grid grid-cols-3 gap-0.5">
                     {[1,2,3,4,5].map((item) => (
                         <div key={item} className="aspect-square bg-gray-200 dark:bg-gray-800 relative cursor-pointer hover:opacity-90">
                             {item === 1 && (
                                 <img src="https://picsum.photos/300/300?random=10" className="w-full h-full object-cover" alt="post"/>
                             )}
                             {item !== 1 && (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <Camera className="w-6 h-6" />
                                  </div>
                             )}
                         </div>
                     ))}
                 </div>
            </div>
         )}
      </div>
    </div>
  );
};
