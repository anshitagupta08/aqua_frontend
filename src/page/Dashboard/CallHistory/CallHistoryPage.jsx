import React, { useEffect, useState } from 'react';
import { Download, Phone, PhoneIncoming, PhoneOutgoing, FileText, ChevronDown, ChevronRight, Search, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { EXPORT_CALL_HISTORY_ALL, EXPORT_CALL_HISTORY_BY_ID, GET_CALL_HISTORY } from '../../../library/constans';
import axios from 'axios';
import moment from 'moment/moment';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

const CallHistoryPage = () => {
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);


  const fetchCallHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      params.append("page", page);
      params.append("limit", limit);

      const response = await axios.get(`${GET_CALL_HISTORY}?${params}`);
      console.log(response.data.pagination);

      if (response.data.success) {
        setCustomersData(response.data.data);
        setTotalPages(Math.ceil(response.data.pagination.total / limit));
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching call history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, []);

  // Handle date filter change
  useEffect(() => {
    if (dateFilter === "custom") return; // don't overwrite custom range

    const today = new Date();
    let startDate = '';
    let endDate = today.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        startDate = '';
        endDate = '';
        break;
    }

    setDateRange({ startDate, endDate });
  }, [dateFilter]);

  // Refetch data when filters change
  useEffect(() => {
    // For custom filter, only run if both dates are selected
    if (dateFilter === "custom") {
      if (!dateRange.startDate || !dateRange.endDate) return;
    }

    fetchCallHistory();
  }, [page, limit, searchTerm, dateRange, dateFilter]);


  const toggleCustomer = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };


  const downloadCustomerReport = async (customer) => {
    console.log(customer);

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


      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      // Make API request to fetch Excel
      const response = await axios.get(`${EXPORT_CALL_HISTORY_BY_ID}/${customer.customer.id}?${params}`, {
        responseType: 'blob', // Important for file download
      });

      clearInterval(interval); // Clear the interval after download

      // Download file using FileSaver
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `Call_History_${customer.customer.name}_${new Date().toISOString().split('T')[0]}.xlsx`);

      setExportProgress(100);

      setTimeout(() => setIsExporting(false), 500); // Hide modal after completion
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const downloadAllReports = async () => {
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

      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      // Make API request to fetch Excel
      const response = await axios.get(`${EXPORT_CALL_HISTORY_ALL}?${params}`, {
        responseType: 'blob', // Important for file download
      });

      clearInterval(interval); // Clear the interval after download

      // Download file using FileSaver
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      saveAs(blob, `All_Call_History_${new Date().toISOString().split('T')[0]}.xlsx`);

      setExportProgress(100);

      setTimeout(() => setIsExporting(false), 500); // Hide modal after completion
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  if (loading && customersData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading call history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Call History
            </h1>
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => fetchCallHistory()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>

              {/* Download All Reports */}
              <button
                onClick={downloadAllReports}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={20} />
                Download All Reports
              </button>

            </div>
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            {/* Search */}
            <div className="flex-1 min-w-[250px] relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

          </div>
        </div>


        {/* Customer List */}
        <div className="space-y-4">
          {customersData.map((customer) => (
            <div key={customer.customer.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Customer Header */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleCustomer(customer.customer.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {expandedCustomer === customer.customer.id ? (
                      <ChevronDown className="text-gray-500" size={24} />
                    ) : (
                      <ChevronRight className="text-gray-500" size={24} />
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{customer.customer.name}</h2>
                      <p className="text-gray-500 text-sm">{customer.customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-green-600">
                        <PhoneIncoming size={20} />
                        <span className="font-semibold">{customer.summary.totalInboundCalls}</span>
                      </div>
                      <p className="text-xs text-gray-500">Inbound</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-blue-600">
                        <PhoneOutgoing size={20} />
                        <span className="font-semibold">{customer.summary.totalOutboundCalls}</span>
                      </div>
                      <p className="text-xs text-gray-500">Outbound</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-purple-600">
                        <FileText size={20} />
                        <span className="font-semibold">{customer.summary.totalForms}</span>
                      </div>
                      <p className="text-xs text-gray-500">Forms</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadCustomerReport(customer);
                      }}
                      className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedCustomer === customer.customer.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Inbound Calls */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <PhoneIncoming className="text-green-600" size={20} />
                      Inbound Calls
                    </h3>
                    <div className="bg-white rounded-lg overflow-hidden">
                      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Call ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Call Date & Time</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Query Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Support Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Form Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
                          </tr>
                        </thead>

                        <tbody>
                          <>
                            {/* Merged Array */}
                            {(() => {
                              const mergedData = [
                                ...(customer.calls.inbound || []).map(call => ({
                                  id: call.callId,
                                  callDateTime: `${call.date} ${call.time}`,
                                  duration: call.duration,
                                  status: call.status,
                                  form: call.form,
                                  remarks: call.remarks,
                                  isManual: false,
                                  QueryType: call.form?.queryType?.name,
                                  SourceType: call.form?.sourceType?.name,
                                  SupportType: call.form?.supportType?.name,
                                  formStatus: call?.form?.status
                                })),
                                ...(customer.manualForms.inbound || []).map(call => ({
                                  id: call.id,
                                  callDateTime: moment(call.callDateTime).local().format("DD/MM/YYYY hh:mm:ss A"),
                                  duration: call.duration,
                                  status: "Manual",
                                  form: call.form,
                                  remarks: call.remarks,
                                  isManual: true,
                                  QueryType: call.queryType?.name,
                                  SourceType: call.sourceType?.name,
                                  SupportType: call.supportType?.name,
                                  formStatus: call.status
                                }))
                              ];

                              if (mergedData.length === 0) {
                                return (
                                  <tr className="border-t border-gray-200 hover:bg-gray-50 transition">
                                    <td colSpan="9" className="px-4 py-6 text-center text-gray-500 bg-gray-50">
                                      <div className="flex flex-col items-center justify-center space-y-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none"
                                          viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                          <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M15 10l4.553 2.276A1 1 0 0120 13.118V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-5.882a1 1 0 01.447-.842L9 10m6 0V6a3 3 0 00-6 0v4m6 0H9" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-600">No inbound call records found</p>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              return mergedData.map((call, index) => (
                                <tr key={index} className="border-t border-gray-200 hover:bg-gray-50 transition">
                                  <td className="px-4 py-3 text-sm text-gray-800">{call.id}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{call.callDateTime}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{call.duration || "-"}</td>

                                  {/* STATUS */}
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${call.isManual
                                        ? "bg-gray-100 text-gray-700"
                                        : call.status === "Answered"
                                          ? "bg-green-100 text-green-800"
                                          : call.status === "Missed"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                      {call.status}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 text-sm text-gray-600">{call.QueryType || "—"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{call.SourceType || "—"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{call.SupportType || "—"}</td>

                                  {/* FORM STATUS */}
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${call.formStatus === "closed"
                                        ? "bg-green-100 text-green-800"
                                        : call?.formStatus === "open"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-700"
                                        }`}
                                    >
                                      {call?.formStatus || "—"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 text-sm text-gray-600">{call.remarks || "—"}</td>
                                </tr>
                              ));
                            })()}
                          </>
                        </tbody>
                      </table>
                    </div>

                  </div>

                  {/* Outbound Calls */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <PhoneOutgoing className="text-blue-600" size={20} />
                      Outbound Calls
                    </h3>

                    <div className="bg-white rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Call ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Call Date & Time</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Outbound Call Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Closure Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Attempt Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Call Disposition</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Follow-up Required</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Follow-up Date</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Remarks</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(() => {
                            const mergedOutbound = [
                              ...(customer.calls.outbound || []).map((call) => ({
                                id: call.callId,
                                callDateTime: moment(call.time).local().format("DD/MM/YYYY hh:mm:ss A"),
                                duration: call.overallDuration,
                                status: call.status,
                                form: call.form,
                                remarks: call.form?.remarks,
                                isManual: false,
                                OutboundCallType: call.form?.callTypeDetail?.name,
                                CallDisposition: call.form?.disposition?.name,
                                CallAttemptStatus: call.form?.attemptStatus?.name,
                                FinalClosureStatus: call.form?.closureStatus?.name
                              })),

                              ...(customer.manualForms.outbound || []).map((call) => ({
                                id: call.CallId,
                                callDateTime: moment(call.callDateTime).local().format("DD/MM/YYYY hh:mm:ss A"),
                                duration: call.duration,
                                status: "Manual",
                                form: call.form,
                                remarks: call.remarks,
                                isManual: true,
                                OutboundCallType: call.callTypeDetail?.name,
                                CallDisposition: call.disposition?.name,
                                CallAttemptStatus: call.attemptStatus?.name,
                                FinalClosureStatus: call.closureStatus?.name
                              }))
                            ];

                            if (mergedOutbound.length === 0) {
                              return (
                                <tr className="border-t border-gray-200">
                                  <td colSpan="11" className="px-4 py-6 text-center text-gray-500 bg-gray-50">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M15 10l4.553 2.276A1 1 0 0120 13.118V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-5.882a1 1 0 01.447-.842L9 10m6 0V6a3 3 0 00-6 0v4m6 0H9" />
                                      </svg>
                                      <p className="text-sm font-medium text-gray-600">No outbound call records found</p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return mergedOutbound.map((call, index) => (
                              <tr key={index} className="border-t border-gray-200 hover:bg-gray-50 transition">
                                <td className="px-4 py-3 text-sm text-gray-800">{call.id}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{call.callDateTime}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{call.duration || "-"}</td>

                                {/* STATUS */}
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${call.isManual
                                      ? "bg-gray-100 text-gray-700"
                                      : call.status === "Answered"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                    {call.status}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">{call.OutboundCallType || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{call.FinalClosureStatus || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{call.CallAttemptStatus || "-"}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{call.CallDisposition || "-"}</td>

                                {/* FOLLOW-UP */}
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${call.form?.followUpRequired
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                    {call.form?.followUpRequired ? "Yes" : "No"}
                                  </span>
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {call.form?.followUpDate
                                    ? moment(call.form.followUpDate).local().format("DD/MM/YYYY")
                                    : "-"}
                                </td>

                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {call.remarks || "-"}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>

        {customersData.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No customers found matching your search.</p>
          </div>
        )}

        {customersData.length > 0 && (
          <div className="flex justify-between items-center mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md ${page === 1 ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                Previous
              </button>

              <span className="text-sm text-gray-700">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md ${page === totalPages ? "bg-gray-200 text-gray-400" : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                Next
              </button>
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
                <p className="text-gray-600 mb-4">Please wait while we prepare your calls data...</p>

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

                {/* <div className="text-xs text-gray-500">
                  Date Range: {dateRange.startDate} to {dateRange.endDate}

                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallHistoryPage;