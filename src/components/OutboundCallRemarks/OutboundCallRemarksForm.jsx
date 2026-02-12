import React, { useState, useEffect, useContext } from 'react';
import { Phone, User, Calendar, FileText, AlertCircle, Tag, CheckCircle } from 'lucide-react';
import UserContext from '../../context/User/UserContext';
import DialerContext from '../../context/Dashboard/DialerContext';
import FormContext from '../../context/Dashboard/FormContext';

const OutboundCallRemarksForm = ({ customerData, onSubmit, onCancel, isCallEnded, searchTerm }) => {

  const { userData } = useContext(UserContext);
  const { getCurrentSession } = useContext(DialerContext);
  const {
    outgoingFormData: contextFormData,
    isOutgoingSubmitting,
    setIsOutgoingSubmitting,
    outgoingFormError,
    setOutgoingFormError,
    callTypes,
    attemptStatuses,
    dispositions,
    outcomeTagOptions,
    closureStatuses,
    loadingOutgoingOptions,
    submitOutgoingForm,
  } = useContext(FormContext);

  // Get session data
  const getCurrentPhoneNumber = () => {
    const session = getCurrentSession();
    return session?.callerNumber || "";
  };


  // Form state
  const [formData, setFormData] = useState({
    callTypeId: '',
    attemptStatusId: '',
    dispositionId: '',
    outcomeTagIds: '',
    closureStatusId: '',
    remarks: '',
    followUpDate: '',
    followUpRequired: false
  });

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


  const phoneNumber = getCurrentPhoneNumber() || searchTerm;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.callTypeId) {
      newErrors.callTypeId = 'Call type is required';
    }

    if (!formData.attemptStatusId) {
      newErrors.attemptStatusId = 'Call attempt status is required';
    }

    if (!formData.dispositionId) {
      newErrors.dispositionId = 'Call disposition is required when connected';
    }


    if (formData.followUpRequired && !formData.followUpDate) {
      newErrors.followUpDate = 'Follow-up date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOutgoingFormError('');

    if (!validateForm()) {
      return;
    }

    const session = getCurrentSession();
    const phoneNumber = getCurrentPhoneNumber() || searchTerm;

    const submissionData = {
      CallId: session?.sessionId || "",
      EmployeeId: userData?.EmployeeId || "",
      callDateTime: new Date().toISOString(),
      callType: "OutBound",
      callTypeId: parseInt(formData.callTypeId),
      attemptStatusId: parseInt(formData.attemptStatusId),
      dispositionId: formData.dispositionId ? parseInt(formData.dispositionId) : null,
      outcomeTagIds: formData.outcomeTagIds || null,
      closureStatusId: parseInt(formData.closureStatusId),
      remarks: formData.remarks,
      followUpRequired: formData.followUpRequired,
      followUpDate: formData.followUpDate || null,
      customerNumber: phoneNumber
    };


    try {
      setIsOutgoingSubmitting(true);

      await submitOutgoingForm(submissionData);

    } catch (error) {
      console.error('Submission error:', error);
      setOutgoingFormError('Failed to submit the call log. Please try again.');
    } finally {
      setIsOutgoingSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      // Reset form or navigate away
      setFormData({
        callTypeId: '',
        attemptStatusId: '',
        dispositionId: '',
        outcomeTagIds: [],
        closureStatusId: '',
        remarks: '',
        followUpDate: '',
        followUpRequired: false
      });
    }
  };

  const isConnected = formData.attemptStatusId === '1';


  return (
    <div className="relative">
      {/* Loading overlay */}
      {isOutgoingSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 font-medium">
              Submitting call log...
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Form Error */}
        {outgoingFormError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Submission Error
              </p>
              <p className="text-sm text-red-700">{outgoingFormError}</p>
            </div>
          </div>
        )}

        {/* Call Information Header */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Outbound Call Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Number:</span>
              <span className="font-medium text-gray-900">{phoneNumber}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Agent:</span>
              <span className="font-medium text-gray-900">{userData?.EmployeeName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Call Details */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Call Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type of Outbound Call */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Outbound Call <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="callTypeId"
                value={formData.callTypeId}
                onChange={handleInputChange}
                disabled={loadingOutgoingOptions?.callTypes}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.callTypeId ? "border-red-500" : "border-gray-300"
                  } ${loadingOutgoingOptions?.callTypes
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                  }`}
              >
                <option value="">
                  {loadingOutgoingOptions?.callTypes
                    ? "Loading..."
                    : "Select call type"}
                </option>
                {callTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
              {errors.callTypeId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.callTypeId}
                </p>
              )}
            </div>

            {/* Call Attempt Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Attempt Status <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="attemptStatusId"
                value={formData.attemptStatusId}
                onChange={handleInputChange}
                disabled={loadingOutgoingOptions?.attemptStatuses}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.attemptStatusId ? "border-red-500" : "border-gray-300"
                  } ${loadingOutgoingOptions?.attemptStatuses ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="">
                  {loadingOutgoingOptions?.attemptStatuses
                    ? "Loading..."
                    : "Select attempt status"}
                </option>
                {attemptStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.status_name}
                  </option>
                ))}
              </select>
              {errors.attemptStatusId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.attemptStatusId}
                </p>
              )}
            </div>
          </div>

          {/* Call Disposition - Only show if connected */}

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Call Disposition <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="dispositionId"
              value={formData.dispositionId}
              onChange={handleInputChange}
              disabled={loadingOutgoingOptions?.dispositions}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${errors.dispositionId ? "border-red-500" : "border-green-300"
                } ${loadingOutgoingOptions?.dispositions ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">
                {loadingOutgoingOptions?.dispositions
                  ? "Loading..."
                  : "Select call disposition"}
              </option>
              {dispositions.map((disposition) => (
                <option key={disposition.id} value={disposition.id}>
                  {disposition.disposition_name}
                </option>
              ))}
            </select>
            {errors.dispositionId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.dispositionId}
              </p>
            )}
          </div>


          {/* Additional Outcome Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Outcome Tags
            </label>

            <div className="space-y-2">
              {loadingOutgoingOptions?.outcomeTags ? (
                <p className="text-sm text-gray-500">Loading tags...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {outcomeTagOptions.map((tag) => {
                    const selectedIds = formData.outcomeTagIds
                      ? formData.outcomeTagIds.split(",")
                      : [];

                    const isChecked = selectedIds.includes(tag.id.toString());

                    return (
                      <label key={tag.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          name="outcomeTagIds"
                          value={tag.id}
                          checked={isChecked}
                          onChange={(e) => {
                            const currentIds = formData.outcomeTagIds
                              ? formData.outcomeTagIds.split(",")
                              : [];

                            let updatedIds;
                            if (e.target.checked) {
                              updatedIds = [...currentIds, tag.id.toString()];
                            } else {
                              updatedIds = currentIds.filter((id) => id !== tag.id.toString());
                            }

                            setFormData((prev) => ({
                              ...prev,
                              outcomeTagIds: updatedIds.join(","),
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">{tag.tag_name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {formData.outcomeTagIds && formData.outcomeTagIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.outcomeTagIds.split(",").map((tagId) => {
                  const tag = outcomeTagOptions.find(
                    (t) => t.id.toString() === tagId
                  );
                  return tag ? (
                    <span
                      key={tagId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag.tag_name}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>



          {/* Final Closure Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Final Closure Status
            </label>
            <select
              name="closureStatusId"
              value={formData.closureStatusId}
              onChange={handleInputChange}
              disabled={loadingOutgoingOptions?.closureStatuses}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.closureStatusId ? "border-red-500" : "border-gray-300"
                } ${loadingOutgoingOptions?.closureStatuses ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <option value="">
                {loadingOutgoingOptions?.closureStatuses
                  ? "Loading..."
                  : "Select closure status"}
              </option>
              {closureStatuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.status_name}
                </option>
              ))}
            </select>
            {errors.closureStatusId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.closureStatusId}
              </p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${errors.remarks ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Enter detailed remarks about the outbound call (minimum 2 characters)..."
            />
            {errors.remarks && (
              <p className="text-red-500 text-xs mt-1">{errors.remarks}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.remarks.length}/2 characters minimum
            </p>
          </div>
        </div>

        {/* Follow-up Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Follow-up Requirements
          </h3>

          <div className="space-y-4">
            {/* Follow-up Required Checkbox */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Follow-up call required
                </span>
              </label>
            </div>

            {/* Follow-up Date - Only show if follow-up is required */}
            {formData.followUpRequired && (
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
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> A follow-up task will be created for the specified date.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information Display */}
        {customerData && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
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
            disabled={isOutgoingSubmitting}
            className="px-6 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isOutgoingSubmitting}
            className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium order-1 sm:order-2"
          >
            {isOutgoingSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <CheckCircle className="w-4 h-4" />
            <span>
              <span>
                {isOutgoingSubmitting
                  ? "Submitting..."
                  : isCallEnded
                    ? "Save & Complete"
                    : "Save Remarks"}
              </span>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default OutboundCallRemarksForm;