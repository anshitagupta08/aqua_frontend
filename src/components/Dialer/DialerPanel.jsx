// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
//   useContext,
// } from "react";
// import {
//   PhoneIcon,
//   PhoneXMarkIcon,
//   UserCircleIcon,
//   ClockIcon,
//   XMarkIcon,
//   SpeakerWaveIcon,
//   SpeakerXMarkIcon,
// } from "@heroicons/react/24/outline";

// import useForm from "../../hooks/useForm";
// import useDialer from "../../hooks/useDialer";

// const DialerPanel = ({ onClose }) => {
//   // New simplified contexts
//   const {
//     callStatus,
//     callerNumber,
//     agentNumber,
//     callDuration,
//     activeCallId,
//     getCurrentSession,
//     showIncomingCall,
//     isCallActive,
//     isCallRinging,
//     isCallConnected,
//     isCallIdle,
//     formatDuration,
//     getStatusColor,
//     getStatusText,
//     declineCall,
//     CALL_STATUS,
//   } = useDialer();

//   const { isFormOpen, formData } = useForm();

//   const [isRingingSoundEnabled, setIsRingingSoundEnabled] = useState(true);

//   // Audio refs for sounds
//   const ringingAudioRef = useRef(null);

//   // Initialize audio elements
//   useEffect(() => {
//     // Create ringing sound audio element
//     ringingAudioRef.current = new Audio("/sounds/phone-ring.mp3");
//     ringingAudioRef.current.loop = true;
//     ringingAudioRef.current.volume = 0.7;
//     ringingAudioRef.current.preload = "auto";

//     // Handle audio loading errors with fallbacks
//     const handleRingingError = () => {
//       console.warn("Could not load phone-ring.mp3, using fallback sound");
//       ringingAudioRef.current.src =
//         "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCWO1fDQfCEEJJbN8Nw=";
//     };

//     ringingAudioRef.current.addEventListener("error", handleRingingError);
//     ringingAudioRef.current.load();

//     return () => {
//       if (ringingAudioRef.current) {
//         ringingAudioRef.current.removeEventListener(
//           "error",
//           handleRingingError
//         );
//         ringingAudioRef.current.pause();
//         ringingAudioRef.current = null;
//       }
//     };
//   }, []);

//   // Enhanced ringing sound management
//   useEffect(() => {
//     if (!ringingAudioRef.current || !isRingingSoundEnabled) return;

//     const playRinging = async () => {
//       try {
//         if (isCallRinging()) {
//           ringingAudioRef.current.currentTime = 0;
//           ringingAudioRef.current.volume = 0.7;
//           await ringingAudioRef.current.play();
//         } else {
//           ringingAudioRef.current.pause();
//           ringingAudioRef.current.currentTime = 0;
//         }
//       } catch (error) {
//         console.warn("Could not play ringing sound:", error.message);
//       }
//     };

//     playRinging();

//     return () => {
//       if (ringingAudioRef.current) {
//         ringingAudioRef.current.pause();
//         ringingAudioRef.current.currentTime = 0;
//       }
//     };
//   }, [callStatus, isRingingSoundEnabled, isCallRinging]);

//   // Phone number formatting
//   const formatPhoneNumber = (number) => {
//     if (!number || typeof number !== "string") {
//       return "";
//     }

//     const digitsOnly = number.replace(/\D/g, "");
//     if (digitsOnly.length <= 3) return digitsOnly;
//     if (digitsOnly.length <= 6)
//       return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
//     return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
//       3,
//       6
//     )}-${digitsOnly.slice(6, 10)}`;
//   };

//   // Handle decline call
//   const handleDeclineCall = () => {
//     if (ringingAudioRef.current) {
//       ringingAudioRef.current.pause();
//       ringingAudioRef.current.currentTime = 0;
//     }
//     declineCall();
//   };

//   // Toggle sound on/off
//   const toggleRingingSound = () => {
//     setIsRingingSoundEnabled(!isRingingSoundEnabled);
//     if (!isRingingSoundEnabled && ringingAudioRef.current) {
//       ringingAudioRef.current.pause();
//       ringingAudioRef.current.currentTime = 0;
//     }
//   };

//   // Keyboard handling for ESC key
//   const handleKeyPress = useCallback(
//     (e) => {
//       if (e.key === "Escape") {
//         e.preventDefault();
//         // Don't allow closing dialer if incoming call is ringing
//         if (!isCallRinging()) {
//           onClose();
//         }
//       }
//     },
//     [isCallRinging, onClose]
//   );

//   useEffect(() => {
//     document.addEventListener("keydown", handleKeyPress);
//     return () => document.removeEventListener("keydown", handleKeyPress);
//   }, [handleKeyPress]);

//   // Get header info based on call status
//   const getHeaderInfo = () => {
//     if (isCallRinging()) {
//       return {
//         title: "Incoming Call",
//         bgColor: "bg-gradient-to-r from-blue-50/80 to-indigo-50/80",
//         indicatorColor: "bg-blue-400",
//         animation: "animate-ping",
//       };
//     } else if (isCallConnected()) {
//       return {
//         title: "Active Call",
//         bgColor: "bg-gradient-to-r from-green-50/80 to-emerald-50/80",
//         indicatorColor: "bg-green-400",
//         animation: "animate-pulse",
//       };
//     }
//     return {
//       title: "Call Status",
//       bgColor: "bg-gradient-to-r from-slate-50/80 to-blue-50/80",
//       indicatorColor: "bg-gray-400",
//       animation: "",
//     };
//   };

//   // Render incoming call interface
//   const renderIncomingCallInterface = () => {
//     if (!isCallRinging()) return null;

//     const displayNumber = callerNumber || "Unknown Number";
//     const displayName = "Unknown Caller"; // Can be enhanced with contact lookup

//     return (
//       <div className="space-y-4">
//         {/* Caller Info */}
//         <div className="text-center space-y-3">
//           {/* Avatar with Ringing Animation */}
//           <div className="flex justify-center">
//             <div className="relative">
//               <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-200">
//                 <UserCircleIcon className="w-12 h-12 text-blue-500" />
//               </div>
//               <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-blue-400 animate-ping"></div>
//             </div>
//           </div>

//           {/* Caller Name and Number */}
//           <div>
//             <div className="text-lg font-semibold text-gray-800 mb-1">
//               {displayName}
//             </div>
//             <div className="text-xl font-mono text-gray-700 tracking-wider">
//               {formatPhoneNumber(displayNumber)}
//             </div>
//           </div>

//           {/* Call Status */}
//           <div className="flex flex-col items-center space-y-2">
//             <div className="flex items-center space-x-2">
//               <div className="flex items-center space-x-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-pulse">
//                 {isRingingSoundEnabled && (
//                   <SpeakerWaveIcon className="w-4 h-4 animate-pulse" />
//                 )}
//                 <PhoneIcon className="w-4 h-4 animate-bounce" />
//                 <span>Phone Ringing...</span>
//               </div>
//             </div>

//             {/* Instruction Text */}
//             <div className="text-xs text-gray-600 text-center px-4">
//               <p className="font-medium">Answer the call on your phone</p>
//               <p className="text-gray-500 mt-1">
//                 The system will automatically connect when you pick up
//               </p>
//             </div>

//             {/* Session Info */}
//             {getCurrentSession()?.sessionId && (
//               <div className="text-xs text-gray-500 space-y-1">
//                 <div className="flex items-center justify-center space-x-1">
//                   <ClockIcon className="w-3 h-3" />
//                   <span>
//                     Session: {getCurrentSession().sessionId.slice(-8)}
//                   </span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Decline Button */}
//         <div className="flex justify-center">
//           <button
//             onClick={handleDeclineCall}
//             className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg flex items-center space-x-2"
//             title="Decline Call"
//           >
//             <PhoneXMarkIcon className="w-5 h-5" />
//             <span>Decline</span>
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // Render connected call interface
//   const renderConnectedCallInterface = () => {
//     if (!isCallConnected()) return null;

//     const displayNumber = callerNumber || "Unknown Number";
//     const displayName = "Connected Call";

//     return (
//       <div className="space-y-4">
//         {/* Connected Call Info */}
//         <div className="text-center space-y-2">
//           <div className="flex justify-center">
//             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
//               <UserCircleIcon className="w-10 h-10 text-green-500" />
//             </div>
//           </div>

//           <div>
//             <div className="text-base font-semibold text-gray-800">
//               {displayName}
//             </div>
//             <div className="text-lg font-mono text-gray-700 tracking-wider">
//               {formatPhoneNumber(displayNumber)}
//             </div>
//           </div>

//           {/* Call Duration */}
//           <div className="flex flex-col items-center space-y-1">
//             <div className="text-2xl font-mono text-green-600 font-bold">
//               {formatDuration(callDuration)}
//             </div>
//             <div className="flex items-center space-x-2 text-sm">
//               <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
//                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                 <span>Connected</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Form Status */}
//         {isFormOpen && (
//           <div className="bg-blue-50 rounded-lg p-3 text-center">
//             <div className="text-sm text-blue-700 font-medium">
//               Call Remarks Form Open
//             </div>
//             <div className="text-xs text-blue-600 mt-1">
//               Complete the form to record call details
//             </div>
//           </div>
//         )}

//         {/* Call continues message */}
//         <div className="text-center">
//           <div className="text-xs text-gray-500">
//             Call is active on your phone
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Render call ended interface
//   const renderCallEndedInterface = () => {
//     if (callStatus !== CALL_STATUS.ENDED) return null;

//     return (
//       <div className="text-center space-y-3">
//         <div className="text-sm text-gray-600">Call Ended</div>
//         <div className="text-base font-medium text-gray-800">
//           Duration: {formatDuration(callDuration)}
//         </div>
//         {formData && (
//           <div className="text-xs text-blue-600">
//             Please complete the call remarks form
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Render connection status
//   // const renderConnectionStatus = () => {
//   //   if (!isReady()) {
//   //     return (
//   //       <div className="text-center space-y-3 py-4">
//   //         <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
//   //           <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
//   //         </div>
//   //         <div>
//   //           <div className="text-sm font-medium text-gray-700">
//   //             Connecting to Call Service...
//   //           </div>
//   //           <div className="text-xs text-gray-500 mt-1">
//   //             Status: {connectionStatus}
//   //           </div>
//   //         </div>
//   //       </div>
//   //     );
//   //   }

//   //   if (isCallIdle()) {
//   //     return (
//   //       <div className="text-center space-y-3 py-4">
//   //         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//   //           <PhoneIcon className="w-6 h-6 text-green-500" />
//   //         </div>
//   //         <div>
//   //           <div className="text-sm font-medium text-gray-700">
//   //             Ready for Calls
//   //           </div>
//   //           <div className="text-xs text-gray-500 mt-1">
//   //             Waiting for incoming calls...
//   //           </div>
//   //         </div>
//   //       </div>
//   //     );
//   //   }

//   //   return null;
//   // };

//   const headerInfo = getHeaderInfo();

//   return (
//     <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-72 overflow-hidden">
//       {/* Header */}
//       <div
//         className={`px-4 py-3 ${headerInfo.bgColor} border-b border-gray-100/50`}
//       >
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-2">
//             <div
//               className={`w-2 h-2 rounded-full ${headerInfo.indicatorColor} ${headerInfo.animation}`}
//             ></div>
//             <h3 className="text-sm font-medium text-gray-700">
//               {headerInfo.title}
//             </h3>
//             {/* Call Status Badge */}
//             {isCallRinging() && (
//               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
//                 Incoming
//               </span>
//             )}
//             {isCallConnected() && (
//               <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
//                 Active
//               </span>
//             )}
//           </div>

//           <div className="flex items-center space-x-2">
//             {/* Sound toggle button - only show during ringing */}
//             {isCallRinging() && (
//               <button
//                 onClick={toggleRingingSound}
//                 className={`p-1.5 rounded-full transition-all duration-200 ${
//                   isRingingSoundEnabled
//                     ? "text-gray-600 hover:bg-white/60"
//                     : "text-gray-400 bg-gray-100/50"
//                 }`}
//                 title={isRingingSoundEnabled ? "Disable sound" : "Enable sound"}
//               >
//                 {isRingingSoundEnabled ? (
//                   <SpeakerWaveIcon className="w-4 h-4" />
//                 ) : (
//                   <SpeakerXMarkIcon className="w-4 h-4" />
//                 )}
//               </button>
//             )}

//             {/* Close button - don't show during active calls */}
//             {!isCallActive() && (
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white/60 transition-all duration-200"
//               >
//                 <XMarkIcon className="w-4 h-4" />
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="p-4">
//         {/* Render different interfaces based on call status */}
//         {isCallRinging() && renderIncomingCallInterface()}
//         {isCallConnected() && renderConnectedCallInterface()}
//         {callStatus === CALL_STATUS.ENDED && renderCallEndedInterface()}
//         {/* {!isCallActive() && renderConnectionStatus()} */}
//         {!isCallActive()}

//         {/* Enhanced status display */}
//         {isCallActive() && (
//           <div className="mt-4 pt-3 border-t border-gray-100">
//             <div className="flex items-center justify-center">
//               <div
//                 className={`text-xs font-medium capitalize px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor()}`}
//               >
//                 <div
//                   className={`w-2 h-2 rounded-full ${getStatusColor().replace(
//                     "text-",
//                     "bg-"
//                   )}`}
//                 ></div>
//                 <span>{getStatusText()}</span>
//                 {isCallConnected() && (
//                   <span className="ml-1">• {formatDuration(callDuration)}</span>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Development debug info */}
//         {import.meta.env.NODE_ENV === "development" && (
//           <div className="mt-4 p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
//             <div className="font-medium mb-1">Debug Info:</div>
//             <div>Status: {callStatus}</div>
//             <div>Caller: {callerNumber || "None"}</div>
//             <div>Agent: {agentNumber || "None"}</div>
//             <div>Connection: {connectionStatus}</div>
//             <div>Form Open: {isFormOpen ? "Yes" : "No"}</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DialerPanel;


import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import {
  PhoneIcon,
  PhoneXMarkIcon,
  UserCircleIcon,
  ClockIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  BackspaceIcon,
} from "@heroicons/react/24/outline";
import CryptoJS from "crypto-js";

import useForm from "../../hooks/useForm";
import useDialer from "../../hooks/useDialer";
import { BASE_URL } from "../../library/constans";
import axios from "axios";
import SocketContext from "../../context/Dashboard/SocketContext";

const DialerPanel = ({ onClose, userData, setIsDialerOpen }) => {
  // New simplified contexts
  const {
    callStatus,
    callerNumber,
    agentNumber,
    callDuration,
    activeCallId,
    getCurrentSession,
    showIncomingCall,
    isCallActive,
    isCallRinging,
    isCallConnected,
    isCallIdle,
    formatDuration,
    getStatusColor,
    getStatusText,
    declineCall,
    CALL_STATUS,
    isOutgoingCallConnected,
    showOutgoingCall,
    isOutgoingCall,
    canMakeOutgoingCall,
    handleOutgoingConnected,
    handleOutgoingCallEnded,
    isOutgoingCallRinging,
    setCallStatus,
    isOutgoingCallEnded,
    setIsOutgoingCallEnded,
  } = useDialer();

  const { isFormOpen, formData, setIsFormOpen, setIsOutgoingFormOpen } = useForm();

  const {
    connectionStatus,
    isAgentRegistered,
    lastError,
    isConnected,
    isReady,
    initiateOutgoingCall
  } = useContext(SocketContext);

  const [isRingingSoundEnabled, setIsRingingSoundEnabled] = useState(true);
  const [dialedNumber, setDialedNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);

  // Audio refs for sounds
  const ringingAudioRef = useRef(null);

  // Initialize audio elements
  useEffect(() => {
    // Create ringing sound audio element
    ringingAudioRef.current = new Audio("/sounds/phone-ring.mp3");
    ringingAudioRef.current.loop = true;
    ringingAudioRef.current.volume = 0.7;
    ringingAudioRef.current.preload = "auto";

    // Handle audio loading errors with fallbacks
    const handleRingingError = () => {
      console.warn("Could not load phone-ring.mp3, using fallback sound");
      ringingAudioRef.current.src =
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCWO1fDQfCEEJJbN8Nw=";
    };

    ringingAudioRef.current.addEventListener("error", handleRingingError);
    ringingAudioRef.current.load();

    return () => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.removeEventListener(
          "error",
          handleRingingError
        );
        ringingAudioRef.current.pause();
        ringingAudioRef.current = null;
      }
    };
  }, []);

  //when outgoing-ended then outgoing ui should reset
  useEffect(() => {
    if (isOutgoingCallEnded) {
      setIsDialing(false);
      setIsDialerOpen(false);
      // Reset the flag so opening dialer works again
      setIsOutgoingCallEnded(false);
    }
  }, [isOutgoingCallEnded]);

  //open the form only when outgoing-connected
  useEffect(()=>{
    if(callStatus === "outgoing-connected"){
      setIsOutgoingFormOpen(true);
    }
  },[isOutgoingCallConnected()]);

  // Enhanced ringing sound management
  useEffect(() => {
    if (!ringingAudioRef.current || !isRingingSoundEnabled) return;

    const playRinging = async () => {
      try {
        if (isCallRinging()) {
          ringingAudioRef.current.currentTime = 0;
          ringingAudioRef.current.volume = 0.7;
          await ringingAudioRef.current.play();
        } else {
          ringingAudioRef.current.pause();
          ringingAudioRef.current.currentTime = 0;
        }
      } catch (error) {
        console.warn("Could not play ringing sound:", error.message);
      }
    };

    playRinging();

    return () => {
      if (ringingAudioRef.current) {
        ringingAudioRef.current.pause();
        ringingAudioRef.current.currentTime = 0;
      }
    };
  }, [callStatus, isRingingSoundEnabled, isCallRinging]);

  // Phone number formatting
  const formatPhoneNumber = (number) => {
    if (!number || typeof number !== "string") {
      return "";
    }

    const digitsOnly = number.replace(/\D/g, "");
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6)
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(
      3,
      6
    )}-${digitsOnly.slice(6, 10)}`;
  };

  // Handle number input
  const handleNumberInput = (digit) => {
    if (dialedNumber.replace(/\D/g, "").length < 10) {
      setDialedNumber(prev => prev + digit);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  // Handle clear all
  const handleClear = () => {
    setDialedNumber("");
  };

  // Handle make call
  const handleMakeCall = async () => {
    const cleanNumber = dialedNumber.replace(/\D/g, "");
    console.log("handleMakeCall", cleanNumber);

    if (cleanNumber.length < 10) {
      alert("Please enter a valid phone number (at least 10 digits)");
      return;
    }

    // Check if socket is ready
    if (!isReady()) {
      alert("Connection not ready. Please wait and try again.");
      return;
    }

    setCallStatus("outgoing-ringing");
    setIsDialing(true);
    setIsOutgoingFormOpen(true);

    try {
      // Use the SocketProvider method instead of direct API call
      const result = await initiateOutgoingCall(cleanNumber);

      if (result.success) {
        console.log("✅ Call initiated successfully:", result);

        // Store current call information
        // setCurrentCall({
        //   callId: result.callSessionId,
        //   sessionId: result.callSessionId,
        //   customerNumber: cleanNumber,
        //   agentNumber: userData.EmployeePhone,
        //   status: 'initiating',
        //   startTime: new Date().toISOString(),
        // });

        // UI will be updated automatically via webhook events
        // No need to manually update call status here - the webhook events will handle it

      } else {
        console.error("❌ Failed to initiate call:", result.error);
        alert(`Failed to make call: ${result.error}`);
        setCallStatus("idle");
        setIsDialing(false);
        setIsOutgoingFormOpen(false);
      }

    } catch (error) {
      console.error("❌ Error in handleMakeCall:", error);
      alert(`Failed to make call: ${error.message}`);
      setCallStatus("idle");
      setIsDialing(false);
      setIsOutgoingFormOpen(false);
    }
  };

  // Handle decline call
  const handleDeclineCall = () => {
    if (ringingAudioRef.current) {
      ringingAudioRef.current.pause();
      ringingAudioRef.current.currentTime = 0;
    }
    setIsDialing(false);
    declineCall();
  };

  // Toggle sound on/off
  const toggleRingingSound = () => {
    setIsRingingSoundEnabled(!isRingingSoundEnabled);
    if (!isRingingSoundEnabled && ringingAudioRef.current) {
      ringingAudioRef.current.pause();
      ringingAudioRef.current.currentTime = 0;
    }
  };

  // Keyboard handling for ESC key and number input
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // Don't allow closing dialer if incoming call is ringing
        if (!isCallRinging()) {
          onClose();
        }
      } else if (!isCallActive() && /^[0-9]$/.test(e.key)) {
        // Handle number key presses for dialer
        e.preventDefault();
        handleNumberInput(e.key);
      } else if (e.key === "Backspace" && !isCallActive()) {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Enter" && !isCallActive() && dialedNumber.replace(/\D/g, "").length >= 10) {
        e.preventDefault();
        handleMakeCall();
      }
    },
    [isCallRinging, onClose, isCallActive, dialedNumber]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Get header info based on call status
  const getHeaderInfo = () => {
    if (isCallRinging()) {
      return {
        title: "Incoming Call",
        bgColor: "bg-gradient-to-r from-blue-50/80 to-indigo-50/80",
        indicatorColor: "bg-blue-400",
        animation: "animate-ping",
      };
    } else if (isCallConnected() || isOutgoingCallConnected()) {
      return {
        title: "Active Call",
        bgColor: "bg-gradient-to-r from-green-50/80 to-emerald-50/80",
        indicatorColor: "bg-green-400",
        animation: "animate-pulse",
      };
    } else if (isDialing) {
      return {
        title: "Dialing...",
        bgColor: "bg-gradient-to-r from-yellow-50/80 to-orange-50/80",
        indicatorColor: "bg-yellow-400",
        animation: "animate-pulse",
      };
    }
    return {
      title: "Phone Dialer",
      bgColor: "bg-gradient-to-r from-slate-50/80 to-blue-50/80",
      indicatorColor: "bg-gray-400",
      animation: "",
    };
  };

  // Render dialer keypad
  const renderDialerKeypad = () => {
    const keypadButtons = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['*', '0', '#']
    ];

    return (
      <div className="space-y-3">
        {keypadButtons.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-3">
            {row.map((digit) => (
              <button
                key={digit}
                onClick={() => handleNumberInput(digit)}
                disabled={isDialing}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-lg font-semibold text-gray-700 transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {digit}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Render outgoing call interface
  const renderOutgoingDialerInterface = () => {
    if (isCallActive()) return null;

    return (
      <div className="space-y-4">
        {/* Number Display */}
        <div className="text-center space-y-2">
          <div className="bg-gray-50 rounded-lg p-3 min-h-[60px] flex items-center justify-center border-2 border-gray-100">
            <div className="text-xl font-mono text-gray-800 tracking-wider">
              {dialedNumber ? formatPhoneNumber(dialedNumber) : "Enter number"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-2">
            {dialedNumber && (
              <button
                onClick={handleBackspace}
                disabled={isDialing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-150 disabled:opacity-50"
                title="Backspace"
              >
                <BackspaceIcon className="w-5 h-5" />
              </button>
            )}
            {dialedNumber && (
              <button
                onClick={handleClear}
                disabled={isDialing}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-150 disabled:opacity-50"
                title="Clear"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Keypad */}
        {renderDialerKeypad()}

        {/* Call Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleMakeCall}
            disabled={dialedNumber.replace(/\D/g, "").length < 10 || isDialing}
            className="px-8 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center space-x-2 min-w-[120px] justify-center"
            title={
              dialedNumber.replace(/\D/g, "").length < 10
                ? "Enter at least 10 digits"
                : isDialing ? "Dialing..." : "Make Call"
            }
          >
            {isDialing ? (
              <>
                {isOutgoingCallConnected() ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connected</span>
                  </>
                ) : (<>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Dialing...</span>
                </>)}
              </>
            ) : (
              <>
                <PhoneIcon className="w-5 h-5" />
                <span>Call</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>Enter a phone number to make an outgoing call</p>
          <p className="text-gray-400">Use keyboard numbers or click the keypad</p>
        </div>
      </div>
    );
  };

  //shows when outgoing call ringing/initiated
  const renderOutgoingCallInterface = () => {
    // Show only when actively dialing and call is not yet connected or ringing
    if (!isOutgoingCallRinging()) return null;

    return (
      <div className="space-y-4">
        {/* Avatar & Spinner */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="relative">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-yellow-200">
              <UserCircleIcon className="w-10 h-10 text-yellow-600" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              {/* <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div> */}
            </div>
          </div>
          <div className="text-sm font-semibold text-yellow-700">
            Calling {formatPhoneNumber(dialedNumber)}
          </div>
        </div>

        {/* Call status */}
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium animate-pulse">
            Outgoing Call...
          </span>
        </div>

        {/* Hangup button */}
        {/* <div className="flex justify-center pt-2">
          <button
            onClick={handleDeclineCall} // re-using decline handler for hangup
            className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg flex items-center space-x-2"
            title="Hang Up"
          >
            <PhoneXMarkIcon className="w-5 h-5" />
            <span>Hang Up</span>
          </button>
        </div> */}

        {/* Info text */}
        <div className="text-center text-xs text-gray-500">
          Placing your call... Please wait while we connect.
        </div>
      </div>
    );
  };

  // Render outgoing call when connected
  const renderOutgoingConnectedInterface = () => {
    if (!isOutgoingCallConnected()) return null;

    const displayNumber = dialedNumber || "Unknown Number";

    return (
      <div className="space-y-4">
        {/* Connected Call Info */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
              <UserCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div>
            <div className="text-base font-semibold text-gray-800">
              Outgoing Call Connected
            </div>
            <div className="text-lg font-mono text-gray-700 tracking-wider">
              {formatPhoneNumber(displayNumber)}
            </div>
          </div>

          {/* Call Duration */}
          <div className="flex flex-col items-center space-y-1">
            {/* <div className="text-2xl font-mono text-green-600 font-bold">
            {formatDuration(callDuration)}
          </div> */}
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Status */}
        {isFormOpen && (
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-700 font-medium">
              Call Remarks Form Open
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Complete the form to record call details
            </div>
          </div>
        )}

        {/* Hangup Button */}
        {/* <div className="flex justify-center pt-2">
        <button
          onClick={handleDeclineCall}
          className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg flex items-center space-x-2"
          title="Hang Up"
        >
          <PhoneXMarkIcon className="w-5 h-5" />
          <span>Hang Up</span>
        </button>
      </div> */}

        {/* Info text */}
        <div className="text-center text-xs text-gray-500">
          Call is active on your phone
        </div>
      </div>
    );
  };

  // Render incoming call interface
  const renderIncomingCallInterface = () => {
    if (!isCallConnected()) return null;

    const displayNumber = callerNumber || "Unknown Number";
    const displayName = "Unknown Caller"; // Can be enhanced with contact lookup

    return (
      <div className="space-y-4">
        {/* Caller Info */}
        <div className="text-center space-y-3">
          {/* Avatar with Ringing Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-200">
                <UserCircleIcon className="w-12 h-12 text-blue-500" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-blue-400 animate-ping"></div>
            </div>
          </div>

          {/* Caller Name and Number */}
          <div>
            <div className="text-lg font-semibold text-gray-800 mb-1">
              {displayName}
            </div>
            <div className="text-xl font-mono text-gray-700 tracking-wider">
              {formatPhoneNumber(displayNumber)}
            </div>
          </div>

          {/* Call Status */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium animate-pulse">
                {isRingingSoundEnabled && (
                  <SpeakerWaveIcon className="w-4 h-4 animate-pulse" />
                )}
                <PhoneIcon className="w-4 h-4 animate-bounce" />
                <span>Phone Ringing...</span>
              </div>
            </div>

            {/* Instruction Text */}
            <div className="text-xs text-gray-600 text-center px-4">
              <p className="font-medium">Answer the call on your phone</p>
              <p className="text-gray-500 mt-1">
                The system will automatically connect when you pick up
              </p>
            </div>

            {/* Session Info */}
            {getCurrentSession()?.sessionId && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-center space-x-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>
                    Session: {getCurrentSession().sessionId.slice(-8)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decline Button */}
        <div className="flex justify-center">
          <button
            onClick={handleDeclineCall}
            className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg flex items-center space-x-2"
            title="Decline Call"
          >
            <PhoneXMarkIcon className="w-5 h-5" />
            <span>Decline</span>
          </button>
        </div>
      </div>
    );
  };

  // Render connected call interface
  const renderConnectedCallInterface = () => {
    if (!isCallConnected()) return null;

    const displayNumber = callerNumber || dialedNumber || "Unknown Number";
    const displayName = "Connected Call";

    return (
      <div className="space-y-4">
        {/* Connected Call Info */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200">
              <UserCircleIcon className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div>
            <div className="text-base font-semibold text-gray-800">
              {displayName}
            </div>
            <div className="text-lg font-mono text-gray-700 tracking-wider">
              {formatPhoneNumber(displayNumber)}
            </div>
          </div>

          {/* Call Duration */}
          <div className="flex flex-col items-center space-y-1">
            <div className="text-2xl font-mono text-green-600 font-bold">
              {formatDuration(callDuration)}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Status */}
        {isFormOpen && (
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-sm text-blue-700 font-medium">
              Call Remarks Form Open
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Complete the form to record call details
            </div>
          </div>
        )}

        {/* Call continues message */}
        <div className="text-center">
          <div className="text-xs text-gray-500">
            Call is active on your phone
          </div>
        </div>
      </div>
    );
  };

  // Render call ended interface
  const renderCallEndedInterface = () => {
    if (callStatus !== CALL_STATUS.ENDED) return null;

    return (
      <div className="text-center space-y-3">
        <div className="text-sm text-gray-600">Call Ended</div>
        <div className="text-base font-medium text-gray-800">
          Duration: {formatDuration(callDuration)}
        </div>
        {formData && (
          <div className="text-xs text-blue-600">
            Please complete the call remarks form
          </div>
        )}
      </div>
    );
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-80 overflow-hidden">
      {/* Header */}
      <div
        className={`px-4 py-3 ${headerInfo.bgColor} border-b border-gray-100/50`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${headerInfo.indicatorColor} ${headerInfo.animation}`}
            ></div>
            <h3 className="text-sm font-medium text-gray-700">
              {headerInfo.title}
            </h3>
            {/* Call Status Badge */}
            {isCallRinging() && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Incoming
              </span>
            )}
            {isOutgoingCallRinging() && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Outgoing
              </span>
            )}
            {(isCallConnected() || isOutgoingCallConnected()) && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
            {isDialing && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                Dialing
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Sound toggle button - only show during ringing */}
            {isCallRinging() && (
              <button
                onClick={toggleRingingSound}
                className={`p-1.5 rounded-full transition-all duration-200 ${isRingingSoundEnabled
                    ? "text-gray-600 hover:bg-white/60"
                    : "text-gray-400 bg-gray-100/50"
                  }`}
                title={isRingingSoundEnabled ? "Disable sound" : "Enable sound"}
              >
                {isRingingSoundEnabled ? (
                  <SpeakerWaveIcon className="w-4 h-4" />
                ) : (
                  <SpeakerXMarkIcon className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Close button - don't show during active calls */}
            {!isCallActive() && !isDialing && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-white/60 transition-all duration-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      {!isCallActive() && !isDialing && renderOutgoingDialerInterface()}

      {isOutgoingCallRinging() && renderOutgoingCallInterface()}
      {isOutgoingCallConnected() && renderOutgoingConnectedInterface()}

      {/* Main Content */}
      <div className="p-4">
        {/* Render different interfaces based on call status */}
        {isCallRinging() && renderIncomingCallInterface()}
        {isCallConnected() && renderConnectedCallInterface()}
        {callStatus === CALL_STATUS.ENDED && renderCallEndedInterface()}




        {/* Enhanced status display */}
        {(isCallActive() || isDialing) && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-center">
              <div
                className={`text-xs font-medium capitalize px-2 py-1 rounded-full flex items-center space-x-1 ${getStatusColor()}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${getStatusColor().replace(
                    "text-",
                    "bg-"
                  )}`}
                ></div>
                <span>{isDialing ? "Dialing" : getStatusText()}</span>
                {isCallConnected() && (
                  <span className="ml-1">• {formatDuration(callDuration)}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Development debug info */}
        {import.meta.env.NODE_ENV === "development" && (
          <div className="mt-4 p-2 bg-gray-100 rounded-lg text-xs text-gray-600">
            <div className="font-medium mb-1">Debug Info:</div>
            <div>Status: {callStatus}</div>
            <div>Caller: {callerNumber || "None"}</div>
            <div>Agent: {agentNumber || "None"}</div>
            <div>Dialed: {dialedNumber || "None"}</div>
            <div>Form Open: {isFormOpen ? "Yes" : "No"}</div>
            <div>Is Dialing: {isDialing ? "Yes" : "No"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DialerPanel;
