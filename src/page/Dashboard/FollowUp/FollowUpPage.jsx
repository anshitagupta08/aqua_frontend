import React, { useContext, useEffect, useState } from "react";
import UserContext from "../../../context/User/UserContext";
import { ArrowBigDown, Edit2Icon, EyeIcon, Phone, PhoneIncoming, User } from "lucide-react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import { GET_FOLLOW_UP_CALL_REPORT } from "../../../library/constans";
import { useNavigate } from "react-router-dom";

const FollowUpPage = () => {
    const [callData, setCallData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('2025-11-18');
    const [endDate, setEndDate] = useState('2025-11-19');
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [expandedRemarks, setExpandedRemarks] = useState(new Set());

    const { userData } = useContext(UserContext);

    const isManager = userData?.EmployeeRole === 2;

    const navigate = useNavigate();

    const fetchFollowUpReportData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${GET_FOLLOW_UP_CALL_REPORT}`, {
                params: {
                    page: currentPage,
                    limit: pageSize,
                    search: searchTerm,
                    employeeId: userData?.EmployeeRole === 2 ? "" : userData?.EmployeeId,
                    fromDate: startDate,
                    toDate: endDate,
                    status: "open"
                }
            });

            if (response.data.success) {
                setCallData(response.data.data);
                setTotalPages(response.data.meta.totalPages);
                setTotalCount(response.data.meta.total);
                setPageSize(response.data.meta.limit);
            }
        } catch (error) {
            console.error("Error fetching calls:", error);
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        fetchFollowUpReportData();
    }, [currentPage, searchTerm, startDate, endDate]);

    const formatDateTime = (dateTime) => {
        if (!dateTime) return "N/A";

        let date;

        // If ISO date: 2025-11-18T00:00:00.000Z
        if (dateTime.includes("T")) {
            date = new Date(dateTime);
        } else {
            // If old format: 30/07/2025 15:24:26
            const [datePart, timePart] = dateTime.split(" ");
            const [day, month, year] = datePart.split("/").map(Number);
            const [hours, minutes, seconds] = timePart.split(":").map(Number);
            date = new Date(year, month - 1, day, hours, minutes, seconds);
        }

        const formattedDate = date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const formattedTime = date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });

        return `${formattedDate}, ${formattedTime}`;
    };

    const getStatusBadge = (status) => {
        if (status === "open") {
            return "bg-green-100 text-green-700 border border-green-300";
        }
        if (status === "closed") {
            return "bg-red-100 text-red-700 border border-red-300";
        }
        return "bg-gray-100 text-gray-700 border border-gray-300";
    };

    const getTypeBadge = (type) => {
        if (type === "Incoming") {
            return "bg-blue-100 text-blue-700 border border-blue-300";
        }
        if (type === "Outgoing") {
            return "bg-yellow-100 text-yellow-700 border border-yellow-300";
        }
        return "bg-gray-100 text-gray-700 border border-gray-300";
    };

    const handleRefresh = () => {
        fetchFollowUpReportData();
    };

    const handleViewDetails = (number) => {
        navigate(`/dashboard/followup-form/${number}`);
    };


    return (
        <>
            <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
                {/* Header Section */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="mb-6">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Follow-up Management</h1>
                                <p className="text-gray-600">Edit the latest follow-up and view complete call history</p>
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
                            </div>
                        </div>
                    </div>
                </div>


                {/* Calls List */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    {isLoading ? (
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
                                No Follow-up Records
                            </h3>
                            <p className="text-gray-600">
                                No calls match your search criteria
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone Number
                                        </th>
                                        {isManager && (
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Agent Info
                                            </th>
                                        )}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Call Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Remarks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>

                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {callData.map((call) => {
                                        return (
                                            <tr key={call.formId} className="hover:bg-gray-50">
                                                {/* Customer Name */}
                                                <td className="px-6 py-4">
                                                    {call.name || "-"}
                                                </td>

                                                {/* Customer Number */}
                                                <td className="px-6 py-4">
                                                    {call.number || "-"}
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
                                                                    {call.employee?.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 flex items-center">
                                                                    <Phone className="h-3 w-3 mr-1" />
                                                                    {call.employee?.mobile}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}

                                                {/* Call Type */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(
                                                            call.type
                                                        )}`}
                                                    >
                                                        {call.type}
                                                    </span>
                                                </td>

                                                {/* Call Status */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                                                            call.status
                                                        )}`}
                                                    >
                                                        {call.status ? call.status.toUpperCase() : "UNKNOWN"}
                                                    </span>
                                                </td>

                                                {/* Remarks */}
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {call.remark ? (
                                                            <div className="max-w-xs">
                                                                {call.remark.length > 50 ? (
                                                                    expandedRemarks.has(call.formId) ? (
                                                                        <div>
                                                                            <div className="whitespace-pre-wrap break-words mb-1">
                                                                                {call.remark}
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newExpanded = new Set(expandedRemarks);
                                                                                    newExpanded.delete(call.formId);
                                                                                    setExpandedRemarks(newExpanded);
                                                                                }}
                                                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                                                            >
                                                                                Show less
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div>
                                                                            <span>{call.remark.substring(0, 50)}...</span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newExpanded = new Set(expandedRemarks);
                                                                                    newExpanded.add(call.formId);
                                                                                    setExpandedRemarks(newExpanded);
                                                                                }}
                                                                                className="ml-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                                                                            >
                                                                                read more
                                                                            </button>
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    <span>{call.remark}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 italic">No remarks</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Date */}
                                                <td className="px-6 py-4">
                                                    {formatDateTime(call.time)}
                                                </td>

                                                {/* Action */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col space-y-1">
                                                        <button
                                                            onClick={() => handleViewDetails(call.number)}
                                                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500"
                                                        >
                                                            <Edit2Icon className="w-4 h-4 mr-1" />
                                                            Edit Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                            {/* Showing X to X of X */}
                            <div className="text-sm text-gray-600">
                                Showing{" "}
                                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                                {" "}to{" "}
                                <span className="font-medium">
                                    {Math.min(currentPage * pageSize, totalCount)}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">{totalCount}</span> results
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center space-x-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className={`px-3 py-1 text-sm rounded border 
                                        ${currentPage === 1
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-white hover:bg-gray-100"
                                        }`}
                                >
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-1 text-sm rounded border 
                                            ${currentPage === i + 1 ? "bg-indigo-600 text-white" : "bg-white hover:bg-gray-100"}
                                        `}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className={`px-3 py-1 text-sm rounded border 
                                        ${currentPage === totalPages
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            : "bg-white hover:bg-gray-100"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default FollowUpPage;