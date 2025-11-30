

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Trash2, Power, ChevronRight, Moon, Sun, Zap, LayoutDashboard, Bell, Droplets, Sliders, ArrowRight as ArrowRightIcon, Users, Shield, MessageCircle, AlertTriangle, Copy, Gauge, Crown, Upload, CheckCircle2, ScanLine, XCircle, ExternalLink } from 'lucide-react';
import { PRIVACY_POLICY_TEXT } from '../constants';
import { LiquidSlider } from '../components/LiquidSlider';
import { LiquidToggle } from '../components/LiquidToggle';
import { GenericModal } from '../components/GenericModal';
import { GoogleGenAI } from "@google/genai";

// Utility to compress images before sending to AI (Reduces payload size to prevent errors)
const compressImageForAI = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // Limit to 1024px for AI safety
        const MAX_HEIGHT = 1024;
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
        // Returns base64 string
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const SettingsScreen: React.FC = () => {
  const { currentUser, updateProfile, logout, switchAccount, removeKnownAccount, knownAccounts, deleteAccount, deactivateAccount, theme, toggleTheme, enableAnimations, toggleAnimations, animationSpeed, setAnimationSpeed, enableLiquid, toggleLiquid, glassOpacity, setGlassOpacity, isAdmin, enableNotifications, notificationPermission, openSwitchAccountModal } = useApp();
  const navigate = useNavigate();
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  
  // Modal States
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'initial' | 'scanning' | 'success' | 'failed'>('initial');
  const [scanStatus, setScanStatus] = useState("Initializing...");
  const [failReason, setFailReason] = useState("");
  
  const isNotificationGranted = notificationPermission === 'granted';
  const isPremium = !!currentUser?.isPremium;

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleConfirmDelete = () => {
      deleteAccount();
      navigate('/');
  };

  const handleConfirmDeactivate = () => {
      deactivateAccount();
      navigate('/');
  };

  const transparencyValue = Math.round((1.0 - glassOpacity) * 100);
  const handleTransparencyChange = (val: number) => {
      if (!isPremium) return;
      // If slider is 100%, set opacity to 0 (Crystal Clear)
      // Otherwise scale between 0.05 and 1.0
      let newOpacity = 1.0 - (val / 100.0);
      if (val >= 98) newOpacity = 0; 
      
      setGlassOpacity(newOpacity);
  };

  const handleAnimationSpeedChange = (speed: 'fast' | 'balanced' | 'relaxed') => {
      if (!isPremium) return;
      setAnimationSpeed(speed);
  };

  const togglePrivateProfile = async () => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, isPrivateProfile: !currentUser.isPrivateProfile });
  };

  const toggleAllowMessages = async () => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, allowPrivateChat: !currentUser.allowPrivateChat });
  };

  const handleBack = () => {
      navigate('/home');
  };

  const generateUpiUrl = () => {
      const upiId = "733718802@omni";
      const name = "FusionHub Premium";
      const amount = "29.00";
      const note = "Premium Upgrade";
      return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const openUpiLink = () => {
      const upiUrl = generateUpiUrl();
      
      // Method 1: Anchor Click (Better for deep links)
      const link = document.createElement('a');
      link.href = upiUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Method 2: Fallback
      setTimeout(() => {
          window.location.href = upiUrl;
      }, 500);
  };

  const handleBuyPremium = () => {
      openUpiLink();
      
      // Open verification modal immediately
      setShowPaymentModal(true);
      setPaymentStep('initial');
      setScanStatus("Initializing...");
      setFailReason("");
  };
  
  const handleManualPayClick = () => {
      openUpiLink();
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setPaymentStep('scanning');
          setScanStatus("Compressing & Encrypting...");
          
          try {
              // 1. Compress Image (Critical fix for "Internal Error" due to payload size)
              const compressedBase64 = await compressImageForAI(file);

              // Extract raw base64 and mime type
              const mimeType = compressedBase64.substring(compressedBase64.indexOf(':') + 1, compressedBase64.indexOf(';'));
              const base64Data = compressedBase64.split(',')[1];

              setScanStatus("Analyzing with Gemini AI...");

              // 2. Initialize Gemini AI
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              
              // 3. Send Request
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: {
                      parts: [
                          { inlineData: { mimeType: mimeType, data: base64Data } },
                          { text: `Analyze this image. It should be a payment receipt.
                            
                            Required Checks:
                            1. Is it a successful payment? Look for "Successful", "Paid", "Completed", green checkmarks.
                            2. Is the amount 29? Look for "₹29", "29.00", "Rs. 29". 
                            
                            Return strictly valid JSON:
                            {
                              "isValid": boolean,
                              "reason": string
                            }
                            If amount is different or status is pending/failed, isValid must be false.` 
                          }
                      ]
                  }
              });

              // 4. Parse Response
              const resultText = response.text;
              if (!resultText) throw new Error("No response from AI");
              
              // Robust parsing: Find the JSON object inside the text (Gemini sometimes chats)
              const jsonMatch = resultText.match(/\{[\s\S]*\}/);
              if (!jsonMatch) {
                  throw new Error("Invalid AI response format");
              }
              
              const cleanedText = jsonMatch[0];
              let result;
              try {
                  result = JSON.parse(cleanedText);
              } catch (e) {
                  console.error("JSON Parse Error:", e, cleanedText);
                  throw new Error("Failed to parse AI response.");
              }

              if (result.isValid) {
                  setScanStatus("Payment Verified!");
                  setTimeout(() => {
                      setPaymentStep('success');
                      // Grant Premium for 30 days
                      if (currentUser) {
                          const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 Days from now
                          updateProfile({ ...currentUser, isPremium: true, premiumExpiry: expiry });
                      }
                  }, 1500);
              } else {
                  setFailReason(result.reason || "Screenshot does not show a successful payment of ₹29.");
                  setPaymentStep('failed');
              }

          } catch (error: any) {
              console.error("Payment Verification Failed:", error);
              // Show actual error for debugging
              alert(`Scan Error: ${error.message}`); 
              setFailReason(error.message || "AI scan failed. Please ensure the image is a clear screenshot.");
              setPaymentStep('failed');
          }
      }
  };

  const resetPaymentModal = () => {
      setPaymentStep('initial');
      setFailReason("");
      setScanStatus("");
  };

  // ---------------- VIEW: PRIVACY POLICY ----------------
  if (showPrivacyPolicy) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden animate-fade-in">
        <div className="flex-none p-4 z-50 bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 flex items-center shadow-sm">
          <button 
             onClick={() => setShowPrivacyPolicy(false)} 
             className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <h2 className="text-lg font-bold ml-2 text-gray-900 dark:text-white">Privacy Policy</h2>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-20">
          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-gray-800">
            {PRIVACY_POLICY_TEXT}
          </div>
        </div>
      </div>
    );
  }

  // ---------------- VIEW: MAIN SETTINGS ----------------
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-black overflow-hidden animate-fade-in">
      
      {/* Payment Verification Modal */}
      <GenericModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Verify Payment">
         <div className="text-center">
             {paymentStep === 'initial' && (
                 <>
                    <div className="mb-6 space-y-3">
                        <button 
                            onClick={handleManualPayClick}
                            className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 active:scale-95 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" /> Tap to Pay ₹29
                        </button>
                        <p className="text-[10px] text-gray-400">Opens PhonePe, Paytm, or GPay.</p>
                    </div>

                    <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-6"></div>

                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
                        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium text-sm">
                        After payment, upload the receipt screenshot to activate Premium.
                    </p>
                    <label className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 active:scale-95">
                        <span>Upload Screenshot</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadScreenshot} />
                    </label>
                 </>
             )}

             {paymentStep === 'scanning' && (
                 <>
                    <div className="relative w-full h-48 bg-gray-900 rounded-xl overflow-hidden mb-4 border border-blue-500/30">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            {/* Matrix-like background effect */}
                            <div className="text-[8px] text-green-500 font-mono break-all leading-none opacity-50">
                                {Array(2000).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('')}
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <ScanLine className="w-16 h-16 text-blue-400 animate-pulse" />
                        </div>
                        {/* Scanning Line Animation */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">AI Scan In Progress</h3>
                    <p className="text-xs text-blue-500 font-mono uppercase tracking-widest animate-pulse">{scanStatus}</p>
                 </>
             )}

             {paymentStep === 'failed' && (
                 <>
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 animate-shake">
                        <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h3>
                    <p className="text-red-500 dark:text-red-400 mb-6 text-sm font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                        {failReason}
                    </p>
                    <button onClick={resetPaymentModal} className="w-full py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold hover:bg-gray-300 dark:hover:bg-gray-600">
                        Try Again
                    </button>
                 </>
             )}

             {paymentStep === 'success' && (
                 <>
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4 animate-pop-in">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Activated!</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                        Thank you for your purchase. Premium features are unlocked for 30 days.
                    </p>
                    <button onClick={() => setShowPaymentModal(false)} className="w-full py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-600/30 hover:bg-green-700">
                        Awesome!
                    </button>
                 </>
             )}
         </div>
      </GenericModal>

      {/* Deactivate Modal */}
      <GenericModal isOpen={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} title="Deactivate Account">
          <div className="text-center">
               <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Power className="w-8 h-8 text-gray-600 dark:text-gray-400" />
               </div>
               <p className="text-gray-600 dark:text-gray-300 mb-6">
                  This will temporarily disable your account. You can reactivate it anytime by logging back in.
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setShowDeactivateModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
                  <button onClick={handleConfirmDeactivate} className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold">Deactivate</button>
              </div>
          </div>
      </GenericModal>

      {/* Delete Modal */}
      <GenericModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
          <div className="text-center">
               <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
               </div>
               <p className="text-gray-600 dark:text-gray-300 mb-6 font-medium">
                  This action is permanent and cannot be undone. All your data will be erased.
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Cancel</button>
                  <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-600/30 hover:bg-red-700">Delete</button>
              </div>
          </div>
      </GenericModal>

      {/* Header */}
      <div className="flex-none p-4 bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 flex items-center shadow-sm z-50">
        <button 
           onClick={handleBack} 
           className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold ml-2 text-gray-900 dark:text-white">Settings</h2>
      </div>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-40 space-y-6 max-w-md mx-auto w-full no-scrollbar relative z-10">
        
        {/* PREMIUM CARD */}
        {!isPremium ? (
             <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
                 <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                             <Crown className="w-6 h-6 text-white fill-white" />
                         </div>
                         <h3 className="text-2xl font-black italic tracking-tight">FusionHub Premium</h3>
                     </div>
                     <p className="text-white/90 text-sm mb-4 font-medium leading-relaxed">
                         Unlock exclusive features and remove ads for just <span className="text-white font-black text-lg">₹29</span> / 30 days.
                     </p>
                     <ul className="space-y-2 mb-6 text-xs font-bold text-white/80">
                         <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Remove All Ads</li>
                         <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Unlock Animations</li>
                         <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Crystal Clear Glass Mode</li>
                         <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Adjust Animation Speed</li>
                     </ul>
                     <button 
                        onClick={handleBuyPremium}
                        className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold shadow-lg hover:bg-orange-50 transition-colors active:scale-95"
                     >
                         Get Premium Now
                     </button>
                 </div>
             </div>
        ) : (
            <div className="bg-gradient-to-br from-gray-800 to-black border border-gray-700 rounded-3xl p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="w-32 h-32 text-yellow-500" /></div>
                 <div className="relative z-10">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">Premium Active <CheckCircle2 className="w-5 h-5 text-green-400" /></h3>
                     </div>
                     <p className="text-gray-400 text-xs mt-2 mb-2">Thanks for supporting FusionHub!</p>
                     {currentUser.premiumExpiry && (
                         <p className="text-[10px] text-gray-500 font-mono">
                             Expires: {new Date(currentUser.premiumExpiry).toLocaleDateString()}
                         </p>
                     )}
                 </div>
            </div>
        )}

        {isAdmin && (
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Admin</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
               <button onClick={() => navigate('/admin')} className="w-full p-5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-3xl">
                 <div className="flex items-center gap-4">
                   <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl text-white shadow-lg"><LayoutDashboard className="w-5 h-5" /></div>
                   <span className="font-bold text-gray-900 dark:text-white">Admin Panel</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Appearance</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
             <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className={`p-2.5 rounded-xl shadow-md ${theme === 'dark' ? 'bg-indigo-900 text-indigo-300' : 'bg-yellow-100 text-yellow-600'}`}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                 </div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</span>
               </div>
               <div><LiquidToggle checked={theme === 'dark'} onChange={toggleTheme} /></div>
            </div>

            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-xl text-cyan-600 dark:text-cyan-300 shadow-md"><Droplets className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Liquid Glass</span>
               </div>
               <div><LiquidToggle checked={enableLiquid} onChange={toggleLiquid} /></div>
            </div>
            
            {enableLiquid && (
               <div className={`p-5 animate-slide-up ${!isPremium ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md"><Sliders className="w-5 h-5" /></div>
                       <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white text-sm">Transparency</span>
                              {!isPremium && <Lock className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {transparencyValue === 100 ? 'Crystal Clear' : `${transparencyValue}%`}
                          </span>
                       </div>
                   </div>
                   <div><LiquidSlider value={transparencyValue} onChange={handleTransparencyChange} /></div>
               </div>
            )}

            <div className={`p-5 flex items-center justify-between ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-pink-100 dark:bg-pink-900/50 rounded-xl text-pink-600 dark:text-pink-300 shadow-md"><Zap className="w-5 h-5" /></div>
                 <div className="flex flex-col">
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">Animations</span>
                        {!isPremium && <Lock className="w-3 h-3 text-yellow-500" />}
                     </div>
                 </div>
               </div>
               <div><LiquidToggle checked={enableAnimations} onChange={toggleAnimations} /></div>
            </div>

            {enableAnimations && (
               <div className={`p-5 animate-slide-up ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div className="flex items-center gap-4 mb-3">
                       <div className="p-2.5 bg-orange-100 dark:bg-orange-900/50 rounded-xl text-orange-600 dark:text-orange-300 shadow-md"><Gauge className="w-5 h-5" /></div>
                       <div className="flex items-center gap-2">
                           <span className="font-bold text-gray-900 dark:text-white text-sm">Speed</span>
                           {!isPremium && <Lock className="w-3 h-3 text-yellow-500" />}
                       </div>
                   </div>
                   <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                      {(['fast', 'balanced', 'relaxed'] as const).map((speed) => (
                        <button key={speed} onClick={() => handleAnimationSpeedChange(speed)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${animationSpeed === speed ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>{speed}</button>
                      ))}
                   </div>
               </div>
            )}

            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-300 shadow-md"><Bell className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Notifications</span>
               </div>
               <div><LiquidToggle checked={isNotificationGranted} onChange={enableNotifications} /></div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Privacy</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md">
                    <Lock className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Private Profile</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Only friends can see your info</span>
                 </div>
               </div>
               <div><LiquidToggle checked={currentUser.isPrivateProfile} onChange={togglePrivateProfile} /></div>
            </div>

            <div className="p-5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300 shadow-md">
                    <MessageCircle className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Allow Messages</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Receive chats from everyone</span>
                 </div>
               </div>
               <div><LiquidToggle checked={currentUser.allowPrivateChat} onChange={toggleAllowMessages} /></div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-2 tracking-wider">Legal</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
            <button onClick={() => setShowPrivacyPolicy(true)} className="w-full p-5 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-3xl">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-green-100 dark:bg-green-900/50 rounded-xl text-green-600 dark:text-green-300 shadow-md"><Shield className="w-5 h-5" /></div>
                 <span className="font-bold text-gray-900 dark:text-white text-sm">Privacy Policy</span>
               </div>
               <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-red-500/70 uppercase mb-3 ml-2 tracking-wider">Danger Zone</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
            <button onClick={() => setShowDeactivateModal(true)} className="w-full p-5 flex items-center justify-between text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 first:rounded-t-3xl last:rounded-b-3xl">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-gray-200 dark:bg-gray-800 rounded-xl"><Power className="w-5 h-5" /></div>
                 <span className="font-bold">Deactivate</span>
               </div>
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="w-full p-5 flex items-center justify-between text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 first:rounded-t-3xl last:rounded-b-3xl">
               <div className="flex items-center gap-4">
                 <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl"><Trash2 className="w-5 h-5" /></div>
                 <span className="font-bold">Delete</span>
               </div>
            </button>
          </div>
        </section>

        <div className="flex gap-4 pb-8">
            {/* Switch Account Button */}
            <button 
              onClick={() => openSwitchAccountModal(true)}
              className="flex-1 py-4 flex flex-col items-center justify-center rounded-[2rem] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm active:scale-95 group"
            >
               <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-2 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-gray-800 dark:text-white">Switch Account</span>
            </button>

            {/* Log Out Button */}
            <button 
              onClick={handleLogout}
              className="flex-[2] py-4 flex items-center justify-between px-6 rounded-[2rem] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm active:scale-95 group"
            >
               <span className="text-lg font-bold text-gray-800 dark:text-white">Log Out</span>
               <div className="p-2 bg-white dark:bg-black rounded-full group-hover:translate-x-1 transition-transform border border-gray-200 dark:border-gray-700">
                  <ArrowRightIcon className="w-5 h-5 text-gray-800 dark:text-white" />
               </div>
            </button>
        </div>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 opacity-50 pb-10">FusionHub v1.4.1</p>

      </main>
    </div>
  );
};
