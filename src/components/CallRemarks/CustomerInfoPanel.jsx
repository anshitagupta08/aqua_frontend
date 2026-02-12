import React, { useContext } from "react";
import { User, Phone, Mail, MapPin, Hash, Calendar, Award } from "lucide-react";
import DialerContext from "../../context/Dashboard/DialerContext";

  // Helper function to get grade styling
const getGradeStyle = (grade) => {
  const styles = {
    "Premium": {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: "text-purple-500",
      border: "border-purple-200"
    },
    "Gold": {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: "text-yellow-500",
      border: "border-yellow-200"
    },
    "Silver": {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: "text-gray-500",
      border: "border-gray-200"
    },
    "Inactive": {
      bg: "bg-red-50",
      text: "text-red-700",
      icon: "text-red-400",
      border: "border-red-200"
    }
  };
  return styles[grade] || styles["Inactive"];
};

const CustomerInfoPanel = ({ customerData }) => {
  // Get phone number from session context
  const { getCurrentSession } = useContext(DialerContext);

  const getPhoneNumber = () => {
    const session = getCurrentSession();
    return session?.callerNumber || customerData.phoneNumber || "Unknown";
  };



  if (!customerData) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="font-medium text-gray-900 mb-2">
            No Customer Information
          </h4>
          <p className="text-sm text-gray-500">
            No customer details found for this number.
          </p>
        </div>
      </div>
    );
  }

  const gradeStyle = getGradeStyle(customerData.grade);

  return (
    <div className="p-4 space-y-6">
      {/* Customer Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {customerData.name}
          </h4>
          <p className="text-sm text-gray-500">Customer Information</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-1">
          Contact Details
        </h5>
        <div className="space-y-3">
          {/* Phone Number */}
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-sm font-medium text-gray-900">
                {getPhoneNumber() }
              </span>
              <p className="text-xs text-gray-500">Phone Number</p>
            </div>
          </div>

          {/* Email */}
          {customerData.email && customerData.email !== "N/A" && (
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-900">
                  {customerData.email}
                </span>
                <p className="text-xs text-gray-500">Email Address</p>
              </div>
            </div>
          )}

          {/* Address */}
          {customerData.address && customerData.address !== "N/A" && (
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <span className="text-sm text-gray-900">
                  {customerData.address}
                </span>
                <p className="text-xs text-gray-500">Address</p>
                {customerData.placeName && customerData.placeName !== "N/A" && (
                  <p className="text-xs text-gray-500 mt-1">
                    {customerData.placeName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-1">
          Account Details
        </h5>
        <div className="space-y-3">

          {/* Customer Grade */}
          {customerData.grade && customerData.grade !== "N/A" && (
            <div className="flex items-center space-x-3">
              <Award className={`w-4 h-4 ${gradeStyle.icon}`} />
              <div>
                <span className={`text-sm font-medium ${gradeStyle.text}`}>
                  {customerData.grade}
                </span>
                <p className="text-xs text-gray-500">Customer Grade</p>
              </div>
            </div>
          )}

          {/* Account ID */}
          {customerData.accountId && customerData.accountId !== "N/A" && (
            <div className="flex items-center space-x-3">
              <Hash className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-900">
                  {customerData.accountId}
                </span>
                <p className="text-xs text-gray-500">Account ID</p>
              </div>
            </div>
          )}

          {/* Status */}
          {customerData.status && (
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  customerData.status === "Active"
                    ? "bg-green-500"
                    : "bg-gray-400"
                }`}
              />
              <div>
                <span
                  className={`text-sm font-medium ${
                    customerData.status === "Active"
                      ? "text-green-700"
                      : "text-gray-700"
                  }`}
                >
                  {customerData.status}
                </span>
                <p className="text-xs text-gray-500">Account Status</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Information */}
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900 text-sm border-b border-gray-200 pb-1">
          Call Session
        </h5>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <span className="text-sm text-gray-900">
                {new Date().toLocaleDateString()}
              </span>
              <p className="text-xs text-gray-500">Today's Date</p>
            </div>
          </div>

          {getCurrentSession()?.sessionId && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Session ID</p>
              <p className="text-sm font-mono text-gray-700">
                {getCurrentSession().sessionId.slice(-12)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoPanel;
