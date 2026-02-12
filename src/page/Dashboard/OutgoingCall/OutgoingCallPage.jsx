import React, { useContext, useEffect, useState } from 'react';
import {
  PhoneArrowUpRightIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  EyeIcon,
  PlayIcon,
  ArrowDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { GET_ALL_AGENTS_LIST, OUTGOING_CALL_REPORT, OUTGOING_REPORT_EXPORT } from '../../../library/constans';
import axios from 'axios';
import { saveAs } from 'file-saver';
import SocketContext from '../../../context/Dashboard/SocketContext';
import useDialer from '../../../hooks/useDialer';
import UserContext from '../../../context/User/UserContext';


const OutgoingCallPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [connectedFilter, setConnectedFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [expandedRemarks, setExpandedRemarks] = useState(new Set());
  const [callStats, setCallStats] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [callData, setCallData] = useState([]);
  const [rowPerPage, setRowPerPage] = useState(10);
  const [agentList, setAgentList] = useState([]);

  const {
    initiateOutgoingCall
  } = useContext(SocketContext);

  const {
    setCallStatus,
  } = useDialer();

  const { userData } = useContext(UserContext);

  const isManager = userData?.EmployeeRole === 2;

  const fetchOutgoingReportData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${OUTGOING_CALL_REPORT}`, {
        params: {
          page: currentPage,
          limit: 10, // you can make this dynamic
          search: searchTerm,
          status: connectedFilter,
          employeeId: userData?.EmployeeRole === 2 ? (selectedAgentId ? selectedAgentId : "") : userData?.EmployeeId,
          startDate: startDate,
          endDate: endDate,
        }
      });

      if (response.data.success) {
        setCallData(response.data.data.calls);
        setCallStats(response.data.data.stats);
        setRowPerPage(response.data.data.pagination.perPage);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalRecords(response.data.data.pagination.totalRecords);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutgoingReportData();
  }, [currentPage, searchTerm, connectedFilter, endDate, selectedAgentId]);


  const getAllAgentsList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${GET_ALL_AGENTS_LIST}/1`, {
      });

      if (response.data.success) {
        setAgentList(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllAgentsList();
  }, []);

  const stats = {
    total: callStats.total || 0,
    answered: callStats.answered || 0,
    missed: callStats.missed || 0,
    totalTalkTime: callStats.totalTalkTime || '0m'
  };



  const pagination = {
    perPage: rowPerPage,
    totalPages: totalPages,
    totalRecords: totalRecords
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleRefresh = () => {
    fetchOutgoingReportData();
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
      const response = await axios.get(OUTGOING_REPORT_EXPORT, {
        responseType: 'blob', // Important for file download
        params: {
          status: connectedFilter,
          employeeId: userData?.EmployeeRole === 2 ? (selectedAgentId ? selectedAgentId : "") : userData?.EmployeeId,
        }
      });

      // Download file using FileSaver
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `Outgoing_Call_Logs_${new Date().toISOString()}.xlsx`);

      setExportProgress(100);

      setTimeout(() => setIsExporting(false), 500); // Hide modal after completion
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const clearManagerFilters = () => {
    setSearchTerm('');
    setSelectedAgentId('');
    setConnectedFilter('');
    setStartDate('');
    setEndDate('');
    fetchOutgoingReportData();
  };

  const handleViewDetails = (call) => {
    console.log(call);
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


  return (
    <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
      {/* Role Toggle (for demo purposes) */}
      {/* <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Demo View Toggle:</span>
          <button
            onClick={() => setIsManager(!isManager)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            Switch to {isManager ? 'Agent' : 'Manager'} View
          </button>
        </div>
      </div> */}

      {/* Header Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <PhoneArrowUpRightIcon className="w-5 h-5 text-blue-600 mr-2" />
                {isManager ? "Team Outgoing Calls" : "Outgoing Calls"}
                {isManager && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <UserGroupIcon className="w-3 h-3 mr-1" />
                    Manager View
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isManager
                  ? "Monitor and analyze outbound calls from all agents under your supervision"
                  : "Monitor and analyze all outbound calls to customers"}
              </p>
              {isManager && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Manager:</span> {userData.EmployeeName} •
                  <span className="font-medium"> Region:</span> {userData.EmployeeRegion} •
                  <span className="font-medium"> ID:</span> {userData.EmployeeId}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 mr-2"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-semibold text-blue-900">{stats.total}</div>
                  <div className="text-xs text-blue-600">Total Calls</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-semibold text-green-900">{stats.answered}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-semibold text-red-900">{stats.missed}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-semibold text-purple-900">{stats.totalTalkTime}</div>
                  <div className="text-xs text-purple-600">Total Talk Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between border-b pb-2 mb-4 flex-wrap gap-3">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <span className="text-xs text-gray-500">{totalRecords} calls</span>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            {/* Search Field */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search Calls</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, number, call ID, or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Agent Filter (only visible if manager) */}
            {isManager && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Agent</label>
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
            )}

            {/* Start Date */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* End Date */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Connection Status */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Connection Status</label>
              <select
                value={connectedFilter}
                onChange={(e) => setConnectedFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Calls</option>
                <option value="true">Connected</option>
                <option value="false">Not Connected</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div>
              <button
                onClick={clearManagerFilters}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Calls Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient Details
                </th>
                {isManager && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent Info
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region Info
                </th>
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
              {callData.length === 0 ? (
                <tr>
                  <td
                    colSpan={isManager ? 6 : 5}
                    className="px-6 py-10 text-center text-gray-500 text-sm"
                  >
                    No call records found for the selected filters.
                  </td>
                </tr>
              ) : (
                callData.map((call) => {
                  const { date, time } = formatDateTime(call.callDateTime);
                  return (
                    <tr key={call.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{call.callerName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {call.callerNumber || "-"}
                            </div>
                            <div className="text-xs text-gray-400">ID: {call.callId}</div>
                          </div>
                        </div>
                      </td>

                      {isManager && (
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-purple-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{call.agentName}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {call.agentPhone}
                              </div>
                              <div className="text-xs text-gray-400">Region: {call.agentRegion}</div>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {call.region}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {date}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {time} • {call.duration}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${call.status === 'answered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {call.ogCallStatus === 'Answered' ? 'Answered' : 'Not Connected'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {call.remarks ? (
                            call.remarks.length > 50 ? (
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
                            )
                          ) : (
                            <span className="text-gray-400 italic">No remarks</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleViewDetails(call)}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          {call.recordVoice && call.recordVoice !== 'No Voice' && (
                            <a
                              href={call.recordVoice}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-900 flex items-center"
                            >
                              <PlayIcon className="w-4 h-4 mr-1" />
                              Recording
                            </a>
                          )}
                          {!isManager && call.status !== 'answered' && (
                            <button className="text-orange-600 hover:text-orange-900 flex items-center"
                              onClick={() => handleRetryCall(call.callerNumber, call.callerName)}
                            >
                              <PhoneIcon className="w-4 h-4 mr-1" />
                              Retry Call
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            {/* Mobile pagination */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>

            {/* Desktop pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.perPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.perPage, pagination.totalRecords)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalRecords}</span> results
                </p>
              </div>

              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ArrowDownIcon className="h-5 w-5 rotate-90" />
                  </button>

                  {[...Array(pagination.totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    disabled={currentPage >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ArrowDownIcon className="h-5 w-5 -rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <DocumentTextIcon className="w-6 h-6 mr-2 text-green-600" />
                  Call Details - {selectedCall.callId}
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Call Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Call ID:</span>
                      <span className="font-medium">{selectedCall.callId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent Number:</span>
                      <span className="font-medium">{selectedCall.agentPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer Number:</span>
                      <span className="font-medium">{selectedCall.callerNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedCall.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {selectedCall.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trader Details */}
                {selectedCall?.formDetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Name:</span>
                        <span className="font-medium">{selectedCall?.formDetails?.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact Number:</span>
                        <span className="font-medium">{selectedCall.formDetails.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call Type:</span>
                        <span className="font-medium">{selectedCall.formDetails.callTypeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attempt Status:</span>
                        <span className="font-medium">{selectedCall.formDetails.attemptStatusName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Closure Status:</span>
                        <span className="font-medium">{selectedCall.formDetails.closureStatusName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disposition Name:</span>
                        <span className="font-medium">{selectedCall.formDetails.dispositionName}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-gray-600 mr-2">Outcome Tags:</span>
                        {selectedCall.formDetails.outcomeTagNames.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent Details */}
                {selectedCall.rawData?.agent && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Agent Name:</span>
                        <span className="font-medium">{selectedCall.rawData.agent.EmployeeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedCall.rawData.agent.EmployeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedCall.rawData.agent.EmployeePhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Region:</span>
                        <span className="font-medium">{selectedCall.rawData.agent.EmployeeRegion}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Details */}
                {selectedCall.rawData?.formDetails && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call Type:</span>
                        <span className="font-medium">{selectedCall.rawData.formDetails.callType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inquiry Number:</span>
                        <span className="font-medium">{selectedCall.rawData.formDetails.inquiryNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SAP Inquiry:</span>
                        <span className="font-medium">{selectedCall.rawData.formDetails.sapInquiryNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inquiry Type:</span>
                        <span className="font-medium">{selectedCall.rawData.formDetails.ProblemCategory?.problemName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Inquiry Details:</span>
                        <span className="font-medium">{selectedCall.rawData.formDetails.ProblemSubCategory?.subProblemName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Follow-up Date:</span>
                        <span className="font-medium">
                          {new Date(selectedCall.rawData.formDetails.followUpDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Form Status:</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {selectedCall.rawData.formDetails.status.charAt(0).toUpperCase() +
                            selectedCall.rawData.formDetails.status.slice(1)}
                        </span>
                      </div>
                      <div className="col-span-2 mt-2">
                        <span className="text-gray-600 text-sm font-medium">Remarks:</span>
                        <div className="mt-1 p-3 bg-white border rounded-lg">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {selectedCall.rawData.formDetails.remarks}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recording Section */}
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Recording</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Recording Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedCall.rawData?.recordVoice && selectedCall.rawData.recordVoice !== 'No Voice'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {selectedCall.rawData?.recordVoice && selectedCall.rawData.recordVoice !== 'No Voice'
                          ? 'Available'
                          : 'Not Available'}
                      </span>
                    </div>
                    {selectedCall.rawData?.recordVoice && selectedCall.rawData.recordVoice !== 'No Voice' && (
                      <div className="flex justify-center mt-4">
                        <a
                          href={selectedCall.rawData.recordVoice}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <PlayIcon className="w-5 h-5 mr-2" />
                          Play Recording
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
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
              <p className="text-gray-600 mb-4">Please wait while we prepare your outgoing calls data...</p>

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
                {selectedAgentId && (
                  <div>Agent: {availableAgents.find(a => a.id === selectedAgentId)?.name}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutgoingCallPage;