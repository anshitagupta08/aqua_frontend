import React, { useState, useEffect, useContext } from "react";
import { AlertCircle, Phone, User, Calendar, FileText } from "lucide-react";
import DialerContext from "../../context/Dashboard/DialerContext";
import FormContext from "../../context/Dashboard/FormContext";
import UserContext from "../../context/User/UserContext";
import axiosInstance from "../../library/axios";
import { useLocation } from "react-router-dom";

const CallRemarksForm = ({ customerData, onSubmit, onCancel, isCallEnded, searchTerm }) => {
  // Context integration
  const { getCurrentSession } = useContext(DialerContext);
  const {
    formData: contextFormData,
    isSubmitting,
    formError,
    supportTypes,
    queryTypes,
    sourceTypes,
    loadingOptions,
  } = useContext(FormContext);
  const { userData } = useContext(UserContext);

  // Get session data
  const getCurrentPhoneNumber = () => {
    const session = getCurrentSession();
    return session?.callerNumber || "";
  };

  const location = useLocation();
  const { from } = location.state || {};

  

  // Local form state
  const [formData, setFormData] = useState({
    supportTypeId: "",
    queryTypeId: "",
    sourceTypeId: "",
    remarks: "",
    status: "closed",
    followUpDate: "",
  });

  const [localQueryTypes, setLocalQueryTypes] = useState([]);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [errors, setErrors] = useState({});


  // Initialize form data from context if available
  useEffect(() => {
    if (contextFormData) {
      setFormData((prev) => ({
        ...prev,
        supportTypeId: contextFormData.supportTypeId || "",
        queryTypeId: contextFormData.queryTypeId || "",
        remarks: contextFormData.remarks || "",
        status: contextFormData.status || "closed",
        followUpDate: contextFormData.followUpDate || "",
      }));
    }
  }, [contextFormData]);

  // Fetch query types when support type changes
  useEffect(() => {
    const fetchQueryTypes = async () => {
      if (!formData.supportTypeId) {
        setLocalQueryTypes([]);
        return;
      }

      try {
        setLoadingQuery(true);
        const response = await axiosInstance.get(
          `/query-types?supportTypeId=${formData.supportTypeId}`
        );
        if (response.data.success) {
          setLocalQueryTypes(response.data.data || []);
          // Reset query type selection when support type changes
          setFormData((prev) => ({ ...prev, queryTypeId: "" }));
        }
      } catch (error) {
        console.error("Error fetching query types:", error);
        setLocalQueryTypes([]);
      } finally {
        setLoadingQuery(false);
      }
    };

    fetchQueryTypes();
  }, [formData.supportTypeId]);

 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear follow-up date if status is changed to closed
    if (name === "status" && value === "closed") {
      setFormData((prev) => ({ ...prev, followUpDate: "" }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.supportTypeId) {
      newErrors.supportTypeId = "Support type is required";
    }

    if (!formData.queryTypeId) {
      newErrors.queryTypeId = "Query type is required";
    }

    if (!formData.remarks.trim()) {
      newErrors.remarks = "Remarks are required";
    } else if (formData.remarks.trim().length < 10) {
      newErrors.remarks = "Remarks must be at least 10 characters";
    }

    if (formData.status === "open" && !formData.followUpDate) {
      newErrors.followUpDate = "Follow-up date is required for open tickets";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    // Get session and user data
    const session = getCurrentSession();
    const phoneNumber = getCurrentPhoneNumber() || searchTerm;

    // Prepare submission data
    const submissionData = {
      // Session and user info
      CallId: session?.sessionId || "",
      EmployeeId: userData?.EmployeeId || "",
      callDateTime: new Date().toISOString(),
      callType: "InBound", // Always inbound for our use case

      // Form data
      supportTypeId: parseInt(formData.supportTypeId),
      queryTypeId: parseInt(formData.queryTypeId),
      inquiryNumber: phoneNumber,
      remarks: formData.remarks.trim(),
      status: formData.status,
      followUpDate: formData.followUpDate || null,
      sourceTypeId: formData.sourceTypeId || null,

      // Additional metadata
      customerData: customerData,
      submittedAt: new Date(),
    };

    // Call parent submit handler
    await onSubmit(submissionData);
  };

  const handleCancel = () => {
    const hasFormData =
      formData.supportTypeId ||
      formData.queryTypeId ||
      formData.remarks.trim() ||
      formData.followUpDate;

    onCancel(hasFormData);
  };

  const session = getCurrentSession();
  const phoneNumber = getCurrentPhoneNumber();

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 font-medium">
              Submitting remarks...
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Form Error */}
        {formError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Submission Error
              </p>
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          </div>
        )}

        {/* Call Information Header */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Call Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Number:</span>
              <span className="font-medium text-gray-900">
                {phoneNumber || "Unknown"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Agent:</span>
              <span className="font-medium text-gray-900">
                {userData?.EmployeeName || "Unknown"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          {session?.sessionId && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                Session:{" "}
                <span className="font-mono">
                  {session.sessionId.slice(-12)}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Source Selection */}
        {from === "contacts-directory" && (<div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Source Selection
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {/* Source Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                name="sourceTypeId"
                value={formData.sourceTypeId}
                onChange={handleInputChange}
                disabled={loadingOptions?.sourceTypes}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.supportTypeId ? "border-red-500" : "border-gray-300"
                  } ${loadingOptions?.sourceTypes
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
              >
                <option value="">
                  {loadingOptions?.sourceTypes
                    ? "Loading..."
                    : "Select source"}
                </option>
                {sourceTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.source_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>)}

        {/* Category Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Category Selection
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Support Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Type *
              </label>
              <select
                name="supportTypeId"
                value={formData.supportTypeId}
                onChange={handleInputChange}
                disabled={loadingOptions?.supportTypes}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.supportTypeId ? "border-red-500" : "border-gray-300"
                  } ${loadingOptions?.supportTypes
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
              >
                <option value="">
                  {loadingOptions?.supportTypes
                    ? "Loading..."
                    : "Select support type"}
                </option>
                {supportTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.supportName || type.name}
                  </option>
                ))}
              </select>
              {errors.supportTypeId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.supportTypeId}
                </p>
              )}
            </div>

            {/* Query Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Query Type *
              </label>
              <select
                name="queryTypeId"
                value={formData.queryTypeId}
                onChange={handleInputChange}
                disabled={loadingQuery || !formData.supportTypeId}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.queryTypeId ? "border-red-500" : "border-gray-300"
                  } ${loadingQuery ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="">
                  {!formData.supportTypeId
                    ? "Select support type first"
                    : loadingQuery
                      ? "Loading..."
                      : "Select query type"}
                </option>
                {localQueryTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.queryName || type.name}
                  </option>
                ))}
              </select>
              {errors.queryTypeId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.queryTypeId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Call Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Call Details
          </h3>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks *
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${errors.remarks ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter detailed remarks about the call (minimum 10 characters)..."
            />
            {errors.remarks && (
              <p className="text-red-500 text-xs mt-1">{errors.remarks}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.remarks.length}/10 characters minimum
            </p>
          </div>
        </div>

        {/* Status & Follow-up */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Status & Follow-up
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="closed">Closed</option>
                <option value="open">Open (Requires Follow-up)</option>
              </select>
            </div>

            {/* Follow-up Date - Only show if status is open */}
            {formData.status === "open" && (
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-2">
                  Follow-up Date *
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${errors.followUpDate ? "border-red-500" : "border-orange-300"
                    }`}
                />
                {errors.followUpDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.followUpDate}
                  </p>
                )}
              </div>
            )}
          </div>

          {formData.status === "open" && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Setting status to "Open" will create a
                follow-up task for the specified date.
              </p>
            </div>
          )}
        </div>

        {/* Customer Information Display */}
        {customerData && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>{" "}
                <span className="font-medium">{customerData.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>{" "}
                <span className="font-medium">{phoneNumber}</span>
              </div>
              {customerData.email && customerData.email !== "N/A" && (
                <div>
                  <span className="text-gray-600">Email:</span>{" "}
                  <span className="font-medium">{customerData.email}</span>
                </div>
              )}
              {customerData.accountId && customerData.accountId !== "N/A" && (
                <div>
                  <span className="text-gray-600">Account ID:</span>{" "}
                  <span className="font-medium">{customerData.accountId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium order-1 sm:order-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {isSubmitting
                ? "Submitting..."
                : isCallEnded
                  ? "Save & Complete"
                  : "Save Remarks"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CallRemarksForm;
