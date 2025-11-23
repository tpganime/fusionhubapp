
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { ComingSoon } from '../components/ComingSoon';
import { Camera, Save, ArrowLeft, MessageCircle, UserPlus, Check, Lock, Calendar, Mail, Users as UsersIcon, ShieldCheck, Crown, X } from 'lucide-react';
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
  const { currentUser, users, updateProfile, sendFriendRequest, checkIsAdmin, checkIsOwner, enableAnimations, appConfig } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;

  if (!appConfig.features.profile && !isOwnProfile) {
    return <ComingSoon title="Profile" />;
  }

  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  const [isEditing, setIsEditing] = useState(false);
  const [showFullAvatar, setShowFullAvatar] = useState(false);

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

  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isRequested = profileUser.requests.includes(currentUser?.id || '');
  const canViewDetails = isOwnProfile || !profileUser.isPrivateProfile || isFriend;
  const isAdminUser = checkIsAdmin(profileUser.email);
  const isOwnerUser = checkIsOwner(profileUser.email);
  const displayAvatar = isEditing ? avatar : profileUser.avatar;

  const displayDescription = (profileUser.description && profileUser.description.startsWith('{')) ? "Admin Account" : profileUser.description;

  return (
    <div className="h-full overflow-y-auto pb-32 no-scrollbar">
      {/* Full Screen Avatar Modal */}
      {showFullAvatar && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowFullAvatar(false)}
        >
          <button 
            className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors z-[201]"
            onClick={() => setShowFullAvatar(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={displayAvatar} 
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Error';
            }}
            alt="Full Profile" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-pop-in" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isOwnProfile ? <TopBar /> : (
        <div className="fixed top-4 left-4 z-50">
           <button 
             onClick={() => navigate(-1)} 
             className="p-2.5 rounded-full glass-panel text-gray-900 dark:text-white hover:bg-white/20 transition-all"
           >
             <ArrowLeft className="w-6 h-6" />
           </button>
        </div>
      )}

      <div className="relative pt-20 px-5">
         <div className="flex flex-col items-center">
            {/* Liquid Profile Picture Container */}
            <div 
              className={`relative w-36 h-36 mb-4 transform-gpu cursor-pointer group ${enableAnimations ? 'animate-fade-in' : ''}`}
              onClick={() => !isEditing && setShowFullAvatar(true)}
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-300 to-purple-300 dark:from-blue-600 dark:to-purple-600 rounded-full blur-xl opacity-50 animate-pulse-slow"></div>
               
               {isOwnerUser ? (
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 animate-float pointer-events-none">
                       <Crown className={`w-10 h-10 text-yellow-500 fill-yellow-200 drop-shadow-lg`} />
                   </div>
               ) : isAdminUser ? (
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 animate-float pointer-events-none">
                       <ShieldCheck className={`w-10 h-10 text-blue-500 fill-blue-100 drop-shadow-lg`} />
                   </div>
               ) : null}

               <img 
                 src={displayAvatar} 
                 onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                 }}
                 alt="Profile" 
                 className={`w-full h-full rounded-full object-cover border-4 ${isOwnerUser ? 'border-yellow-400' : isAdminUser ? 'border-blue-500' : 'border-white dark:border-white/20'} shadow-2xl relative z-10 bg-gray-100 transition-transform group-hover:scale-[1.02]`} 
               />
               
               {isEditing && (
                 <label className="absolute bottom-1 right-1 z-20 bg-blue-500 p-2.5 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-all hover:scale-110 border-2 border-white">
                   <Camera className="w-5 h-5" />
                   <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                 </label>
               )}
            </div>
            
            {!isEditing ? (
              <div className={`text-center w-full transform-gpu ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2 flex-wrap mb-1">
                  {profileUser.username}
                  {profileUser.isPrivateProfile && !isOwnProfile && <Lock className="w-5 h-5 text-gray-400" />}
                </h2>
                
                {/* Badges */}
                <div className="flex justify-center gap-2 mb-3">
                   {isOwnerUser && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase border border-yellow-200">Owner</span>}
                   {isAdminUser && <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase border border-blue-200">Admin</span>}
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs mx-auto leading-relaxed mb-6 font-medium">
                  {displayDescription || "No bio set"}
                </p>
                
                <div className="flex items-center justify-center gap-8 mb-6">
                   <div className="text-center">
                     <span className="block text-2xl font-bold text-gray-900 dark:text-white">{profileUser.friends.length}</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Friends</span>
                   </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-3 justify-center w-full max-w-sm mx-auto mb-6">
                     <button 
                         onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                         disabled={(!canViewDetails && !profileUser.allowPrivateChat)}
                         className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                     >
                         <MessageCircle className="w-5 h-5" /> Message
                     </button>
                     
                     {isFriend ? (
                         <button className="flex-1 py-3 rounded-2xl bg-green-500/10 text-green-600 border border-green-500/20 font-bold flex items-center justify-center gap-2">
                             <Check className="w-5 h-5" /> Friends
                         </button>
                     ) : (
                         <button 
                             onClick={() => sendFriendRequest(profileUser.id)}
                             disabled={isRequested}
                             className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border ${
                                 isRequested 
                                 ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-transparent cursor-default' 
                                 : 'liquid-card hover:bg-white/50 dark:hover:bg-white/10 text-gray-900 dark:text-white'
                             }`}
                         >
                             {isRequested ? 'Requested' : <><UserPlus className="w-5 h-5" /> Add Friend</>}
                         </button>
                     )}
                  </div>
                )}

                {isOwnProfile && (
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="px-8 py-2.5 liquid-card rounded-full text-sm font-bold text-gray-700 dark:text-white hover:bg-white/40 transition-all mb-4"
                   >
                     Edit Profile
                   </button>
                )}
              </div>
            ) : null}
         </div>
      </div>

      {!isEditing && canViewDetails && (
        <div className={`mx-5 mt-2 liquid-card p-6 space-y-6 transform-gpu ${enableAnimations ? 'animate-slide-up opacity-0' : ''}`} style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">About</h3>
           
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 border border-pink-500/20">
                 <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Birthdate</p>
                <p className="text-gray-900 dark:text-white font-semibold text-lg">{profileUser.birthdate || 'Not specified'}</p>
              </div>
           </div>

           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20">
                 <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Gender</p>
                <p className="text-gray-900 dark:text-white font-semibold text-lg">{profileUser.gender || 'Not specified'}</p>
              </div>
           </div>

           {isOwnProfile && (
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                   <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                  <p className="text-gray-900 dark:text-white font-semibold text-lg break-all">{profileUser.email}</p>
                </div>
             </div>
           )}
        </div>
      )}

      {!isEditing && !canViewDetails && (
        <div className="mx-5 mt-4 liquid-card p-10 text-center">
            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Private Profile</h3>
            <p className="text-sm text-gray-500 mt-1">Add {profileUser.username} as a friend to see more.</p>
        </div>
      )}

      {isEditing && (
        <div className="mx-5 mt-4 liquid-card p-6 animate-fade-in">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
                <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    className="w-full p-4 liquid-input mt-1 font-medium"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bio {isAdminUser && "(Locked)"}</label>
                <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full p-4 liquid-input mt-1 h-32 resize-none font-medium"
                    placeholder="Tell us about yourself..."
                    disabled={isAdminUser} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Birthdate</label>
                  <input 
                      type="date" 
                      value={birthdate} 
                      onChange={e => setBirthdate(e.target.value)} 
                      className="w-full p-4 liquid-input mt-1 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender</label>
                  <select 
                    value={gender} 
                    onChange={e => setGender(e.target.value as Gender)}
                    className="w-full p-4 liquid-input mt-1 font-medium bg-transparent"
                  >
                    {Object.values(Gender).map(g => <option key={g} value={g} className="text-black">{g}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold bg-gray-200/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
        </div>
      )}
    </div>
  );
};
