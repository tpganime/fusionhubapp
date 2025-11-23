
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, Save, ArrowLeft, MessageCircle, UserPlus, Check, Lock, Calendar, Mail, Users as UsersIcon, ShieldCheck, Sparkles } from 'lucide-react';
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
  const { currentUser, users, updateProfile, sendFriendRequest, checkIsAdmin, enableAnimations, appConfig } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;

  if (!appConfig.features.profile && !isOwnProfile) {
    return <ComingSoon title="Profile" />;
  }

  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  const [isEditing, setIsEditing] = useState(false);

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

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
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

  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isRequested = profileUser.requests.includes(currentUser?.id || '');
  const canViewDetails = isOwnProfile || !profileUser.isPrivateProfile || isFriend;
  const isProfileAdmin = checkIsAdmin(profileUser.email);
  const displayAvatar = isEditing ? avatar : profileUser.avatar;

  // Mask description if it's the config JSON
  const displayDescription = (profileUser.description && profileUser.description.startsWith('{')) ? "Admin Account" : profileUser.description;

  return (
    <div className="h-full overflow-y-auto pb-24 transition-colors duration-300 scrollbar-hide">
      {isOwnProfile ? <TopBar /> : (
        <div className="absolute top-0 left-0 z-50 p-4">
           <button 
             onClick={() => navigate(-1)} 
             className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-black/30 transition-all"
           >
             <ArrowLeft className="w-6 h-6" />
           </button>
        </div>
      )}

      <div className="relative">
         <div className="h-48 w-full overflow-hidden relative bg-gray-200 dark:bg-gray-800">
            <img 
              src={displayAvatar} 
              className={`w-full h-full object-cover opacity-100 ${enableAnimations && isProfileAdmin ? 'animate-pulse-fast' : ''}`}
              alt="Banner"
              style={{ animationDuration: '10s' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50"></div>
         </div>
         
         <div className="px-4">
            <div className={`relative -mt-20 mb-4 flex flex-col items-center ${enableAnimations ? 'animate-elastic-up' : ''}`}>
               <div className={`relative w-32 h-32 group ${isProfileAdmin && enableAnimations ? 'animate-bounce' : ''}`} style={{ animationDuration: '3s' }}>
                  <div className={`absolute inset-0 rounded-full bg-black/20 blur-md transform translate-y-2 ${enableAnimations ? 'animate-blob' : ''}`}></div>
                  {isProfileAdmin && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
                          <ShieldCheck className={`w-10 h-10 text-blue-500 drop-shadow-lg fill-blue-100 dark:fill-blue-900 ${enableAnimations ? 'animate-pulse-fast' : ''}`} />
                      </div>
                  )}
                  <img 
                    src={displayAvatar} 
                    alt="Profile" 
                    className={`w-full h-full rounded-full object-cover border-[6px] ${isProfileAdmin ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white dark:border-dark-bg'} shadow-xl relative z-10 bg-white dark:bg-gray-800 transition-transform duration-500 hover:scale-105`} 
                  />
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 z-20 bg-blue-500 p-2 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
               </div>
               
               {!isEditing ? (
                 <div className={`text-center mt-3 ${enableAnimations ? 'animate-slide-up' : ''}`}>
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-center flex-wrap">
                     {profileUser.username}
                     {isProfileAdmin && (
                         <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 ${enableAnimations ? 'animate-pulse' : ''}`}>
                             Admin <ShieldCheck className="w-3 h-3" />
                         </span>
                     )}
                     {profileUser.isPrivateProfile && !isOwnProfile && <Lock className="w-4 h-4 text-gray-400" />}
                   </h2>
                   <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-xs mx-auto leading-relaxed">
                     {displayDescription || "No bio set"}
                   </p>
                   
                   <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className={`flex flex-col items-center ${enableAnimations ? 'animate-bounce-in' : ''}`}>
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{profileUser.friends.length}</span>
                        <span className="text-xs uppercase tracking-wide">Friends</span>
                      </div>
                   </div>

                   {!isOwnProfile && (
                     <div className="mt-6 flex flex-col gap-3 items-center w-full max-w-xs mx-auto">
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                                disabled={(!canViewDetails && !profileUser.allowPrivateChat)}
                                className="flex-1 px-4 py-2 rounded-full bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <MessageCircle className="w-4 h-4" /> Message
                            </button>
                            
                            {isFriend ? (
                                <button className="flex-1 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-semibold flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" /> Friends
                                </button>
                            ) : (
                                <button 
                                    onClick={() => sendFriendRequest(profileUser.id)}
                                    disabled={isRequested}
                                    className={`flex-1 px-4 py-2 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${
                                        isRequested 
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default' 
                                        : 'bg-white/60 dark:bg-dark-surface/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-white/5 shadow-sm'
                                    }`}
                                >
                                    {isRequested ? 'Requested' : <><UserPlus className="w-4 h-4" /> Add Friend</>}
                                </button>
                            )}
                        </div>
                     </div>
                   )}

                   {isOwnProfile && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="mt-6 px-6 py-2 bg-white/50 dark:bg-white/5 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors border border-white/30"
                      >
                        Edit Profile
                      </button>
                   )}
                 </div>
               ) : null}
            </div>
         </div>
      </div>

      {!isEditing && (
        <div className="px-4 mt-2">
          {canViewDetails ? (
            <div className={`bg-white/70 dark:bg-dark-surface/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 dark:border-gray-800 space-y-5 ${enableAnimations ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.1s' }}>
               <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4">About</h3>
               
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500 dark:text-pink-300">
                     <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Birthdate</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profileUser.birthdate || 'Not specified'}</p>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 dark:text-purple-300">
                     <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Gender</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profileUser.gender || 'Not specified'}</p>
                  </div>
               </div>

               {isOwnProfile && (
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-300">
                       <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Email</p>
                      <p className="text-gray-900 dark:text-white font-medium">{profileUser.email}</p>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-3xl p-10 text-center border border-white/40 dark:border-gray-800 mt-4">
              <Lock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Private Profile</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Only friends can see full details.</p>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className={`px-4 mt-4 ${enableAnimations ? 'animate-fade-in' : ''}`}>
            <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/50 dark:border-gray-800 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Username</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Bio {isProfileAdmin && "(Overwritten by Config)"}</label>
                <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 h-24 resize-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Tell us about yourself..."
                    disabled={isProfileAdmin} 
                />
                 {isProfileAdmin && <p className="text-[10px] text-red-500">Bio editing disabled for Admin to protect config storage.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Birthdate</label>
                  <input 
                      type="date" 
                      value={birthdate} 
                      onChange={e => setBirthdate(e.target.value)} 
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Gender</label>
                  <select 
                    value={gender} 
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
        </div>
      )}
    </div>
  );
};
