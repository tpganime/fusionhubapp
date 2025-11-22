import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopBar } from '../components/TopBar';
import { Camera, Save, ArrowLeft, MessageCircle, UserPlus, Check, UserMinus, Lock, Calendar, Mail, Users as UsersIcon } from 'lucide-react';
import { Gender } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

export const ProfileScreen: React.FC = () => {
  const { currentUser, users, updateProfile, sendFriendRequest } = useApp();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUser = isOwnProfile ? currentUser : users.find(u => u.id === userId);
  
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Editing
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.PREFER_NOT_TO_SAY);

  // Initialize form state when profileUser changes (and it's own profile)
  useEffect(() => {
    if (isOwnProfile && profileUser) {
      setUsername(profileUser.username);
      setDescription(profileUser.description || '');
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         setAvatar(reader.result as string);
       };
       reader.readAsDataURL(file);
     }
  };

  // Friend Logic for Other Users
  const isFriend = currentUser?.friends.includes(profileUser.id);
  const isRequested = profileUser.requests.includes(currentUser?.id || '');
  const canViewDetails = isOwnProfile || !profileUser.isPrivateProfile || isFriend;

  return (
    <div className="min-h-screen pb-24 transition-colors duration-300">
      {isOwnProfile ? <TopBar /> : (
        // Custom Header for viewing other users
        <div className="absolute top-0 left-0 z-50 p-4">
           <button 
             onClick={() => navigate(-1)} 
             className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/30 transition-all"
           >
             <ArrowLeft className="w-6 h-6" />
           </button>
        </div>
      )}

      {/* Profile Banner & Header */}
      <div className="relative">
         <div className="h-48 w-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
            <div className="absolute top-20 -right-10 w-64 h-64 bg-yellow-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
         </div>
         
         <div className="px-4">
            <div className="relative -mt-20 mb-4 flex flex-col items-center">
               <div className="relative w-32 h-32 group">
                  <div className="absolute inset-0 rounded-full bg-white/30 dark:bg-black/30 blur-md transform translate-y-2"></div>
                  <img 
                    src={isEditing ? avatar : profileUser.avatar} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover border-[6px] border-white dark:border-dark-bg shadow-xl relative z-10" 
                  />
                  {isEditing && (
                    <label className="absolute bottom-2 right-2 z-20 bg-blue-500 p-2 rounded-full text-white shadow-lg cursor-pointer hover:bg-blue-600 transition-transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
               </div>
               
               {!isEditing ? (
                 <div className="text-center mt-3 animate-fade-in">
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-center">
                     {profileUser.username}
                     {profileUser.isPrivateProfile && !isOwnProfile && <Lock className="w-4 h-4 text-gray-400" />}
                   </h2>
                   <p className="text-gray-600 dark:text-gray-300 mt-1 max-w-xs mx-auto leading-relaxed">
                     {profileUser.description || "No bio set"}
                   </p>
                   
                   <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 dark:text-white text-lg">{profileUser.friends.length}</span>
                        <span className="text-xs uppercase tracking-wide">Friends</span>
                      </div>
                   </div>

                   {/* Action Buttons for Other Users */}
                   {!isOwnProfile && (
                     <div className="flex gap-3 mt-6">
                       <button 
                         onClick={() => navigate('/chat', { state: { targetUser: profileUser } })}
                         disabled={!canViewDetails && !profileUser.allowPrivateChat}
                         className="px-6 py-2 rounded-full bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                       >
                         <MessageCircle className="w-4 h-4" /> Message
                       </button>
                       
                       {isFriend ? (
                         <button className="px-6 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 font-semibold flex items-center gap-2">
                           <Check className="w-4 h-4" /> Friends
                         </button>
                       ) : (
                         <button 
                           onClick={() => sendFriendRequest(profileUser.id)}
                           disabled={isRequested}
                           className={`px-6 py-2 rounded-full font-semibold flex items-center gap-2 transition-all ${
                             isRequested 
                               ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-default' 
                               : 'bg-white/60 dark:bg-dark-surface/60 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-white/5 shadow-sm'
                           }`}
                         >
                           {isRequested ? 'Requested' : <><UserPlus className="w-4 h-4" /> Add Friend</>}
                         </button>
                       )}
                     </div>
                   )}

                   {/* Edit Button for Owner */}
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

      {/* Details Section */}
      {!isEditing && (
        <div className="px-4 mt-2">
          {canViewDetails ? (
            <div className="bg-white/70 dark:bg-dark-surface/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 dark:border-gray-800 space-y-5 animate-slide-up">
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

      {/* Edit Mode Form */}
      {isEditing && (
        <div className="px-4 mt-4 animate-fade-in">
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
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-1">Bio</label>
                <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mt-1 h-24 resize-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Tell us about yourself..."
                />
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