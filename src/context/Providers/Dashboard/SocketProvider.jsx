import { useState, useEffect, useRef, useContext } from "react";
import { io } from "socket.io-client";
import SocketContext from "../../Dashboard/SocketContext";
import DialerContext from "../../Dashboard/DialerContext";
import UserContext from "../../User/UserContext";
import { BASE_URL } from "../../../library/constans";

const SocketProvider = ({ children }) => {
  // Socket connection state
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [isAgentRegistered, setIsAgentRegistered] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Contexts
  const { userData } = useContext(UserContext);
  const dialerContext = useContext(DialerContext);

  // Refs
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Environment
  const baseUrl = import.meta.env.VITE_API_URL;
  const socketUrl = baseUrl.replace("/api", "");

  // Initialize socket connection
  const initializeSocket = () => {
    if (!userData?.EmployeePhone || !userData?.EmployeeId) {
      console.error("❌ No user data for socket connection");
      setLastError("User data required for connection");
      return;
    }

    try {
      console.log("🔌 Initializing socket connection to:", socketUrl);
      setConnectionStatus("connecting");
      setLastError(null);

      // Cleanup existing connection
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Create new socket connection
      const newSocket = io(socketUrl, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Setup event listeners
      setupSocketEventListeners(newSocket);
    } catch (error) {
      console.error("❌ Socket initialization failed:", error);
      setConnectionStatus("error");
      setLastError(`Connection failed: ${error.message}`);
      scheduleReconnect();
    }
  };

  // Setup all socket event listeners
  const setupSocketEventListeners = (socketInstance) => {
    // Connection events
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected:", socketInstance.id);
      setConnectionStatus("connected");
      setLastError(null);
      setReconnectAttempts(0);

      // Register agent immediately
      registerAgent(socketInstance);

      // Start heartbeat
      startHeartbeat(socketInstance);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setConnectionStatus("error");
      setLastError(`Connection error: ${error.message}`);
      setIsAgentRegistered(false);
      scheduleReconnect();
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setConnectionStatus("disconnected");
      setIsAgentRegistered(false);
      stopHeartbeat();

      // Auto-reconnect for server disconnects
      if (reason === "io server disconnect") {
        scheduleReconnect();
      }
    });

    // Agent registration events
    socketInstance.on("registration-confirmed", (data) => {
      console.log("✅ Agent registration confirmed:", data);
      setIsAgentRegistered(true);
    });

    // Call webhook events - Main integration point
    socketInstance.on("incoming-call-ringing", (data) => {
      console.log("📞 INCOMING CALL RINGING:", data);
      handleIncomingCallRinging(data);
    });

    socketInstance.on("call-answered", (data) => {
      console.log("✅ CALL ANSWERED:", data);
      handleCallAnswered(data);
    });

    socketInstance.on("call-disconnected", (data) => {
      console.log("📱 CALL DISCONNECTED:", data);
      handleCallDisconnected(data);
    });

    // ========== OUTGOING CALL EVENTS (FROM WEBHOOK) ==========
    
    // When outgoing call is initiated (CalledNumber webhook event)
    socketInstance.on("outgoing-call-initiated", (data) => {
      console.log("📞 OUTGOING CALL INITIATED (WEBHOOK):", data);
      handleOutgoingCallInitiated(data);
    });

    // When customer answers the outgoing call (Answer webhook event)
    socketInstance.on("outgoing-call-connected", (data) => {
      console.log("✅ OUTGOING CALL ANSWERED (WEBHOOK):", data);
      handleOutgoingCallAnswered(data);
    });

    // When outgoing call is disconnected (Disconnected webhook event)
    socketInstance.on("outgoing-call-disconnected", (data) => {
      console.log("📱 OUTGOING CALL DISCONNECTED (WEBHOOK):", data);
      handleOutgoingCallDisconnected(data);
    });

    // When agent disconnects the call from his side
    socketInstance.on("outgoing-call-not-reachable", (data) => {
      console.log("📱 OUTGOING CALL NOT REACHABLE (WEBHOOK):", data);
      handleOutgoingCallNotReachable(data);
    });

    //--------------------------------------------------------------------

    // Legacy event support (if needed)
    socketInstance.on("incoming-call-event", (data) => {
      console.log("📡 LEGACY CALL EVENT:", data);
      handleLegacyCallEvent(data);
    });

    // Error handling
    socketInstance.on("error", (error) => {
      console.error("❌ Socket error:", error);
      setLastError(`Socket error: ${error.message || error}`);
    });

    // Heartbeat response
    socketInstance.on("pong", (data) => {
      console.log("💓 Heartbeat response received");
    });
  };

  // Register agent with server
  const registerAgent = (socketInstance) => {
    if (!userData?.EmployeePhone || !userData?.EmployeeId) {
      console.error("❌ Cannot register agent - missing user data");
      return;
    }
 
    const registrationData = {
      agentNumber: userData.EmployeePhone,
      employeeId: userData.EmployeeId,
      employeeName: userData.EmployeeName || "Unknown Agent",
      capabilities: ["incoming", "outgoing"],
    };

    console.log("👤 Registering agent for incoming & outgoing calls:", registrationData);
    socketInstance.emit("register-agent", registrationData);
  };

  // Handle incoming call ringing event
  const handleIncomingCallRinging = (eventData) => {
    // Validate this event is for current agent
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("📞 Ringing event not for this agent, ignoring");
      return;
    }

    console.log("📞 Processing ringing for current agent");

    // Call dialer handler
    if (dialerContext?.handleIncomingCall) {
      dialerContext.handleIncomingCall({
        callId: eventData.callId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        timestamp: eventData.timestamp,
        eventType: "ringing",
        direction: "incoming",
      });
    } else {
      console.error("❌ Dialer context not available for ringing event");
    }
  };

  // Handle call answered event
  const handleCallAnswered = (eventData) => {
    // Validate this event is for current agent
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("✅ Answer event not for this agent, ignoring");
      return;
    }

    console.log("✅ Processing answer for current agent");

    // Call dialer handler
    if (dialerContext?.handleCallAnswered) {
      dialerContext.handleCallAnswered({
        callId: eventData.callId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        timestamp: eventData.timestamp,
        eventType: "answered",
        direction: "incoming",
      });
    } else {
      console.error("❌ Dialer context not available for answer event");
    }
  };

  // Handle call disconnected event
  const handleCallDisconnected = (eventData) => {
    // Validate this event is for current agent
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("📱 Disconnect event not for this agent, ignoring");
      return;
    }

    console.log("📱 Processing disconnect for current agent");

    // Call dialer handler
    if (dialerContext?.handleCallEnded) {
      dialerContext.handleCallEnded({
        callId: eventData.callId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        disconnectedBy: eventData.disconnectedBy,
        causeCode: eventData.causeCode,
        causeDescription: eventData.causeDescription,
        timestamp: eventData.timestamp,
        eventType: "disconnected",

      });
    } else {
      console.error("❌ Dialer context not available for disconnect event");
    }
  };

  // ========== OUTGOING CALL HANDLERS ==========

  const handleOutgoingCallInitiated = (eventData) => {
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("📞 Outgoing initiation not for this agent, ignoring");
      return;
    }

    console.log("📞 Processing outgoing call initiation for current agent");

    if (dialerContext?.initiateOutgoingCall) {
      dialerContext.initiateOutgoingCall({
        callId: eventData.callId,
        sessionId: eventData.sessionId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        timestamp: eventData.timestamp,
        eventType: "initiated",
        direction: "outgoing",
        callStatus: eventData.callStatus,
        message: eventData.message,
        sessionData: eventData.sessionData,
      });
    } else {
      console.error("❌ Dialer context not available for outgoing initiation");
    }
  };

  const handleOutgoingCallAnswered = (eventData) => {
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("✅ Outgoing answer not for this agent, ignoring");
      return;
    }

    console.log("✅ Processing outgoing call answered for current agent");

    if (dialerContext?.handleOutgoingConnected) {
      dialerContext.handleOutgoingConnected({
        callId: eventData.callId,
        sessionId: eventData.sessionId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        timestamp: eventData.timestamp,
        eventType: "answered",
        direction: "outgoing",
        callStatus: eventData.callStatus,
        message: eventData.message,
        sessionData: eventData.sessionData,
      });
    } else {
      console.error("❌ Dialer context not available for outgoing answer");
    }
  };

  const handleOutgoingCallDisconnected = (eventData) => {
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("📱 Outgoing disconnect not for this agent, ignoring");
      return;
    }

    console.log("📱 Processing outgoing call disconnected for current agent");

    if (dialerContext?.handleOutgoingCallEnded) {
      dialerContext.handleOutgoingCallEnded({
        callId: eventData.callId,
        sessionId: eventData.sessionId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        disconnectedBy: eventData.disconnectedBy,
        causeCode: eventData.causeCode,
        causeDescription: eventData.causeDescription,
        timestamp: eventData.timestamp,
        eventType: "disconnected",
        direction: "outgoing",
        callStatus: eventData.callStatus,
        message: eventData.message,
        sessionData: eventData.sessionData,
      });
    } else {
      console.error("❌ Dialer context not available for outgoing disconnect");
    }
  };

  const handleOutgoingCallNotReachable = (eventData) => {
    if (eventData.agentPhoneNumber !== userData?.EmployeePhone) {
      console.log("📱 Outgoing not reachable not for this agent, ignoring");
      return;
    }

    console.log("📱 Processing outgoing call not reachable for current agent");

    if (dialerContext?.handleOutgoingNotReachable) {
      dialerContext.handleOutgoingNotReachable({
        callId: eventData.callId,
        sessionId: eventData.sessionId,
        customerPhoneNumber: eventData.customerPhoneNumber,
        agentPhoneNumber: eventData.agentPhoneNumber,
        disconnectedBy: eventData.disconnectedBy,
        causeCode: eventData.causeCode,
        causeDescription: eventData.causeDescription,
        timestamp: eventData.timestamp,
        eventType: "not_reachable",
        direction: "outgoing",
        callStatus: eventData.callStatus,
        message: eventData.message,
        sessionData: eventData.sessionData,
      });
    } else {
      console.error("❌ Dialer context not available for outgoing not reachable");
    }
  };

  //-----------------------------------------------------------------------------------------------------------

  // Handle legacy call events (backward compatibility)
  const handleLegacyCallEvent = (eventData) => {
    if (!eventData.eventType || eventData.eventType !== "CALL") {
      return;
    }

    const { event, agentPhoneNumber, customerPhoneNumber, callId } = eventData;

    // Only process if for current agent
    if (agentPhoneNumber !== userData?.EmployeePhone) {
      return;
    }

    console.log("📡 Processing legacy event:", event);

    switch (event?.toLowerCase()) {
      case "ringing":
        handleIncomingCallRinging(eventData);
        break;
      case "answered":
      case "answer":
        handleCallAnswered(eventData);
        break;
      case "disconnected":
        handleCallDisconnected(eventData);
        break;
      default:
        console.log("📡 Unhandled legacy event:", event);
    }
  };

  // ========== OUTGOING CALL METHODS ==========
  
  // Method to initiate an outgoing call via your existing API
  const initiateOutgoingCall = async (customerPhoneNumber, campaignId = null, leadData = null) => {
    if (!socket || !socket.connected) {
      console.error("❌ Cannot initiate call - socket not connected");
      return { success: false, error: "Socket not connected" };
    }

    if (!isAgentRegistered) {
      console.error("❌ Cannot initiate call - agent not registered");
      return { success: false, error: "Agent not registered" };
    }

    if (!customerPhoneNumber) {
      console.error("❌ Cannot initiate call - customer phone number required");
      return { success: false, error: "Customer phone number required" };
    }

    if (!userData?.EmployeePhone || !userData?.EmployeeId) {
      console.error("❌ Cannot initiate call - missing agent data");
      return { success: false, error: "Missing agent data" };
    }

    // Clean the phone number (remove non-digits)
    const cleanNumber = customerPhoneNumber.replace(/\D/g, "");
    
    if (cleanNumber.length < 10) {
      console.error("❌ Invalid phone number - must be at least 10 digits");
      return { success: false, error: "Invalid phone number - must be at least 10 digits" };
    }

    const payload = {
      from: userData.EmployeePhone,              // your agent number (logged-in user)
      to: cleanNumber,                          // customer number entered in dialer
      caller_id: "1409766901",                  // Airtel-provided caller ID
      to_caller_id: "1409766901",               // Airtel-provided caller ID for customer
      record: true,
      early_media: true,
      retry: {
        count: 1,
      },
      callbacks: [
        {
          event_type: "CDR",
          notify_url: `https://crm-abispro-api.abisibg.com/api/webhook/cdr-event`,
          method: "POST"
        },
        {
          event_type: "ALL",
          notify_url: `https://crm-abispro-api.abisibg.com/api/webhook/call-event`,
          method: "POST"
        }
      ],
      
    };

    try {
      console.log("📞 Initiating outgoing call via existing API:", payload);

      // Make API call using your existing endpoint
      const response = await fetch(`${BASE_URL}/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      console.log("✅ Outgoing call API response:", result);

      // Extract call information from your API response
      const callData = {
        success: true,
        data: result,
        callId: result.callSessionId || result.callSessionId || `call_${Date.now()}`, // Adjust based on your API response structure
        sessionId: result.callSessionId ,
        customerPhoneNumber: cleanNumber,
        agentPhoneNumber: userData.EmployeePhone,
        status: result.status || 'initiated',
        message: result.message || "Call initiated successfully",
        timestamp: new Date().toISOString(),
        // Include any additional data from your API response
        callDetails: result,
      };

      // Optional: Emit socket event for immediate UI feedback
      socket.emit("outgoing-call-initiated", {
        ...payload,
        callId: callData.callId,
        timestamp: callData.timestamp,
      });

      // Notify DialerContext about call initiation
      if (dialerContext?.initiateOutgoingCall) {
        dialerContext.initiateOutgoingCall({
          callId: callData.callId,
          sessionId: callData.sessionId,
          customerPhoneNumber: callData.customerPhoneNumber,
          agentPhoneNumber: callData.agentPhoneNumber,
          timestamp: callData.timestamp,
          eventType: "initiated",
          direction: "outgoing",
          callStatus: "initiating",
          message: "Call request sent to telephony system",
          apiResponse: result,
        });
      }

      return callData;

    } catch (error) {
      console.error("❌ Error initiating outgoing call:", error);
      
      // Notify DialerContext about call failure
      if (dialerContext?.handleOutgoingCallFailed) {
        dialerContext.handleOutgoingCallFailed({
          customerPhoneNumber: cleanNumber,
          agentPhoneNumber: userData.EmployeePhone,
          errorMessage: error.message,
          timestamp: new Date().toISOString(),
          eventType: "failed",
          direction: "outgoing",
          callStatus: "failed",
        });
      }

      return {
        success: false,
        error: error.message || "Failed to initiate call",
        details: error,
        customerPhoneNumber: cleanNumber,
        agentPhoneNumber: userData.EmployeePhone,
      };
    }
  };

  const outgoingCallConnected = () => {};

  // Method to cancel an outgoing call
  const cancelOutgoingCall = (callId) => {
    if (!socket || !socket.connected || !callId) {
      console.error("❌ Cannot cancel call - invalid state or callId");
      return false;
    }

    console.log("❌ Cancelling outgoing call:", callId);
    socket.emit("cancel-outgoing-call", {
      callId,
      agentPhoneNumber: userData.EmployeePhone,
      timestamp: new Date().toISOString(),
    });
    return true;
  };

 

  //-----------------------------------------------------------------------------------------------
  
  // ========== UTILITY METHODS ==========

  // Start heartbeat to keep connection alive
  const startHeartbeat = (socketInstance) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketInstance && socketInstance.connected) {
        socketInstance.emit("ping");
      }
    }, 30000); // Every 30 seconds
  };

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Schedule reconnection attempt
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s

    console.log(
      `🔄 Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts((prev) => prev + 1);
      initializeSocket();
    }, delay);
  };

  // Manually reconnect
  const reconnect = () => {
    console.log("🔄 Manual reconnection requested");
    setReconnectAttempts(0);
    initializeSocket();
  };

  // Disconnect socket
  const disconnect = () => {
    console.log("🔌 Disconnecting socket");

    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setConnectionStatus("disconnected");
    setIsAgentRegistered(false);
    setReconnectAttempts(0);
  };

  // Get connection stats
  const getConnectionStats = () => {
    return {
      status: connectionStatus,
      isRegistered: isAgentRegistered,
      socketId: socket?.id || null,
      agentPhone: userData?.EmployeePhone || null,
      reconnectAttempts,
      lastError,
    };
  };

  // Initialize socket when user data is available
  useEffect(() => {
    let isMounted = true;
    if (userData?.EmployeePhone && userData?.EmployeeId && isMounted) {
      initializeSocket();
    }

    return () => {
      isMounted = false;
      disconnect();
    };
  }, [userData?.EmployeePhone, userData?.EmployeeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    // Connection state
    socket,
    connectionStatus,
    isAgentRegistered,
    lastError,
    reconnectAttempts,

    // Connection methods
    reconnect,
    disconnect,
    getConnectionStats,

    // Outgoing call methods
    initiateOutgoingCall,
    cancelOutgoingCall,
    

    // Helper methods
    isConnected: () => connectionStatus === "connected",
    isReady: () => connectionStatus === "connected" && isAgentRegistered,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
