import { useContext, useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { MdDialpad } from "react-icons/md";
import {
  PhoneXMarkIcon,
  PhoneIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

// New context imports
import UserContext from "../context/User/UserContext";
import AuthContext from "../context/User/AuthContext";
import DialerContext from "../context/Dashboard/DialerContext";
import SocketContext from "../context/Dashboard/SocketContext";

import DialerPanel from "../components/Dialer/DialerPanel";
import DialerPadComponent from "./DialerPad/DialerPadComponent";

const Header = ({ collapsed, setCollapsed }) => {
  const { userData, clearUser } = useContext(UserContext);
  const { logout } = useContext(AuthContext);

  // New simplified contexts
  const {
    callStatus,
    callerNumber,
    agentNumber,
    callDuration,
    showIncomingCall,
    isCallActive,
    isCallRinging,
    isCallConnected,
    formatDuration,
    getStatusColor,
    getStatusText,
    declineCall,
    CALL_STATUS,
  } = useContext(DialerContext);

  const {
    connectionStatus,
    isAgentRegistered,
    lastError,
    isConnected,
    isReady,
    initiateOutgoingCall
  } = useContext(SocketContext);


  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDialerOpen, setIsDialerOpen] = useState(false);
  const menuRef = useRef(null);
  const dialerContainerRef = useRef(null);

  const showDialer = userData?.EmployeeRole !== 2;

  const navigate = useNavigate();

  // Click outside detection for user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Click outside detection for dialer
  useEffect(() => {
    const handleDialerClickOutside = (event) => {
      if (
        dialerContainerRef.current &&
        !dialerContainerRef.current.contains(event.target)
      ) {
        // Don't auto-close dialer if incoming call is ringing
        if (!isCallRinging()) {
          setIsDialerOpen(false);
        }
      }
    };

    if (isDialerOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleDialerClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleDialerClickOutside);
      };
    }
  }, [isDialerOpen, isCallRinging]);

  // Auto-open dialer for incoming calls
  useEffect(() => {
    if (showIncomingCall && !isDialerOpen) {
      setIsDialerOpen(true);
    }
  }, [showIncomingCall]);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return "JD";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleName = (roleId) => {
    const roles = {
      1: "Calling Agent",
      2: "Manager",
    };
    return roles[roleId] || "User";
  };

  const handleMenuItemClick = (action) => {
    setIsMenuOpen(false);
    switch (action) {
      case "profile":
        navigate("/dashboard/profile");
        break;
      case "logout":
        clearUser();
        logout();
        navigate("/");
        break;
      default:
        break;
    }
  };

  const toggleDialer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialerOpen(!isDialerOpen);
  };

  const closeDialer = () => {
    // Don't allow closing dialer if incoming call is ringing
    if (isCallRinging()) {
      return;
    }
    setIsDialerOpen(false);
  };

  // Get call status styling
  const getCallStatusInfo = () => {
    const baseInfo = {
      text: callerNumber || "Unknown",
      statusText: getStatusText(),
      color: getStatusColor(),
    };

    switch (callStatus) {
      case CALL_STATUS.RINGING:
        return {
          ...baseInfo,
          text: `Incoming: ${callerNumber}`,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          pulseColor: "bg-blue-400",
        };
      case CALL_STATUS.CONNECTED:
        return {
          ...baseInfo,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          pulseColor: "bg-green-400",
        };
      case CALL_STATUS.ENDED:
        return {
          ...baseInfo,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          pulseColor: "bg-gray-400",
        };
      default:
        return {
          ...baseInfo,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          pulseColor: "bg-gray-400",
        };
    }
  };

  // Connection status indicator
  const getConnectionStatusInfo = () => {
    if (!isConnected()) {
      return {
        color: "text-red-500",
        icon: "❌",
        text: "Disconnected",
        bgColor: "bg-red-50",
      };
    }

    if (!isAgentRegistered) {
      return {
        color: "text-yellow-500",
        icon: "⏳",
        text: "Connecting...",
        bgColor: "bg-yellow-50",
      };
    }

    return {
      color: "text-green-500",
      icon: "✅",
      text: "Ready",
      bgColor: "bg-green-50",
    };
  };

  // Render incoming call controls
  const renderIncomingCallControls = () => {
    if (!isCallRinging()) return null;

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={declineCall}
          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
          title="Decline Call"
        >
          <PhoneXMarkIcon className="w-4 h-4" />
        </button>

        <div className="px-3 py-2 bg-blue-500 text-white rounded-lg flex items-center space-x-2 text-sm shadow-lg animate-pulse">
          <PhoneIcon className="w-4 h-4" />
          <span>Answer on Phone</span>
        </div>
      </div>
    );
  };

  const statusInfo = getCallStatusInfo();
  const connectionInfo = getConnectionStatusInfo();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#99CBEA] rounded-lg flex items-center justify-center text-white font-bold">
              <img src="/icon-512.png" alt="logo" />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">
              ABIS PRO CRM
            </h1>
          </div>
        </div>

        {/* Right side - Connection Status, Call Status, Dialer, User menu */}
        <div className="flex items-center space-x-4">
          {/* Connection Status Indicator */}
          <div
            className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${connectionInfo.bgColor}`}
            title={lastError || connectionInfo.text}
          >
            <WifiIcon className={`w-4 h-4 ${connectionInfo.color}`} />
            <span className={`text-xs font-medium ${connectionInfo.color}`}>
              {connectionInfo.text}
            </span>
          </div>

          {/* Call Status Display */}
          {isCallActive() && (
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center space-x-3 px-3 py-2 ${
                  statusInfo.bgColor
                } rounded-lg border ${statusInfo.borderColor} ${
                  isCallRinging() ? "animate-pulse" : ""
                }`}
              >
                <div className="relative">
                  <div
                    className={`w-2 h-2 rounded-full ${statusInfo.color.replace(
                      "text-",
                      "bg-"
                    )}`}
                  ></div>
                  {isCallRinging() && (
                    <div
                      className={`absolute inset-0 w-2 h-2 rounded-full ${statusInfo.pulseColor} animate-ping`}
                    ></div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">
                    {statusInfo.text}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.statusText}
                    </span>
                    {isCallConnected() && (
                      <span className="text-xs text-gray-500">
                        {formatDuration(callDuration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Incoming Call Quick Controls */}
              {renderIncomingCallControls()}
            </div>
          )}

          {/* Dialer Button */}
          {showDialer && (<div className="relative" ref={dialerContainerRef}>
            <button
              onClick={toggleDialer}
              className={`
                relative p-2 rounded-full transition-all duration-200
                ${
                  isCallActive()
                    ? `${statusInfo.color.replace(
                        "text-",
                        "bg-"
                      )} text-white shadow-md`
                    : "bg-[#99CBEA] hover:bg-[#e7827d] text-white shadow-md"
                }
                ${!isReady() ? "opacity-50 cursor-not-allowed" : ""}
              `}
              title={
                !isReady()
                  ? "Connecting to call service..."
                  : isCallActive()
                  ? `Call ${callStatus}`
                  : "Open Dialer"
              }
              disabled={!isReady()}
            >
              <MdDialpad className="w-5 h-5" />

              {/* Active call indicator */}
              {isCallActive() && (
                <div className="absolute -top-1 -right-1">
                  <div
                    className={`w-3 h-3 ${statusInfo.pulseColor} rounded-full ${
                      isCallRinging() ? "animate-pulse" : ""
                    }`}
                  ></div>
                  {isCallRinging() && (
                    <div
                      className={`absolute inset-0 w-3 h-3 ${statusInfo.pulseColor} rounded-full animate-ping`}
                    ></div>
                  )}
                </div>
              )}
            </button>

            {/* Dialer Panel */}
            {isDialerOpen && isReady() && (
              <div className="absolute top-full -right-40 mt-2 z-50">
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200">
                  <DialerPanel onClose={closeDialer} setIsDialerOpen={setIsDialerOpen} userData={userData} />
                </div>
              </div>
            )}
          </div>)}

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-semibold text-white">
                  {getInitials(userData?.EmployeeName)}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-sm font-medium text-gray-700">
                  {userData?.EmployeeName}
                </span>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  {getRoleName(userData?.EmployeeRole)}
                </span>
              </div>

              <IoIosArrowDown
                className={`w-4 h-4 text-gray-500 ml-1 transition-transform duration-200 ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-semibold text-white">
                        {getInitials(userData?.EmployeeName)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {userData?.EmployeeName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userData?.EmployeeMailId}
                      </p>
                      <p className="text-xs text-gray-800 font-medium">
                        ID: {userData?.EmployeeId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => handleMenuItemClick("profile")}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FaUserCircle className="w-4 h-4 text-gray-500" />
                    <span>View Profile</span>
                  </button>
                </div>

                {/* Logout Section */}
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => handleMenuItemClick("logout")}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
