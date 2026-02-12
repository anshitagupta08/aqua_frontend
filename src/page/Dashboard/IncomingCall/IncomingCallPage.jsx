import React, { useContext, useEffect, useState } from 'react';
import {
  PhoneIncoming,
  RefreshCw,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Play,
  X,
  FileText,
  ChevronDown
} from 'lucide-react';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { GET_ALL_AGENTS_LIST, INCOMING_CALL_REPORT, INCOMING_REPORT_EXPORT } from '../../../library/constans';
import axios from 'axios';
import SocketContext from '../../../context/Dashboard/SocketContext';
import useDialer from '../../../hooks/useDialer';
import UserContext from '../../../context/User/UserContext';



const IncomingCallPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [connectedFilter, setConnectedFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [expandedRemarks, setExpandedRemarks] = useState(new Set());
  const [callData, setCallData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [callStats, setCallStats] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [agentList, setAgentList] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [rowPerPage, setRowPerPage] = useState(10);
  const [totalRecords, setTotalrecords] = useState(0);


  const {
    connectionStatus,
    isAgentRegistered,
    lastError,
    isConnected,
    isReady,
    initiateOutgoingCall
  } = useContext(SocketContext);

  const {
    setCallStatus,
  } = useDialer();

  const { userData } = useContext(UserContext);

  const isManager = userData?.EmployeeRole === 2;
  console.log(userData);


  const fetchIncomingReportData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${INCOMING_CALL_REPORT}`, {
        params: {
          page: currentPage,
          limit: 10, // you can make this dynamic
          search: searchTerm,
          status: connectedFilter, // 'Connected' or 'Not Connected' (or true/false depending on API)
          employeeId: userData?.EmployeeRole === 2 ? "" : userData?.EmployeeId,
          startDate: startDate,
          endDate: endDate,
          agentPhone: userData.EmployeeRole === 2 ? "" : userData.EmployeePhone
        }
      });

      if (response.data.success) {
        setCallData(response.data.data.calls);
        setCallStats(response.data.data.stats);
        setTotalPages(response.data.data.pagination.totalPages);
        setRowPerPage(response.data.data.pagination.perPage);
        setTotalrecords(response.data.data.pagination.totalRecords);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever filters or page change
  useEffect(() => {
    fetchIncomingReportData();
  }, [currentPage, searchTerm, connectedFilter, endDate]);

  const getAllAgentsList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${GET_ALL_AGENTS_LIST}/1`, {
      });

      if (response.data.success) {
        setAgentList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllAgentsList();
  }, []);

  // Stats calculation (directly from backend)
  const stats = {
    total: callStats.total,
    answered: callStats.answered,
    missed: callStats.missed,
    totalTalkTime: callStats.totalTalkTime
  };

  const formatDateTime = (dateTime) => {
    // dateTime = "30/07/2025 15:24:26"
    const [datePart, timePart] = dateTime.split(' '); // ["30/07/2025", "15:24:26"]
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    return {
      date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const handleViewDetails = (call) => {
    setSelectedCall(call);
    setShowDetailsModal(true);
  };


  const handleRetryCall = (phoneNumber, callerName) => {
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

  const handleExcelExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress until real download
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Make API request to fetch Excel
      const response = await axios.get(INCOMING_REPORT_EXPORT, {
        responseType: 'blob', // Important for file download
        params: {
          status: connectedFilter,
          employeeId: userData?.EmployeeRole === 2 ? "" : userData?.EmployeeId
        }
      });

      // Download file using FileSaver
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `Incoming_Call_Logs_${new Date().toISOString()}.xlsx`);

      setExportProgress(100);

      setTimeout(() => setIsExporting(false), 500); // Hide modal after completion
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="space-y-6 bg-gray-100 min-h-screen w-full max-w-full">
        {/* Header Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                  <PhoneIncoming className="w-5 h-5 text-green-600 mr-2" />
                  {isManager ? "Incoming Calls - Manager View" : "Incoming Calls"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isManager
                    ? "Monitor and analyze incoming calls across your team"
                    : "Track and manage all incoming calls from customers"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => fetchIncomingReportData()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 mr-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>

                <button
                  onClick={handleExcelExport}
                  disabled={isExporting}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md border transition-all ${isExporting
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    {isExporting ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-xs">{Math.round(exportProgress)}%</span>
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                        Excel Export
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-semibold text-blue-900">
                      {stats.total ?? 0}
                    </div>
                    <div className="text-xs text-blue-600">Total Calls</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-semibold text-green-900">
                      {stats.answered ?? 0}
                    </div>
                    <div className="text-xs text-green-600">Answered</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-3 border border-red-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-semibold text-red-900">
                      {stats.missed ?? 0}
                    </div>
                    <div className="text-xs text-red-600">Missed</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-semibold text-purple-900">
                      {stats.totalTalkTime ?? "0:00"}
                    </div>
                    <div className="text-xs text-purple-600">
                      Total Talk Time
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4 items-end">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search calls, agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Show only if Manager */}
              {isManager && (
                <>
                  {/* Filter by Agent */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Agent</label>
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Agents ({agentList.length})</option>
                      {agentList.map((agent) => (
                        <option key={agent.EmployeeId} value={agent.EmployeeId}>
                          {agent.EmployeeName} ({agent.EmployeePhone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Connection Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Connection Status</label>
                <select
                  value={connectedFilter}
                  onChange={(e) => setConnectedFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Calls</option>
                  <option value="Connected">Connected</option>
                  <option value="Not Connected">Not Connected</option>
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex flex-col">
                <label className="block text-xs font-medium text-gray-700 mb-1">Reset Filters</label>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setConnectedFilter("");
                    setSelectedAgentId("");
                    setStartDate("");
                    setEndDate("");
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Calls List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="loader mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Calls...
              </h3>
            </div>
          ) : callData.length === 0 ? (
            <div className="text-center py-12">
              <PhoneIncoming className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Incoming Calls
              </h3>
              <p className="text-gray-600">
                No calls match your search criteria
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white shadow rounded-lg overflow-hidden w-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Caller Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Region Info
                      </th>
                      {isManager && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent Info
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Call Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {callData.map((call) => {
                      const { date, time } = formatDateTime(call.callDateTime);

                      return (
                        <tr key={call.id} className="hover:bg-gray-50">
                          {/* Caller Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <User className="h-5 w-5 text-indigo-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {call.customerDetails?.name || "N/A"}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {call.customerDetails?.phone || call.callerNumber || "N/A"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ID: {call.callId || "-"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Region Info */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {call.region}
                            </div>
                          </td>

                          {/* Agent Info */}
                          {isManager && (
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {call.agentName}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {call.agentPhone}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Call Info */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {date}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {time} • {call.duration}
                            </div>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${call.status === "answered"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {call.ogCallStatus}
                              </span>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {call.remarks ? (
                                <div className="max-w-xs">
                                  {call.remarks.length > 50 ? (
                                    expandedRemarks.has(call.id) ? (
                                      <div>
                                        <div className="whitespace-pre-wrap break-words mb-1">
                                          {call.remarks}
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newExpanded = new Set(expandedRemarks);
                                            newExpanded.delete(call.id);
                                            setExpandedRemarks(newExpanded);
                                          }}
                                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                        >
                                          Show less
                                        </button>
                                      </div>
                                    ) : (
                                      <div>
                                        <span>{call.remarks.substring(0, 50)}...</span>
                                        <button
                                          onClick={() => {
                                            const newExpanded = new Set(expandedRemarks);
                                            newExpanded.add(call.id);
                                            setExpandedRemarks(newExpanded);
                                          }}
                                          className="ml-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                        >
                                          read more
                                        </button>
                                      </div>
                                    )
                                  ) : (
                                    <span>{call.remarks}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">No remarks</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => handleViewDetails(call)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </button>
                              {call.voiceRecording !== "No Voice" && (
                                <a
                                  href={call.voiceRecording}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:text-purple-900 flex items-center"
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Recording
                                </a>
                              )}
                              {!isManager && call.status === "missed" && (
                                <button
                                  onClick={() => handleRetryCall(call.callerNumber, call.callerName)}
                                  className="text-green-600 hover:text-green-900 flex items-center"
                                >
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call Back
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-white border-t">
                {/* Results Info */}
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Showing {(currentPage - 1) * rowPerPage + 1}–
                  {Math.min(currentPage * rowPerPage, totalRecords)} of {totalRecords}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap justify-center">
                  {/* Previous */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border whitespace-nowrap ${currentPage === 1
                        ? "text-gray-400 border-gray-200 cursor-not-allowed"
                        : "text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    Previous
                  </button>

                  {/* Smart Page Numbers */}
                  {(() => {
                    const pages = [];
                    const showEllipsis = totalPages > 7;

                    if (!showEllipsis) {
                      // Show all pages if 7 or fewer
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Smart pagination: 1 ... 4 5 [6] 7 8 ... 20
                      if (currentPage <= 3) {
                        // Near start: 1 2 3 4 5 ... 20
                        pages.push(1, 2, 3, 4, 5, '...', totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        // Near end: 1 ... 16 17 18 19 20
                        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                      } else {
                        // Middle: 1 ... 4 5 [6] 7 8 ... 20
                        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                      }
                    }

                    return pages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-500">
                            ...
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border ${currentPage === page
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "text-gray-700 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}

                  {/* Next */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded border whitespace-nowrap ${currentPage === totalPages
                        ? "text-gray-400 border-gray-200 cursor-not-allowed"
                        : "text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-indigo-600" />
                    Call Details - {selectedCall.callId}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Call Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Call Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call ID:</span>
                        <span className="font-medium">{selectedCall.callId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Caller Name:</span>
                        <span className="font-medium">{selectedCall.callerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Caller Number:</span>
                        <span className="font-medium">{selectedCall.callerNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedCall.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedCall.status === 'answered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {selectedCall.ogCallStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Agent Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedCall.agentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedCall.agentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedCall.agentPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Region:</span>
                        <span className="font-medium">{selectedCall.region}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks Section */}
                {selectedCall.remarks && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Remarks</h3>
                    <p className="text-sm text-gray-700">{selectedCall.remarks}</p>
                  </div>
                )}

                {/* Voice Recording */}
                {selectedCall.voiceRecording !== "No Voice" && (
                  <div className="mt-6 bg-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Voice Recording
                    </h3>
                    <a
                      href={selectedCall.voiceRecording}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Recording
                    </a>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Progress Modal */}
        {isExporting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentArrowDownIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exporting Excel File</h3>
                <p className="text-gray-600 mb-4">Please wait while we prepare your incoming calls data...</p>

                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  ></div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  {exportProgress < 90 ? (
                    <span>Processing data... {Math.round(exportProgress)}%</span>
                  ) : exportProgress < 100 ? (
                    <span>Finalizing export... {Math.round(exportProgress)}%</span>
                  ) : (
                    <span className="text-green-600 font-medium">✓ Export completed! Download starting...</span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Date Range: {startDate} to {endDate}

                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  );
};

export default IncomingCallPage;