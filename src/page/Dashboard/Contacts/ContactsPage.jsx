import React, { useContext, useEffect, useState } from "react";
import {
  Search,
  Phone,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
  FileText,
  X,
  Play,
  Clock
} from "lucide-react";
import axios from "axios";
import { GET_CONTACT_DIRECTORY } from "../../../library/constans";
import UserContext from "../../../context/User/UserContext";
import SocketContext from "../../../context/Dashboard/SocketContext";
import useDialer from "../../../hooks/useDialer";
import {
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import useForm from "../../../hooks/useForm";
import moment from "moment";


const ContactsPage = () => {

  const { userData } = useContext(UserContext);

  const {
    initiateOutgoingCall
  } = useContext(SocketContext);

  const {
    setCallStatus,
  } = useDialer();

  const { isFormOpen, formData, setIsFormOpen, setIsOutgoingFormOpen } = useForm();

  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRemarks, setExpandedRemarks] = useState(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const getContactsDirectory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${GET_CONTACT_DIRECTORY}`, {
        params: {
          page: currentPage,
          limit: pageSize, // you can make this dynamic
        }
      });

      if (response.data.success) {
        setCustomers(response.data.data.customers);
        setTotalRecords(response.data.data.pagination.total);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getContactsDirectory();
  }, [currentPage, pageSize]);

  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = !searchTerm ||
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.address.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });


  // Pagination
  // const totalRecords = filteredCustomers.length;
  // const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const customersData = filteredCustomers;
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const pagination = true;

  const employeeInfo = {
    name: userData.EmployeeName,
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return { date: "N/A", time: "N/A" };
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getFormStatus = (cust) => {
  if (cust.formDetail) return cust.formDetail.status;
  if (cust.latestCall && !cust.latestCall.formDetail) return "no-form";
  if (!cust.latestCall) return "no-call";
  return cust.latestCall.formDetail?.status || "no-form";
};

  const getFormStatusBadge = (status) => {
    const badges = {
      "open": "px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800",
      "closed": "px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800",
      "pending": "px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800",
      "follow-up": "px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800",
      "no-form": "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600",
      "no-call": "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400"
    };
    return badges[status] || badges["no-call"];
  };

  const getStatusDisplayText = (status) => {
    const texts = {
      "open": "Open",
      "closed": "Closed",
      "pending": "Pending",
      "follow-up": "Follow-up",
      "no-form": "No Form",
      "no-call": "-"
    };
    return texts[status] || "-";
  };

  const toggleRemarksExpansion = (traderId) => {
    const newExpanded = new Set(expandedRemarks);
    if (newExpanded.has(traderId)) {
      newExpanded.delete(traderId);
    } else {
      newExpanded.add(traderId);
    }
    setExpandedRemarks(newExpanded);
  };

  const handleCall = async (phone, name) => {
    // alert(`Initiating call to ${name} at ${phone} via Acefone...`);
    if (phone && phone.trim() !== "") {
      console.log(`📞 Initiating callback to ${phone} for ${name}`);

      setCallStatus("outgoing-ringing");
      initiateOutgoingCall(phone);

      console.log("✅ Callback call initiated");
    } else {
      console.error("❌ No phone number provided for callback");
    }
  };

  const handleViewDetails = (cust) => {
    console.log(cust);

    setSelectedCustomer(cust);
    setShowDetailsModal(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleRegionFilterChange = (region) => {
    setSelectedRegion(region);
    setCurrentPage(1);
  };


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


  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Contacts
          </h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header with Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Left Section */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Contacts Directory
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {customers.length} of {totalRecords} customers
                {pagination && (
                  <span className="ml-2">
                    • Page {currentPage} of {totalPages}
                  </span>
                )}
                {employeeInfo && (
                  <span className="ml-2 text-blue-600">
                    • {employeeInfo.name}
                  </span>
                )}
              </p>
            </div>

            {/* Right Section - Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsFormOpen(true);
                  navigate("/dashboard/inbound-form", {
                    state: {
                      from: "contacts-directory",
                    },
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                Inbound Form
              </button>
              <button
                onClick={() => {
                  setIsOutgoingFormOpen(true);
                  navigate("/dashboard/outbound-form", {
                    state: {
                      from: "contacts-directory",
                    },
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
              >
                Outbound Form
              </button>
            </div>
          </div>


        </div>
      </div>


      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>



          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm("");
              handleRegionFilterChange("");
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear Filters
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              getContactsDirectory();
              setPageSize(10);
              setCurrentPage(1);
            }}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>


      {/* Enhanced Contact List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {customersData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              No customers found
            </h3>
            <p className="text-xs text-gray-600">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "No traders available"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Number
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Call Info
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Form Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customersData.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50">
                    {/* Trader Details */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-800">
                              {cust.name?.charAt(0) || "T"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {cust.name || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cust.id} • {cust.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Business */}
                    <td className="px-4 py-3">
                      <div
                        className="text-sm text-gray-900 max-w-xs truncate"
                        title={cust.phone}
                      >
                        {cust.phone || "N/A"}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {cust.address}
                      </div>

                    </td>

                    {/* Last Call Info with Enhanced Remarks Display */}
                    <td className="px-4 py-3">
                      {cust.latestCall ? (
                        <div className="text-xs">
                          <div className="text-gray-900 font-medium">
                            {formatDate(cust.latestCall.createdAt)}
                          </div>
                          <div className="text-gray-500 mt-1 max-w-xs">
                            {cust.latestCall.formDetail?.remarks ? (
                              cust.latestCall.formDetail.remarks.length >
                                30 ? (
                                <div>
                                  {expandedRemarks.has(cust.id) ? (
                                    <div>
                                      <div className="whitespace-pre-wrap break-words mb-1">
                                        {cust.latestCall.formDetail.remarks}
                                      </div>
                                      <button
                                        onClick={() =>
                                          toggleRemarksExpansion(cust.id)
                                        }
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                      >
                                        show less
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <span>
                                        {cust.latestCall.formDetail.remarks.substring(
                                          0,
                                          30
                                        )}
                                        ...
                                      </span>
                                      <button
                                        onClick={() =>
                                          toggleRemarksExpansion(cust.id)
                                        }
                                        className="ml-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                      >
                                        read more
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span>
                                  {cust.latestCall.formDetail.remarks}
                                </span>
                              )
                            ) : (
                              "No remarks"
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          No call history
                        </div>
                      )}
                    </td>

                    {/* Form Status (Updated to show "-" instead of "No Call") */}
                    <td className="px-4 py-3">
                      <span
                        className={getFormStatusBadge(getFormStatus(cust))}
                      >
                        {getStatusDisplayText(getFormStatus(cust))}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={async () =>
                            await handleCall(
                              cust.phone,
                              ""
                            )
                          }
                          disabled={!cust.phone}
                          className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-white focus:outline-none focus:ring-1 focus:ring-offset-1 ${cust.phone
                            ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                            : "bg-gray-400 cursor-not-allowed"
                            }`}
                          title={
                            !cust.phone
                              ? "No phone number"
                              : "Click to call"
                          }
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </button>

                        <button
                          onClick={() => handleViewDetails(cust)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compact Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevPage}
              className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className="ml-3 relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalRecords)} of{" "}
                {totalRecords}
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxVisiblePages / 2)
                  );
                  let endPage = Math.min(
                    totalPages,
                    startPage + maxVisiblePages - 1
                  );

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`relative inline-flex items-center px-3 py-1 border text-xs font-medium ${i === currentPage
                          ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-indigo-600" />
                  Customer Details - {selectedCustomer.name}
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Trader Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Trader Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer ID:</span>
                      <span className="font-medium">{selectedCustomer.id}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-gray-600">Code:</span>
                      <span className="font-medium">{selectedTrader.Code}</span>
                    </div> */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer Name:</span>
                      <span className="font-medium">
                        {selectedCustomer.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">
                        {selectedCustomer.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact Number:</span>
                      <span className="font-medium">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">
                        {selectedCustomer.address}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Form Status:</span>
                      <span
                        className={getFormStatusBadge(
                          getFormStatus(selectedCustomer)
                        )}
                      >
                        {getStatusDisplayText(getFormStatus(selectedCustomer))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Latest Call Information */}
                {selectedCustomer.latestCall ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Latest Call Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call ID:</span>
                        <span className="font-medium">
                          {selectedCustomer.latestCall.CallId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Type:</span>
                        <span className="font-medium">
                          {"-"}
                          {/* {(selectedCustomer.latestCall.event === "call_end"
                            ? "Incoming call"
                            : selectedCustomer.latestCall.event) ||
                            selectedCustomer.latestCall.serviceType} */}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">
                          {

                            selectedCustomer.latestCall.Overall_Call_Duration

                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Call Type:</span>
                        <span className="font-medium">
                          {selectedCustomer.latestCall.Call_Type}
                        </span>
                      </div>

                      {/* Recording */}
                      {((selectedCustomer.latestCall.Recording &&
                        selectedCustomer.latestCall.Recording !== null) ||
                        (selectedCustomer.latestCall.recordingUrl &&
                          selectedCustomer.latestCall.recordingUrl !==
                          null)) && (
                          <div className="pt-2">
                            <span className="text-gray-600 text-sm">
                              Call Recording:
                            </span>
                            <div className="mt-1">
                              <a
                                href={
                                  selectedCustomer.latestCall.Recording ||
                                  selectedCustomer.latestCall.recordingUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Play Recording
                              </a>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Call History
                    </h3>
                    <div className="text-center text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No call history available</p>
                    </div>
                  </div>
                )}


                {/* Form Details Section */}
                {selectedCustomer.formDetail && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="text-purple-600" size={20} />
                      Form Details
                    </h3>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 p-6">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Inquiry Number</label>
                            <p className="text-sm text-gray-800 mt-1">{selectedCustomer.formDetail.inquiryNumber || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Call Type</label>
                            <p className="text-sm text-gray-800 mt-1">{selectedCustomer.formDetail.callType || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Support Type</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.SupportType?.supportName || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Query Type</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.QueryType?.queryName || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Source Type</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.SourceType?.sourceName || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                          {/* Status */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Status</label>
                            <span
                              className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full capitalize ${selectedCustomer.formDetail.status === "closed"
                                  ? "bg-green-100 text-green-800"
                                  : selectedCustomer.formDetail.status === "open"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {selectedCustomer.formDetail.status || "—"}
                            </span>
                          </div>

                          {/* Call Date & Time */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Call Date & Time</label>
                            <p className="mt-1 text-sm text-gray-800">
                              {selectedCustomer.formDetail.callDateTime
                                ? moment(selectedCustomer.formDetail.callDateTime).local().format("DD/MM/YYYY hh:mm:ss A")
                                : "—"}
                            </p>
                          </div>

                          {/* Follow-up Date */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Follow-up Date</label>
                            <p className="mt-1 text-sm text-gray-800">
                              {selectedCustomer.formDetail.followUpDate
                                ? moment(selectedCustomer.formDetail.followUpDate).local().format("DD/MM/YYYY")
                                : "—"}
                            </p>
                          </div>

                          {/* Employee ID */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Employee ID</label>
                            <p className="mt-1 text-sm text-gray-800">
                              {selectedCustomer.formDetail.EmployeeId || "—"}
                            </p>
                          </div>

                          {/* Call ID */}
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Call ID</label>
                            <p className="mt-1 text-sm text-gray-700 font-mono break-all text-xs">
                              {selectedCustomer.formDetail.CallId || "—"}
                            </p>
                          </div>

                        </div>


                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Remarks</label>
                          <p className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded-md">
                            {selectedCustomer.formDetail.remarks || "No remarks provided"}
                          </p>
                        </div>

                        {selectedCustomer.formDetail.attachments && (
                          <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Attachments</label>
                            <p className="text-sm text-gray-800 mt-1">{selectedCustomer.formDetail.attachments}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative: Always show form details if they exist (regardless of call records) */}
                {/* {selectedCustomer.formDetail && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="text-purple-600" size={20} />
                      Form Details
                    </h3>
                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                      <div className="grid grid-cols-2 gap-4 p-6">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Inquiry Number</label>
                            <p className="text-sm text-gray-800 mt-1">{selectedCustomer.formDetail.inquiryNumber || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Call Type</label>
                            <p className="text-sm text-gray-800 mt-1">{selectedCustomer.formDetail.callType || "—"}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Support Type</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.SupportType?.supportName || "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Query Type</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.QueryType?.queryName || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full capitalize mt-1 ${selectedCustomer.formDetail.status === "closed"
                                  ? "bg-green-100 text-green-800"
                                  : selectedCustomer.formDetail.status === "open"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                            >
                              {selectedCustomer.formDetail.status || "—"}
                            </span>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Call Date & Time</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.callDateTime
                                ? moment(selectedCustomer.formDetail.callDateTime).local().format("DD/MM/YYYY hh:mm:ss A")
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Follow-up Date</label>
                            <p className="text-sm text-gray-800 mt-1">
                              {selectedCustomer.formDetail.followUpDate
                                ? moment(selectedCustomer.formDetail.followUpDate).local().format("DD/MM/YYYY")
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Employee ID</label>
                            <p className="text-sm text-gray-800 mt-1">{selectedCustomer.formDetail.EmployeeId || "—"}</p>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Remarks</label>
                          <p className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded-md">
                            {selectedCustomer.formDetail.remarks || "No remarks provided"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-3">
                  {/* {selectedCustomer.phone && (
                    <button
                      onClick={async () => {
                        await handleCall(
                          selectedCustomer.phone,
                          ""
                        );
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Now
                    </button>
                  )} */}
                </div>
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
      )
      }

    </div >
  );
};

export default ContactsPage;