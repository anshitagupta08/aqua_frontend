import { useContext } from "react";
import DialerContext from '../../context/Dashboard/DialerContext';
import { Phone, Calendar, Clock, User } from "lucide-react";

const CustomerCallHistory = ({ callHistory, customerData }) => {
  const { getCurrentSession } = useContext(DialerContext);

  const getPhoneNumber = () => {
    const session = getCurrentSession();
    return session?.callerNumber || customerData.phoneNumber || "Unknown";
  };

  const getCallTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "inbound":
        return "text-green-600 bg-green-50";
      case "outbound":
        return "text-blue-600 bg-blue-50";
      case "missed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatDateTime = (dateObj) => {
    if (!dateObj) return "N/A";
    try {
      const d = new Date(dateObj);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return "Invalid Date";
    }
  };

  if (!callHistory || callHistory.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="font-medium text-gray-900 mb-2">No Call History</h4>
        <p className="text-sm text-gray-500">
          No previous calls found for {getPhoneNumber()}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Phone className="w-5 h-5 text-blue-600" />
        <div>
          <h4 className="font-medium text-gray-900">Call History</h4>
          <p className="text-sm text-gray-500">
            {callHistory.length} previous calls
          </p>
        </div>
      </div>

      {/* Call List */}
      <div className="space-y-3">
        {callHistory.map((call, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg bg-white p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {call.date || "N/A"}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCallTypeColor(
                      call.type
                    )}`}
                  >
                    {call.type || "Unknown"}
                  </span>
                  {call.status && (
                    <span className="text-xs text-gray-500">
                      ({call.status})
                    </span>
                  )}
                </div>
              </div>

              {/* Duration */}
              {call.duration && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{call.duration}</span>
                </div>
              )}
            </div>

            {/* Agent & Numbers */}
            <div className="text-sm text-gray-700 space-y-1">
              {call.agentNumber && (
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3 text-gray-400" />
                  <span>
                    Agent: <span className="font-medium">{call.agentNumber}</span>
                  </span>
                </div>
              )}
              {call.customerNumber && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <span>
                    Customer: <span className="font-medium">{call.customerNumber}</span>
                  </span>
                </div>
              )}
              {call.startTime && (
                <div className="text-xs text-gray-500">
                  Started: {formatDateTime(call.startTime)}
                </div>
              )}
              {call.endTime && (
                <div className="text-xs text-gray-500">
                  Ended: {formatDateTime(call.endTime)}
                </div>
              )}
            </div>

            {/* Recording */}
            {call.recording && (
              <div className="mt-2">
                <audio controls src={call.recording} className="w-full" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show more button if many calls */}
      {callHistory.length > 5 && (
        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Calls ({callHistory.length})
          </button>
        </div>
      )}

      {/* Current Session Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Current Call
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Active call session with {getPhoneNumber()}
          </p>
          {getCurrentSession()?.sessionId && (
            <p className="text-xs text-blue-600 mt-2 font-mono">
              Session: {getCurrentSession().sessionId.slice(-12)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerCallHistory;
