import { useState, useEffect, useRef } from "react";
import DialerContext from "../../Dashboard/DialerContext";

export const CALL_STATUS = {
  IDLE: "idle",
  RINGING: "ringing",
  CONNECTED: "connected",
  ENDED: "ended",
  OUTGOING_RINGING: "outgoing-ringing",
  OUTGOING_CONNECTED: "outgoing-connected",
  OUTGOING_DISCONNECTED: "outgoing-ended"
};

const DialerProvider = ({ children }) => {
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  const [callSessions, setCallSessions] = useState(new Map());
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showOutgoingCall, setShowOutgoingCall] = useState(false);
  const [showCallInterface, setShowCallInterface] = useState(false);


  const [callHistory, setCallHistory] = useState([]);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [isOutgoingCallEnded, setIsOutgoingCallEnded] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (callStatus === CALL_STATUS.CONNECTED && callStartTime) {
      timerRef.current = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        setCallDuration(duration);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if ([CALL_STATUS.IDLE, CALL_STATUS.ENDED].includes(callStatus)) {
        setCallDuration(0);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callStatus, callStartTime]);

  const createOrUpdateSession = (sessionId, eventData) => {
    setCallSessions((prev) => {
      const newSessions = new Map(prev);
      const existingSession = newSessions.get(sessionId) || {};

      const updatedSession = {
        ...existingSession,
        sessionId,
        callerNumber:
          eventData.customerPhoneNumber || existingSession.callerNumber,
        agentNumber: eventData.agentPhoneNumber || existingSession.agentNumber,
        callId: sessionId,
        createdAt: existingSession.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: eventData.eventType || existingSession.status,
        events: [
          ...(existingSession.events || []),
          {
            type: eventData.eventType,
            timestamp: eventData.timestamp || Date.now(),
            data: eventData,
          },
        ],
      };

      newSessions.set(sessionId, updatedSession);
      return newSessions;
    });
  };

  const getCurrentSession = () => {
    return currentSessionId && callSessions.has(currentSessionId)
      ? callSessions.get(currentSessionId)
      : null;
  };

  const canAcceptNewCall = () => callStatus === CALL_STATUS.IDLE;
  const canMakeOutgoingCall = () => callStatus === CALL_STATUS.IDLE;

  const initiateOutgoingCall = (eventData) => {
    if (!canMakeOutgoingCall()) return null;
    console.log("initiateOutgoingCall--- Call ringing----", eventData);
    const sessionId = `outgoing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    createOrUpdateSession(sessionId, {
      callId: sessionId,
      customerPhoneNumber: eventData.customerPhoneNumber,
      agentPhoneNumber: eventData.agentPhoneNumber,
      eventType: "outgoing_initiated",
      direction: "outgoing",
      timestamp: Date.now(),
    });

    setCurrentSessionId(sessionId);
    setCallStatus(CALL_STATUS.OUTGOING_RINGING);
    setIsOutgoingCall(true);
    setShowOutgoingCall(true);

    return sessionId;
  };

  const handleOutgoingConnected = (eventData) => {
    const sessionId = eventData.callId;
    console.log("handleOutgoingConnected--- Call Connected", "---", eventData.customerPhoneNumber);
    createOrUpdateSession(sessionId, {
      ...eventData,
      eventType: "outgoing-connected",
    });

    setCurrentSessionId(sessionId);
    setCallStatus(eventData.sessionData.customerPhoneNumber === null ? CALL_STATUS.OUTGOING_RINGING : CALL_STATUS.OUTGOING_CONNECTED);
    setCallStartTime(Date.now());
    setIsOutgoingCall(true);
    setShowCallInterface(true);
  };

  const handleOutgoingCallEnded = (eventData) => {
    const sessionId = eventData.callId;

    createOrUpdateSession(sessionId, {
      ...eventData,
      eventType: "outgoing_ended",
      direction: "outgoing",
    });
    
    resetOutgoingCallUI(sessionId);
  };

  const handleOutgoingNotReachable = (eventData) => {
    const sessionId = eventData.callId;

    createOrUpdateSession(sessionId, {
      ...eventData,
      eventType: "outgoing_not_reachable",
      direction: "outgoing",
    });
    
    resetOutgoingCallUI(sessionId);
  };

  const resetOutgoingCallUI = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallStatus(CALL_STATUS.IDLE);
    setIsOutgoingCallEnded(true);
    setCallDuration(0);
    setCallStartTime(null);
    setShowOutgoingCall(false);
    setShowCallInterface(false);
  };

  const handleIncomingCall = (eventData) => {
    if (!canAcceptNewCall()) return;

    const sessionId = eventData.callId;

    createOrUpdateSession(sessionId, {
      ...eventData,
      eventType: "ringing",
    });

    setCurrentSessionId(sessionId);
    setCallStatus(CALL_STATUS.RINGING);
    setShowIncomingCall(true);
  };

  const handleCallAnswered = (eventData) => {
    const sessionId = eventData.callId;

    createOrUpdateSession(sessionId, {
      ...eventData,
      eventType: "answered",
    });

    setCurrentSessionId(sessionId);
    setCallStatus(CALL_STATUS.CONNECTED);
    setCallStartTime(Date.now());
    setShowIncomingCall(false);
    setShowCallInterface(true);
  };

  const handleCallEnded = (eventData) => {
    const sessionId = eventData.callId;

    createOrUpdateSession(sessionId, {
      ...eventData,
      eventType: "ended",
    });

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const session = getCurrentSession();
    setCallStatus(CALL_STATUS.ENDED);

    if (callStartTime && session) {
      const callRecord = {
        id: sessionId,
        callerNumber: session.callerNumber,
        agentNumber: session.agentNumber,
        duration: callDuration,
        startTime: new Date(callStartTime),
        endTime: new Date(),
        status: "completed",
        timestamp: new Date(),
        sessionData: session,
      };

      setCallHistory((prev) => [callRecord, ...prev]);
    }

    setTimeout(() => {
      resetCallUI();
    }, 2000);
  };

  const resetCallUI = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCallStatus(CALL_STATUS.IDLE);
    setCallDuration(0);
    setCallStartTime(null);
    setShowIncomingCall(false);
    setShowCallInterface(false);
  };

  const clearSession = (sessionId) => {
    setCallSessions((prev) => {
      const newSessions = new Map(prev);
      newSessions.delete(sessionId);
      return newSessions;
    });

    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  const declineCall = () => {
    const session = getCurrentSession();
    if (session) {
      const missedCall = {
        id: session.sessionId,
        callerNumber: session.callerNumber,
        agentNumber: session.agentNumber,
        duration: 0,
        startTime: new Date(),
        endTime: new Date(),
        status: "missed",
        timestamp: new Date(),
        sessionData: session,
      };

      setCallHistory((prev) => [missedCall, ...prev]);
      clearSession(session.sessionId);
    }

    resetCallUI();
    setCurrentSessionId(null);
  };

  const forceReset = () => {
    resetCallUI();
    setCurrentSessionId(null);
  };

  const isCallActive = () =>
    [CALL_STATUS.RINGING, CALL_STATUS.CONNECTED, CALL_STATUS.OUTGOING_CONNECTED, CALL_STATUS.OUTGOING_RINGING].includes(callStatus);
  const isCallRinging = () => callStatus === CALL_STATUS.RINGING;
  const isCallConnected = () => callStatus === CALL_STATUS.CONNECTED;
  const isCallIdle = () => callStatus === CALL_STATUS.IDLE;
  const isOutgoingCallConnected = () => callStatus === CALL_STATUS.OUTGOING_CONNECTED;
  const isOutgoingCallRinging = () => callStatus === CALL_STATUS.OUTGOING_RINGING;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case CALL_STATUS.RINGING:
        return "text-blue-500";
      case CALL_STATUS.OUTGOING_RINGING:
      case CALL_STATUS.OUTGOING_CONNECTED:
        return "text-orange-500";
      case CALL_STATUS.CONNECTED:
        return "text-green-500";
      case CALL_STATUS.ENDED:
      case CALL_STATUS.OUTGOING_DISCONNECTED:
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case CALL_STATUS.IDLE:
        return "Ready";
      case CALL_STATUS.RINGING:
        return "Incoming Call";
      case CALL_STATUS.OUTGOING_RINGING:
        return "Calling...";
      case CALL_STATUS.OUTGOING_CONNECTED:
        return "Connected";
      case CALL_STATUS.CONNECTED:
        return "Connected";
      case CALL_STATUS.ENDED:
      case CALL_STATUS.OUTGOING_DISCONNECTED:
        return "Call Ended";
      default:
        return callStatus;
    }
  };

  const getDisplayData = () => {
    const session = getCurrentSession();
    return {
      callerNumber: session?.callerNumber || "",
      agentNumber: session?.agentNumber || "",
      sessionId: session?.sessionId || null,
    };
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const value = {
    callStatus,
    callDuration,
    callStartTime,
    showIncomingCall,
    showCallInterface,
    callHistory,
    currentSessionId,
    getCurrentSession,
    clearSession,
    callSessions,
    canAcceptNewCall,
    ...getDisplayData(),
    handleIncomingCall,
    handleCallAnswered,
    handleCallEnded,
    resetCallUI,
    declineCall,
    forceReset,
    isCallActive,
    isCallRinging,
    isCallConnected,
    isCallIdle,
    formatDuration,
    getStatusColor,
    getStatusText,


    showOutgoingCall,
    isOutgoingCall,
    canMakeOutgoingCall,
    initiateOutgoingCall,
    handleOutgoingConnected,
    handleOutgoingCallEnded,
    isOutgoingCallConnected,
    isOutgoingCallRinging,
    handleOutgoingNotReachable,

    setCallStatus,
    isOutgoingCallEnded,
    setIsOutgoingCallEnded,

    CALL_STATUS,
  };

  return (
    <DialerContext.Provider value={value}>{children}</DialerContext.Provider>
  );
};

export default DialerProvider;
