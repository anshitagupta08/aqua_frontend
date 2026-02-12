import React, { useState, useContext } from "react";
import { User, Phone, MapPin, AlertCircle } from "lucide-react";
import DialerContext from "../../context/Dashboard/DialerContext";

const CustomerManualEntry = ({ onSave, isSaving, saveError, onCancel, searchTerm }) => {
  // Get phone number from session context
  const { getCurrentSession } = useContext(DialerContext);

  const getPhoneNumber = () => {
    const session = getCurrentSession();
    return session?.callerNumber || "";
  };

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: getPhoneNumber() || searchTerm,
    address: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean phone number and prepare data
    const cleanedPhone = formData.phoneNumber.replace(/\D/g, "");

    onSave({
      name: formData.name.trim(),
      phoneNumber: cleanedPhone,
      address: formData.address.trim(),
      email: formData.email.trim() || null,
    });
  };

  const handleCancel = () => {
    const hasData =
      formData.name.trim() || formData.address.trim() || formData.email.trim();

    if (hasData) {
      if (
        window.confirm(
          "Are you sure you want to cancel? The entered data will be lost."
        )
      ) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  return (
    <div className="border-b border-blue-200 bg-blue-50 relative">
      {/* Loading overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Saving customer...</p>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Add New Customer
              </h3>
              <p className="text-sm text-blue-700">
                Customer not found. Please enter their details below.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
          >
            Skip
          </button>
        </div>

        {/* Save Error */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  className={`pl-10 pr-3 py-2 w-full text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  placeholder="Enter customer name"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone Number (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  readOnly
                  className="pl-10 pr-3 py-2 w-full text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Phone number from call"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From current call session
              </p>
            </div>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSaving}
              className={`px-3 py-2 w-full text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isSaving ? "opacity-50 cursor-not-allowed" : "border-gray-300"
              }`}
              placeholder="customer@example.com"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={isSaving}
                rows={3}
                className={`pl-10 pr-3 py-2 w-full text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${
                  errors.address ? "border-red-500" : "border-gray-300"
                } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                placeholder="Enter customer address"
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isSaving ? "Saving..." : "Save Customer"}</span>
            </button>
          </div>
        </form>

        {/* Session Info */}
        {getCurrentSession()?.sessionId && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="bg-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">
                Current Session
              </p>
              <p className="text-xs text-blue-700 font-mono mt-1">
                {getCurrentSession().sessionId.slice(-12)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManualEntry;
