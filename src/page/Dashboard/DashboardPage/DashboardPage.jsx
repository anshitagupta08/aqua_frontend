import React, { useState, useEffect, useContext } from "react";
import {
  PhoneIcon,
  PhoneArrowUpRightIcon,
  PhoneArrowDownLeftIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../library/axios";
import { GET_FOLLOW_UP_CALLS, GET_RECENT_CALLS } from "../../../library/constans";
import { useNavigate } from "react-router-dom";
import SocketContext from "../../../context/Dashboard/SocketContext";
import useDialer from "../../../hooks/useDialer";

const DashboardPage = () => {
  // State management
  const [recentCalls, setRecentCalls] = useState([]);
  const [followUpCalls, setFollowUpCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    missedCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    pendingFollowUps: 0,
  });

  const user = JSON.parse(localStorage.getItem("userData"));
  const destinationNumber = user?.EmployeePhone || "";

  const {
    initiateOutgoingCall
  } = useContext(SocketContext);

  const {
    setCallStatus,
  } = useDialer();

  const navigate = useNavigate();

  // Date utility functions
  const getDateRange = (period) => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split("T")[0];

    switch (period) {
      case "today":
        return {
          fromDate: formatDate(today),
          toDate: formatDate(today),
        };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return {
          fromDate: formatDate(weekAgo),
          toDate: formatDate(today),
        };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return {
          fromDate: formatDate(monthAgo),
          toDate: formatDate(today),
        };
      default:
        return {
          fromDate: formatDate(today),
          toDate: formatDate(today),
        };
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays}d ago`;
  };

  // API calls
  const fetchRecentCalls = async (options = {}) => {
    try {
      // ✅ Default filters
      const {
        page = 1,
        limit = 50,
        period = selectedPeriod,
        callType = '',
        destinationNumber: destNum = destinationNumber,
      } = options;

      // 📅 Date range helper
      const { fromDate, toDate } = getDateRange(period);

      const isManager = user?.EmployeeRole === 2;

      // ✅ Build query parameters dynamically
      const params = new URLSearchParams();

      params.append('page', page);
      params.append('limit', limit);
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (callType) params.append('callType', callType);
      if (!isManager && destNum) params.append('Destination_Number', destNum);

      const response = await axiosInstance.get(`${GET_RECENT_CALLS}?${params.toString()}`);

      if (Array.isArray(response.data?.data)) {
        setRecentCalls(response.data.data);
        calculateStats(response.data.data);
      } else {
        console.warn('Unexpected response structure:', response.data);
        setRecentCalls([]);
        calculateStats([]);
      }
    } catch (err) {
      console.error('Error fetching recent calls:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      throw new Error(`Failed to fetch recent calls: ${err.message}`);
    }
  };


  const fetchFollowUpCalls = async ({
    limit = 50,
    page = 1,
    status = "open",
    fromDate,
    toDate,
  } = {}) => {
    try {
      // If fromDate/toDate not provided, default to today → 30 days ahead
      const today = new Date();
      const defaultFromDate = today.toISOString().split("T")[0];
      const defaultToDate = new Date(today.setDate(today.getDate() + 30))
        .toISOString()
        .split("T")[0];

      const queryFromDate = fromDate || defaultFromDate;
      const queryToDate = toDate || defaultToDate;

      const response = await axiosInstance.get(`${GET_FOLLOW_UP_CALLS}`, {
        params: {
          limit,
          page,
          status,
          fromDate: queryFromDate,
          toDate: queryToDate,
        },
      });

      console.log("Follow-up calls response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        setFollowUpCalls(response.data.data);
      } else {
        console.warn("Unexpected follow-up response structure:", response.data);
        setFollowUpCalls([]);
      }
    } catch (err) {
      console.error("Error fetching follow-up calls:", err);
      if (err.response) {
        console.error("Follow-up response status:", err.response.status);
        console.error("Follow-up response data:", err.response.data);
      }
      setFollowUpCalls([]);
    }
  };

  // Calculate statistics from API data
  const calculateStats = (calls) => {
    if (!Array.isArray(calls)) {
      console.warn("Invalid calls data for stats calculation:", calls);
      return;
    }

    const totalCalls = calls.length;
    const answeredCalls = calls.filter(
      (call) => call.status && call.status.toLowerCase() === "answered"
    ).length;
    const missedCalls = calls.filter(
      (call) =>
        call.status &&
        (call.status.toLowerCase() === "missed" ||
          call.status.toLowerCase() === "unanswered" ||
          call.status.toLowerCase() === "no answer")
    ).length;
    const inboundCalls = calls.filter(
      (call) => call.type && call.type.toLowerCase() === "inbound"
    ).length;
    const outboundCalls = calls.filter(
      (call) => call.type && call.type.toLowerCase() === "outbound"
    ).length;

    setCallStats((prev) => ({
      ...prev,
      totalCalls,
      answeredCalls,
      missedCalls,
      inboundCalls,
      outboundCalls,
    }));
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Loading dashboard data...");

        // Fetch calls first, then follow-ups (don't let follow-up errors break the dashboard)
        await fetchRecentCalls();
        await fetchFollowUpCalls();
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "An error occurred while loading data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPeriod]);

  // Update follow-up count when data changes
  useEffect(() => {
    setCallStats((prev) => ({
      ...prev,
      pendingFollowUps: followUpCalls.length,
    }));
  }, [followUpCalls]);

  // Filter calls based on search
  const filteredCalls = recentCalls.filter((call) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const name = call.name || "";
    const number = call.number || "";

    return (
      name.toLowerCase().includes(searchLower) ||
      number.toLowerCase().includes(searchLower)
    );
  });

  // Helper functions for UI
  const getCallIcon = (type) => {
    return type && type.toLowerCase() === "inbound"
      ? PhoneArrowDownLeftIcon
      : PhoneArrowUpRightIcon;
  };

  const getCallIconColor = (type) => {
    return type && type.toLowerCase() === "inbound"
      ? "text-blue-600 bg-blue-100"
      : "text-green-600 bg-green-100";
  };

  const getStatusBadge = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "answered":
        return "bg-green-100 text-green-800";
      case "missed":
      case "unanswered":
      case "no answer":
        return "bg-red-100 text-red-800";
      case "busy":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadge = (status) => {
    return status && status.toLowerCase() === "open"
      ? "bg-red-100 text-red-800"
      : "bg-green-100 text-green-800";
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleCall = (phoneNumber, callerName) => {
    console.log("🔍 handleRetryCall called with:", { phoneNumber, callerName });
    if (phoneNumber && phoneNumber.trim() !== "") {
      console.log(`📞 Initiating callback to ${phoneNumber} for ${callerName}`);

      setCallStatus("outgoing-ringing");
      initiateOutgoingCall(phoneNumber);

      console.log("✅ Callback call initiated");
    } else {
      console.error("❌ No phone number provided for callback");
    }

  };

  const handleEdit = (number) => {
     navigate(`/dashboard/followup-form/${number}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-[#Eb3241] animate-spin mx-auto" />
          <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-gray-600 max-w-md">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-6 px-6 py-3 bg-[#Eb3241] text-white rounded-lg hover:bg-[#d12b39] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Call Dashboard</h1>
        <p className="text-gray-600">
          Monitor your call activities and follow-ups
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {/* Total Calls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <PhoneIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {callStats.totalCalls}
              </p>
            </div>
          </div>
        </div>

        {/* Answered */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Answered</p>
              <p className="text-2xl font-bold text-gray-900">
                {callStats.answeredCalls}
              </p>
            </div>
          </div>
        </div>

        {/* Missed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Missed</p>
              <p className="text-2xl font-bold text-gray-900">
                {callStats.missedCalls}
              </p>
            </div>
          </div>
        </div>

        {/* Inbound */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <PhoneArrowDownLeftIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inbound</p>
              <p className="text-2xl font-bold text-gray-900">
                {callStats.inboundCalls}
              </p>
            </div>
          </div>
        </div>

        {/* Outbound */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <PhoneArrowUpRightIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Outbound</p>
              <p className="text-2xl font-bold text-gray-900">
                {callStats.outboundCalls}
              </p>
            </div>
          </div>
        </div>

        {/* Follow-ups */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <UserGroupIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900">
                {callStats.pendingFollowUps}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Recent Calls Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
                  Recent Calls
                </h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#Eb3241] focus:border-[#Eb3241] outline-none"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                  </select>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <FunnelIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#Eb3241] focus:border-[#Eb3241] outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCalls.length > 0 ? (
                    filteredCalls.map((call, index) => {
                      const CallIcon = getCallIcon(call.type);
                      return (
                        <tr
                          key={call.callId || index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`p-2 rounded-full ${getCallIconColor(
                                  call.type
                                )}`}
                              >
                                <CallIcon className="h-4 w-4" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {call.name || "Unknown"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {call.number || "Unknown"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {call.type ? call.type.toLowerCase() : "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                call.status
                              )}`}
                            >
                              {call.type.toLowerCase() === "outbound" && call.status === "Missed"
                                ? "Not Connected"
                                : call.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimeAgo(call.time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium text-gray-900`}
                            >
                              {call.conversation_duration
                                ? call.conversation_duration
                                : "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <PhoneIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {searchTerm
                            ? "No calls found matching your search"
                            : "No calls found for the selected period"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Follow-ups Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Follow-ups
                </h3>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="p-6">
              {followUpCalls.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {followUpCalls.map((followUp) => (
                    <div
                      key={followUp.formId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {followUp.name || "Unknown"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {followUp.number || "Unknown"}
                          </p>
                        </div>
                        <span
                          className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(
                            followUp.status
                          )}`}
                        >
                          {followUp.status ? followUp.status.toUpperCase() : "UNKNOWN"}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {followUp.remark || "No remarks"}
                      </p>

                      <div className="text-xs text-gray-500">
                        <p>
                          Follow-up: {new Date(followUp.time).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Buttons row */}
                      <div className="flex items-center justify-end mt-3 space-x-3">
                        <button
                          onClick={() => handleCall(followUp.number, followUp.name)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50 transition"
                        >
                          Call
                        </button>

                        <button
                          onClick={() => handleEdit(followUp.number)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-400 text-gray-700 hover:bg-gray-100 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending follow-ups</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
