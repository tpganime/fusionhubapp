
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, ArrowLeft, Lock, ShieldCheck, Crown, X, Settings, AlignJustify, Share2, Activity, UserMinus, User as UserIcon, Copy, Instagram, Ban, CheckCircle2 } from 'lucide-react';
import { Gender } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { GenericModal } from '../components/GenericModal';

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

const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const FUSION_USER_NAME = "Fusion User";
const FUSION_USER_AVATAR = "https://ui-avatars.com/api/?name=Fusion+User&background=6b7280&color=fff";

interface Stat {
    day: string;
    date: string;
    ms: number;
}

export const ProfileScreen: React.FC = () => {
  const { currentUser, users, updateProfile, sendFriendRequest, unfriend, blockUser, unblockUser, checkIsAdmin, checkIsOwner, enableAnimations, appConfig, getTimeSpent, getWeeklyStats } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [timeSpent, setTimeSpent] = useState("0m");
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStat, setSelectedStat] = useState<Stat | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  useEffect(() => {
      if (isOwnProfile) {
          const update = () => setTimeSpent(getTimeSpent());
          update(); 
          const interval = setInterval(update, 30000); 
          return () => clearInterval(interval);
      }
  }, [isOwnProfile, getTimeSpent]);

  useEffect(() => {
      if (!showStatsModal) setSelectedStat(null);
  }, [showStatsModal]);

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
  const [instagramLink, setInstagramLink] = useState('');

  useEffect(() => {
    if (isOwnProfile && profileUser && !isEditing) {
      setUsername(profileUser.username);
      setName(profileUser.name || '');
      setDescription(profileUser.description && !profileUser.description.startsWith('{') ? profileUser.description : ''); 
      setAvatar(profileUser.avatar);
      setBirthdate(profileUser.birthdate || '');
      setGender(profileUser.gender || Gender.PREFER_NOT_TO_SAY);
      setInstagramLink(profileUser.instagramLink || '');
    }
  }, [isOwnProfile, profileUser, isEditing]);

  useEffect(() => {
    if (showFullAvatar) setIsZoomed(false);
  }, [showFullAvatar]);

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="text-center">
            <h2 className="text-xl font-bold">User not found</h2>
            <button onClick={() => navigate('/home')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    );
  }
  
  // Privacy / Masking Check
  const isBlocked = currentUser?.blockedUsers.includes(profileUser.id);
  const isBlockedBy = profileUser.blockedUsers.includes(currentUser?.id || '');
  const shouldMask = isBlocked || isBlockedBy;

  const displayAvatar = isEditing ? avatar : (shouldMask ? FUSION_USER_AVATAR : profileUser.avatar);
  const displayUsername = shouldMask ? FUSION_USER_NAME : profileUser.username;
  const displayName = shouldMask ? FUSION_USER_NAME : (profileUser.name || profileUser.username);
  const displayDescription = shouldMask ? "Fusion User" : ((profileUser.description && profileUser.description.startsWith('{')) ? "Admin Account" : profileUser.description);
  
  const isAdminUser = !shouldMask && checkIsAdmin(profileUser.email);
  const isOwnerUser = !shouldMask && checkIsOwner(profileUser.email);
  const isPremiumUser = !shouldMask && !!profileUser.isPremium;

  if (profileUser.isDeactivated && !isOwnProfile) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
             <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"><ArrowLeft className="w-6 h-6 dark:text-white" /></button>
             <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                 <UserIcon className="w-10 h-10 text-gray-400" />
             </div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Deactivated User</h2>
             <p className="text-gray-500">This account has been deactivated.</p>
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
        gender,
        instagramLink
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
     setShowShareModal(false);
  };

  const handleConfirmUnfollow = async () => {
      await unfriend(profileUser.id);
      setShowUnfollowModal(false);
  };
  
  const handleBlock = async () => {
      await blockUser(profileUser.id);
      setShowMoreOptions(false);
      alert("User blocked.");
      navigate('/home');
  };

  const handleUnblock = async () => {
      await unblockUser(profileUser.id);
      setShowMoreOptions(false);
      alert("User unblocked.");
  };

  const startChat = () => {
      navigate(`/chat?uid=${profileUser.id}`);
  };

  const handleBack = () => {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/home');
      }
  };

  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isRequested = profileUser.requests.includes(currentUser?.id || '');
  
  const canViewDetails = (isOwnProfile || !profileUser.isPrivateProfile || isFriend) && !shouldMask;
  const canMessage = (isFriend || profileUser.allowPrivateChat) && !shouldMask;
  
  const displayAge = !shouldMask ? calculateAge(profileUser.birthdate) : 'N/A';

  const weeklyStats = isOwnProfile ? getWeeklyStats() : [];
  const maxMs = Math.max(...weeklyStats.map(s => s.ms), 60000); 
  const totalMs = weeklyStats.reduce((acc, curr) => acc + curr.ms, 0);
  const avgMs = Math.round(totalMs / 7);

  const formatBigTime = (ms: number) => {
      const m = Math.floor(ms / 60000);
      const h = Math.floor(m / 60);
      const mins = m % 60;
      if (h > 0) return (
        <span>
            <span className="text-5xl">{h}</span><span className="text-3xl">h</span>
            <span className="text-5xl ml-1">{mins}</span><span className="text-3xl">m</span>
        </span>
      );
      return (<span><span className="text-5xl">{mins}</span><span className="text-3xl">m</span></span>);
  };

  const currentDisplayStat = selectedStat ? selectedStat.ms : avgMs;
  const currentDisplayLabel = selectedStat ? `Time Spent on ${selectedStat.day}` : 'Daily Average';
  const currentDisplayDesc = selectedStat ? `Usage for ${selectedStat.date}` : 'Average time you spent per day using the FusionHub app on this device in the last week.';

  return (
    <div className={`h-full flex flex-col bg-white dark:bg-black ${enableAnimations ? 'animate-fade-in' : ''}`}>
      
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

      {/* Unfollow Confirmation Modal */}
      <GenericModal isOpen={showUnfollowModal} onClose={() => setShowUnfollowModal(false)} title="Unfollow User">
          <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to unfollow <span className="font-bold text-gray-900 dark:text-white">{displayUsername}</span>?
              </p>
              <div className="flex gap-3">
                  <button onClick={() => setShowUnfollowModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
                  <button onClick={handleConfirmUnfollow} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/30">Unfollow</button>
              </div>
          </div>
      </GenericModal>

      {/* Share Modal */}
      <GenericModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Profile">
          <div className="space-y-4">
              <button onClick={handleCopyLink} className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Copy className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-800 dark:text-white flex-1 text-left">Copy Link</span>
              </button>
              
              {profileUser.instagramLink && !shouldMask && (
                  <a href={profileUser.instagramLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group">
                      <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-500">
                          <Instagram className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-800 dark:text-white flex-1 text-left">Instagram</span>
                  </a>
              )}
          </div>
      </GenericModal>
      
      {/* More Options Modal */}
      <GenericModal isOpen={showMoreOptions} onClose={() => setShowMoreOptions(false)} title="Options">
          <div className="space-y-2">
             {isBlocked ? (
                 <button onClick={handleUnblock} className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-5 h-5" /> Unblock User
                 </button>
             ) : (
                 <button onClick={handleBlock} className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold flex items-center justify-center gap-2">
                     <Ban className="w-5 h-5" /> Block User
                 </button>
             )}
          </div>
      </GenericModal>

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowStatsModal(false)}></div>
            <div className="relative bg-white dark:bg-black w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-white/20 animate-pop-in overflow-hidden">
                <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-20" onClick={() => setShowStatsModal(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex flex-col items-center mb-8">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{currentDisplayLabel}</h3>
                    <div className="mt-2 font-black bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                        {formatBigTime(currentDisplayStat)}
                    </div>
                    <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed max-w-[240px]">
                        {currentDisplayDesc}
                    </p>
                </div>
                <div className="flex items-end justify-between h-48 gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                    {weeklyStats.map((stat, i) => {
                        const heightPercent = Math.max((stat.ms / maxMs) * 100, 4);
                        const isToday = i === 6;
                        const label = isToday ? 'Today' : stat.day;
                        const isSelected = selectedStat?.date === stat.date;
                        return (
                            <div 
                              key={i} 
                              onClick={() => setSelectedStat(stat)}
                              className="flex-1 flex flex-col items-center gap-2 group relative cursor-pointer"
                            >
                                <div className="w-full relative flex items-end h-full bg-gray-100 dark:bg-gray-900 rounded-md overflow-hidden hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                                    <div 
                                      className={`w-full rounded-md transition-all duration-1000 ease-out ${isSelected ? 'bg-orange-500' : isToday ? 'bg-[#60A5FA]' : 'bg-blue-300 dark:bg-blue-800'}`}
                                      style={{ height: `${heightPercent}%` }}
                                    ></div>
                                </div>
                                <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-orange-500' : isToday ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                                    {label.substring(0, 1)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-none h-14 glass-panel border-b-0 border-t-0 rounded-none z-40 flex items-center justify-between px-4 sm:max-w-md sm:mx-auto shadow-sm transition-all duration-300">
          <div className="flex items-center gap-1">
             {isOwnProfile ? (
                 <>
                     <Lock className="w-3 h-3 text-gray-800 dark:text-white" />
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{displayUsername}</h1>
                 </>
             ) : (
                 <>
                     <button onClick={handleBack} className="mr-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform"><ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" /></button>
                     <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{displayUsername}</h1>
                 </>
             )}
             {isOwnerUser && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1 flex-shrink-0" />}
             {isAdminUser && !isOwnerUser && <ShieldCheck className="w-4 h-4 text-blue-500 ml-1 flex-shrink-0" />}
             {isPremiumUser && !isOwnerUser && !isAdminUser && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 ml-1 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-4">
              {isOwnProfile ? (
                  <button><Settings className="w-6 h-6 text-gray-900 dark:text-white" onClick={() => navigate('/settings')}/></button> 
              ) : (
                  <button onClick={() => setShowMoreOptions(true)}><AlignJustify className="w-6 h-6 text-gray-900 dark:text-white" /></button>
              )}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pt-4 px-4 pb-32 no-scrollbar">
         {isBlocked && (
             <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-xl text-center text-sm font-bold">
                 You have blocked this user.
             </div>
         )}
         
         <div className="mb-6">
             <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">User Info</h2>
             <div className={`p-5 glass-panel flex items-center gap-5 ${enableAnimations ? 'animate-slide-up-fade' : ''}`}>
                <div className="relative flex-shrink-0">
                   <div 
                     className={`w-20 h-20 rounded-full p-[2px] cursor-pointer shadow-lg active:scale-95 transition-transform ${isPremiumUser ? 'bg-gradient-to-tr from-yellow-300 to-orange-500' : 'bg-gradient-to-tr from-blue-400 to-purple-500'}`}
                     onClick={() => !isEditing && !shouldMask && setShowFullAvatar(true)}
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

                <div className="flex-1 min-w-0 space-y-1">
                   <div>
                       <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate leading-tight flex items-center gap-1">
                           {displayName}
                           {isPremiumUser && !isAdminUser && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                       </h2>
                       <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {isAdminUser ? (isOwnerUser ? "Owner" : "Administrator") : "Member"}
                       </p>
                   </div>
                   
                   {isOwnProfile && (
                       <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                           <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                           <span className="truncate">{profileUser.email}</span>
                       </div>
                   )}
                   
                   <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Joined:</span>
                        <span>Nov 2025</span>
                   </div>
                </div>
             </div>
         </div>

         {/* Bio */}
         <div className={`mb-6 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '100ms' }}>
             <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Bio</h2>
             <div className="p-4 glass-panel text-sm text-gray-600 dark:text-gray-300 leading-relaxed min-h-[80px] break-words">
                 {displayDescription || "No bio available."}
             </div>
         </div>

         {/* Details */}
         {canViewDetails && !isEditing && (
             <div className={`mb-6 flex gap-4 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '150ms' }}>
                 <div className="flex-1 p-3 glass-panel flex flex-col items-center">
                     <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Age</span>
                     <span className="text-lg font-bold text-gray-900 dark:text-white">{displayAge !== null ? displayAge : 'N/A'}</span>
                 </div>
                 <div className="flex-1 p-3 glass-panel flex flex-col items-center">
                     <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Gender</span>
                     <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">{profileUser.gender || 'N/A'}</span>
                 </div>
             </div>
         )}

         {/* Activity Stats */}
         {isOwnProfile && (
             <div className={`mb-6 ${enableAnimations ? 'animate-slide-up-fade' : ''}`} style={{ animationDelay: '200ms' }}>
                 <div className="relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Activity className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wide">Time Active (Today)</span>
                       </div>
                       <button 
                          onClick={() => setShowStatsModal(true)}
                          className="px-3 py-1 bg-white dark:bg-black/20 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                        >
                            View Week
                        </button>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{timeSpent}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Total time spent in app today</p>
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
                          <button onClick={() => setShowUnfollowModal(true)} className="flex-1 py-3 rounded-xl glass-panel text-gray-900 dark:text-white font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 flex items-center justify-center gap-2 active:scale-95">
                              <UserMinus className="w-4 h-4" /> Following
                          </button>
                       ) : (
                          <button onClick={() => sendFriendRequest(profileUser.id)} disabled={isRequested || isBlocked} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-95 ${isRequested || isBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{isRequested ? 'Requested' : 'Follow'}</button>
                       )}
                       <button onClick={startChat} disabled={!canMessage} className="flex-1 py-3 rounded-xl glass-panel text-gray-900 dark:text-white font-bold text-sm hover:bg-white/40 dark:hover:bg-white/10 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">Message</button>
                    </>
                )}
                <button onClick={() => setShowShareModal(true)} className="p-3 rounded-xl glass-panel text-gray-900 dark:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-colors active:scale-95"><Share2 className="w-5 h-5" /></button>
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
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                      <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender</label>
                      <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1">
                          {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bio</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none mt-1" placeholder="Tell us about yourself..." />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Instagram Link</label>
                      <input type="text" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-1" placeholder="https://instagram.com/yourprofile" />
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
