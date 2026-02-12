import React, { useState, useEffect, useContext } from "react";
import { ChevronRight } from "lucide-react";

// Context imports
import DialerContext from "../../context/Dashboard/DialerContext";
import FormContext from "../../context/Dashboard/FormContext";

// Component imports


import OrderDetailsPanel from "../CallRemarks/OrderDetailPanel";
import CustomerCallHistory from "../CallRemarks/CustomerCallHistory";
import CustomerSearchBox from "../CallRemarks/CustomerSearchBox";
import CustomerManualEntry from "../CallRemarks/CustomerManualEntry";
import axiosInstance from "../../library/axios";
import useDialer from "../../hooks/useDialer";
import useForm from "../../hooks/useForm";
import OutboundCallRemarksForm from "./OutboundCallRemarksForm";
import CustomerInfoPanel from "../CallRemarks/CustomerInfoPanel";
import { useLocation, useNavigate } from "react-router-dom";

const OutboundCallRemarksPage = () => {
  // Context data
  const { callStatus, isCallActive, getCurrentSession, CALL_STATUS, isOutgoingCallEnded } =
    useDialer();

  const {
    isFormOpen,
    isSubmitting,
    formError,
    submitForm,
    cancelForm,
    hasUnsavedChanges,
    mustCompleteForm,
    formCompletionRequired,
    isFormSubmitted,

    isOutgoingFormOpen,
    outgoingFormError,
    submitOutgoingForm,
    cancelOutgoingForm,
    hasUnsavedOutgoingChanges,
    mustCompleteOutgoingForm,
    outgoingFormCompletionRequired,
    isOutgoingFormSubmitted,
    resetOutgoingFormForNewCall,
  } = useForm();

  const location = useLocation();
  const { from } = location.state || {};

  const navigate = useNavigate();

  // UI state
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // Customer search states
  const [customerData, setCustomerData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Customer save states
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [customerSaveError, setCustomerSaveError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [searchTermNumber, setSearchTermNumber] = useState("");

  // Derived state
  const currentSession = getCurrentSession();
  const currentPhoneNumber = currentSession?.callerNumber || "Unknown";
  const currentSessionId = currentSession?.sessionId;
  const isCallEnded = callStatus === CALL_STATUS.ENDED || isOutgoingCallEnded;


  // Auto-search when session data is available
  useEffect(() => {
    if (
      currentPhoneNumber &&
      currentPhoneNumber !== "Unknown" &&
      !hasSearched
    ) {
      handleCustomerSearch(currentPhoneNumber);
    }
  }, [currentPhoneNumber, hasSearched]);

  // Reset search state when session changes
  useEffect(() => {
    if (currentPhoneNumber && currentPhoneNumber !== "Unknown") {
      setHasSearched(false);
      setCustomerData(null);
      setOrderData(null);
      setCallHistory([]);
      setSearchError(null);
      setCustomerSaveError(null);
      setShowManualEntry(false);
    }
  }, [currentSessionId]);

  // Check if customer exists by phone
  const checkCustomerExists = async (phoneNumber) => {
    try {
      const cleanedPhone = phoneNumber.replace(/\D/g, "");

      // Try direct phone check first
      try {
        const response = await axiosInstance.get(`/check-phone`, {
          params: { phone: cleanedPhone },
        });

        if (
          response.data.success &&
          response.data.exists &&
          response.data.data
        ) {
          return response.data.data;
        }
      } catch (phoneCheckError) {
        // Fallback to customer search
      }

      // Fallback: Search for existing customer
      const searchResponse = await axiosInstance.get(`/customer`, {
        params: { search: cleanedPhone },
      });

      if (
        searchResponse.data.success &&
        searchResponse.data.data.customers.length > 0
      ) {
        const exactMatch = searchResponse.data.data.customers.find(
          (customer) => {
            const customerPhone = customer.phone?.replace(/\D/g, "") || "";
            return customerPhone === cleanedPhone;
          }
        );

        if (exactMatch) {
          return exactMatch;
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking customer existence:", error);
      return null;
    }
  };

  // Save customer to database
  const saveCustomerToDatabase = async (customerInfo) => {
    try {
      setIsSavingCustomer(true);
      setCustomerSaveError(null);

      // Check if customer already exists
      const existingCustomer = await checkCustomerExists(
        customerInfo.phoneNumber
      );

      if (existingCustomer) {
        setCustomerSaveError("Customer already exists in our database");
        return existingCustomer;
      }

      const customerPayload = {
        name: customerInfo.name,
        phone: customerInfo.phoneNumber.replace(/\D/g, ""),
        address: customerInfo.address,
        email: customerInfo.email === "N/A" ? null : customerInfo.email,
      };

      const response = await axiosInstance.post("/customer", customerPayload);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to save customer");
      }
    } catch (error) {
      console.error("Error saving customer:", error);

      // Handle duplicate customer case
      if (
        error.response?.status === 409 ||
        error.message?.includes("duplicate") ||
        error.message?.includes("already exists")
      ) {
        const existingCustomer = await checkCustomerExists(
          customerInfo.phoneNumber
        );
        if (existingCustomer) {
          setCustomerSaveError("Customer already exists in our database");
          return existingCustomer;
        }
      }

      setCustomerSaveError(
        error.response?.data?.message ||
        "Failed to save customer information. Please try again."
      );
      throw error;
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Save customer to database
//   const searchCustomerAPI = async (searchTerm) => {
//   try {
//     let cleanedNumber = searchTerm.replace(/\D/g, "");

//     // Remove country code '91' if present
//     if (cleanedNumber.startsWith("91") && cleanedNumber.length === 12) {
//       cleanedNumber = cleanedNumber.substring(2);
//     }

//     // Remove leading zero if present
//     if (cleanedNumber.startsWith("0") && cleanedNumber.length === 11) {
//       cleanedNumber = cleanedNumber.substring(1);
//     }

//     const response = await axiosInstance.get(`/customer-info?mobile=${cleanedNumber}`);

//     if (response.status !== 200) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = response.data;

//     if (
//       result &&
//       result.message &&
//       result.data &&
//       Array.isArray(result.data) &&
//       result.data.length > 0
//     ) {
//       // Helper function to normalize grade
//       const normalizeGrade = (grade) => {
//         if (!grade || grade === "N.A" || grade === "N/A" || grade === "None") return "Inactive";
//         const gradeMap = {
//           "SILVR": "Silver",
//           "GOLD": "Gold",
//           "PIRME": "Premium",
//           "PRIME": "Premium"
//         };
//         return gradeMap[grade.toUpperCase()] || grade;
//       };

//       // ✅ Transform ALL customer records
//       const allCustomers = result.data.map((customerInfo) => ({
//         name: customerInfo.CustomerName || "N/A",
//         accountId: customerInfo.CustID || "N/A",
//         phoneNumber: customerInfo.Mobile || cleanedNumber,
//         email: customerInfo.Email || "N/A",
//         address: customerInfo.CustomerAddress || "N/A",
//         placeName: customerInfo.PlaceName || "N/A",
//         grade: normalizeGrade(customerInfo.Grade),
//         gradeRaw: customerInfo.Grade || "N/A",
//         status: "Active",
//         sales: customerInfo.Sales || []
//       }));

//       // ✅ Use the first customer as the primary one
//       const primaryCustomer = allCustomers[0];

//       // ✅ Transform all sales from the first customer
//       const transformedOrders =
//         Array.isArray(result.data[0].Sales) && result.data[0].Sales.length > 0
//           ? result.data[0].Sales.map((sale) => ({
//               orderId: sale.SaleId || "N/A",
//               branchId: sale.BranchId || "N/A",
//               posName: sale.POSName || "N/A",
//               orderDate: sale.CreatedDate
//                 ? new Date(sale.CreatedDate).toLocaleDateString()
//                 : "N/A",
//               deliveryStatus: sale.DeliveryStatus || "N/A",
//               deliveryStatusCode: sale.DeliveryStatusCode || "N/A",
//               totalAmount: sale.TotalAmount || 0,
//               deliveryCharge: sale.DeliveryCharge || 0,
//               items:
//                 Array.isArray(sale.SaleDetail) && sale.SaleDetail.length > 0
//                   ? sale.SaleDetail.map((item) => ({
//                       itemId: item.ItemID || "N/A",
//                       itemName: item.ItemName || "N/A",
//                       uom: item.UOM || "N/A",
//                       qty: item.Qty || 0,
//                       rate: item.Rate || 0,
//                       totalAmount: item.TotalAmount || 0,
//                     }))
//                   : [],
//             }))
//           : [];

//       // ✅ Transform call history
//       const transformedHistory = [];
//       if (result.callHistory) {
//         const { inbound = [], outbound = [] } = result.callHistory;

//         [...inbound, ...outbound].forEach((call) => {
//           transformedHistory.push({
//             type: call.type || "N/A",
//             date: call.date || "N/A",
//             startTime: call.startTime ? new Date(call.startTime) : null,
//             endTime: call.endTime ? new Date(call.endTime) : null,
//             duration: call.duration || "N/A",
//             status: call.status || "N/A",
//             agentNumber: call.agentNumber || "N/A",
//             customerNumber: call.customerNumber || cleanedNumber,
//             recording: call.recording || null,
//           });
//         });
//       }

//       // ✅ Auto-save primary customer
//       try {
//         await saveCustomerToDatabase(primaryCustomer);
//       } catch (saveError) {
//         console.warn("Customer auto-save failed:", saveError);
//       }

//       return {
//         customer: primaryCustomer,
//         allCustomers: allCustomers,
//         orders: transformedOrders,
//         history: transformedHistory,
//         source: result.source || "external_api",
//       };
//     } else {
//       return {
//         customer: null,
//         allCustomers: [],
//         orders: [],
//         history: [],
//         source: result?.source || "no_data",
//       };
//     }
//   } catch (error) {
//     console.error("API call failed:", error);
//     throw new Error(`Failed to fetch customer data: ${error.message}`);
//   }
// };

  // Search customer API
 const searchCustomerAPI = async (searchTerm) => {
  try {
    let cleanedNumber = searchTerm.replace(/\D/g, "");

    // Remove country code '91' if present
    if (cleanedNumber.startsWith("91") && cleanedNumber.length === 12) {
      cleanedNumber = cleanedNumber.substring(2);
    }

    // Remove leading zero if present
    if (cleanedNumber.startsWith("0") && cleanedNumber.length === 11) {
      cleanedNumber = cleanedNumber.substring(1);
    }

    const response = await axiosInstance.get(`/customer-info?mobile=${cleanedNumber}`);

    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = response.data;

    if (
      result &&
      result.message &&
      result.data &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      // Helper function to normalize grade
      const normalizeGrade = (grade) => {
        if (!grade || grade === "N.A" || grade === "N/A" || grade === "None") return "Inactive";
        const gradeMap = {
          "SILVR": "Silver",
          "GOLD": "Gold",
          "PIRME": "Premium",
          "PRIME": "Premium"
        };
        return gradeMap[grade.toUpperCase()] || grade;
      };

      // ✅ Transform ALL customer records
      const allCustomers = result.data.map((customerInfo) => ({
        name: customerInfo.CustomerName || "N/A",
        accountId: customerInfo.CustID || "N/A",
        phoneNumber: customerInfo.Mobile || cleanedNumber,
        email: customerInfo.Email || "N/A",
        address: customerInfo.CustomerAddress || "N/A",
        placeName: customerInfo.PlaceName || "N/A",
        grade: normalizeGrade(customerInfo.Grade),
        gradeRaw: customerInfo.Grade || "N/A",
        status: "Active",
        sales: customerInfo.Sales || []
      }));

      // ✅ Use the first customer as the primary one
      const primaryCustomer = allCustomers[0];

      // ✅ Transform all sales from the first customer
      const transformedOrders =
        Array.isArray(result.data[0].Sales) && result.data[0].Sales.length > 0
          ? result.data[0].Sales.map((sale) => ({
              orderId: sale.SaleId || "N/A",
              branchId: sale.BranchId || "N/A",
              posName: sale.POSName || "N/A",
              orderDate: sale.CreatedDate
                ? new Date(sale.CreatedDate).toLocaleDateString()
                : "N/A",
              deliveryStatus: sale.DeliveryStatus || "N/A",
              deliveryStatusCode: sale.DeliveryStatusCode || "N/A",
              totalAmount: sale.TotalAmount || 0,
              deliveryCharge: sale.DeliveryCharge || 0,
              items:
                Array.isArray(sale.SaleDetail) && sale.SaleDetail.length > 0
                  ? sale.SaleDetail.map((item) => ({
                      itemId: item.ItemID || "N/A",
                      itemName: item.ItemName || "N/A",
                      uom: item.UOM || "N/A",
                      qty: item.Qty || 0,
                      rate: item.Rate || 0,
                      totalAmount: item.TotalAmount || 0,
                    }))
                  : [],
            }))
          : [];

      // ✅ Transform call history
      const transformedHistory = [];
      if (result.callHistory) {
        const { inbound = [], outbound = [] } = result.callHistory;

        [...inbound, ...outbound].forEach((call) => {
          transformedHistory.push({
            type: call.type || "N/A",
            date: call.date || "N/A",
            startTime: call.startTime ? new Date(call.startTime) : null,
            endTime: call.endTime ? new Date(call.endTime) : null,
            duration: call.duration || "N/A",
            status: call.status || "N/A",
            agentNumber: call.agentNumber || "N/A",
            customerNumber: call.customerNumber || cleanedNumber,
            recording: call.recording || null,
          });
        });
      }

      // ✅ Auto-save primary customer
      try {
        await saveCustomerToDatabase(primaryCustomer);
      } catch (saveError) {
        console.warn("Customer auto-save failed:", saveError);
      }

      return {
        customer: primaryCustomer,
        allCustomers: allCustomers,
        orders: transformedOrders,
        history: transformedHistory,
        source: result.source || "external_api",
      };
    } else {
      return {
        customer: null,
        allCustomers: [],
        orders: [],
        history: [],
        source: result?.source || "no_data",
      };
    }
  } catch (error) {
    console.error("API call failed:", error);
    throw new Error(`Failed to fetch customer data: ${error.message}`);
  }
};

  // Handle customer search
  const handleCustomerSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchError("Please enter a customer ID or phone number");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setCustomerSaveError(null);

    try {
      const { customer, history, orders } = await searchCustomerAPI(
        searchTerm.trim()
      );
 

      if (customer || orders.length != 0) {
        setCustomerData(customer);
        setCallHistory(history);
        setOrderData(orders);
        setShowCustomerPanel(true);
        setSearchError(null);
        setShowManualEntry(false);
      } else {
        setCustomerData(null);
        setOrderData(null);
        setCallHistory([]);
        setSearchError(
          "Customer not found. Please check the ID or phone number."
        );
        setShowManualEntry(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchError("Search failed. Please try again.");
      setCustomerData(null);
      setOrderData(null);
      setCallHistory([]);
      setShowManualEntry(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle manual customer save
  const handleManualCustomerSave = async (manualCustomerData) => {
    try {
      const existingCustomer = await checkCustomerExists(
        manualCustomerData.phoneNumber
      );

      let savedCustomer;
      if (existingCustomer) {
        savedCustomer = existingCustomer;
        setCustomerSaveError("Customer already exists in our database");
      } else {
        savedCustomer = await saveCustomerToDatabase(manualCustomerData);
      }

      setCustomerData({
        name: savedCustomer.name,
        phoneNumber: savedCustomer.phone || manualCustomerData.phoneNumber,
        email: savedCustomer.email || "N/A",
        address: savedCustomer.address,
        accountId: savedCustomer.id,
        status: "Active",
      });

      setShowManualEntry(false);
      setShowCustomerPanel(true);
    } catch (error) {
      console.error("Failed to save manual customer data:", error);
    }
  };

  // Handle form submit
  const handleSubmit = async (formSubmissionData) => {
    try {
      const submissionData = {
        ...formSubmissionData,
        customerData: customerData,
        orderData: orderData,
        submittedAt: new Date(),
      };

      const success = await submitOutgoingForm(submissionData);

      if (success) {
        console.log(`Form submitted successfully:`, submissionData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Handle form cancel
  const handleCancel = (hasFormData) => {
    if (hasFormData) {
      if (
        window.confirm(
          "Are you sure you want to cancel? All form data will be lost."
        )
      ) {
        if (isCallActive()) {
          window.alert("Note: Disconnect the call first");
        } else {
          cancelOutgoingForm();
        }
      }
    } else {
      if (isCallActive()) {
        // setIsSubmitted(false);
      } else {
        cancelOutgoingForm();
      }
    }
  };

  // Determine if page should be shown
  const shouldShowPage =
    isOutgoingFormOpen
    ||
    isCallActive() ||
    hasUnsavedOutgoingChanges() ||
    mustCompleteOutgoingForm ||
    outgoingFormCompletionRequired;

  if (!shouldShowPage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ${showCustomerPanel ? "mr-[450px]" : ""
          }`}
      >
        <div className="p-4 lg:p-6">
          <div className="max-w-[680px] mx-auto h-full">
            <div className="bg-white rounded-lg shadow border border-gray-200 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Call Remarks & Details
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isCallEnded
                      ? "Call has ended. Please complete the remarks form to continue."
                      : "Please fill out the call details and remarks."}
                  </p>

                  {/* Status Indicators */}
                  {isCallEnded && hasUnsavedOutgoingChanges() && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        📞 Call disconnected - Form data will be saved once
                        submitted
                      </p>
                    </div>
                  )}

                  {outgoingFormError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">❌ {outgoingFormError}</p>
                    </div>
                  )}

                  {mustCompleteOutgoingForm && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ⚠️ <strong>Form completion required:</strong> The call
                        has ended but this form must be completed before you can
                        proceed.
                      </p>
                    </div>
                  )}

                  {outgoingFormCompletionRequired && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        📋 Please complete this form to finish processing the
                        call.
                      </p>
                    </div>
                  )}
                </div>

                {/* Customer Search Box */}
                <div className="ml-4">
                  <CustomerSearchBox
                    onSearch={handleCustomerSearch}
                    isSearching={isSearching}
                    searchError={searchError}
                    hasResults={customerData !== null}
                    setSearchTermNumber={setSearchTermNumber}
                  />
                </div>
              </div>

              {/* Manual Customer Entry */}
              {showManualEntry && (
                <div className="border-b border-gray-200">
                  <CustomerManualEntry
                    onSave={handleManualCustomerSave}
                    isSaving={isSavingCustomer}
                    saveError={customerSaveError}
                    onCancel={() => setShowManualEntry(false)}
                    searchTerm={searchTermNumber}
                  />
                </div>
              )}

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto">
                {!isOutgoingFormOpen && !isCallActive() && hasUnsavedOutgoingChanges() ? (
                  // Call ended but form has unsaved changes
                  <div className="p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-medium text-yellow-800 mb-2">
                        📞 Call Ended - Form Required
                      </h3>
                      <p className="text-sm text-yellow-700">
                        The call has ended but you haven't submitted the remarks
                        form yet. Please complete the form to finish processing
                        this call.
                      </p>
                    </div>
                    <OutboundCallRemarksForm
                      customerData={customerData}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      isCallEnded={isCallEnded}
                      searchTerm={searchTermNumber}
                    />
                  </div>
                ) : isOutgoingFormSubmitted ? (
                  // Form successfully submitted
                  <div className="p-6 text-center justify-center flex items-center h-full">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Form Submitted Successfully!
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Your call remarks have been saved.{" "}
                        {isCallEnded
                          ? "You can now return to the dashboard."
                          : "The call is still active."}
                      </p>
                      {/* ✅ ENHANCED: Always show button with smart behavior */}
                      <button
                        onClick={() => {
                          if (isCallEnded) {
                            // Call ended, safe to return to dashboard
                            cancelOutgoingForm();
                          } else if (from === "contacts-directory") {
                            resetOutgoingFormForNewCall();
                            navigate("/dashboard/contacts")
                          } else {
                            // Call still active, just show message
                            window.alert(
                              "Call is still active. Form will close automatically when call ends."
                            );
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {isCallEnded ? "Return to Dashboard" : "Acknowledge"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal form display
                  <OutboundCallRemarksForm
                    customerData={customerData}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isCallEnded={isCallEnded}
                    searchTerm={searchTermNumber}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Sliding Panel */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-[450px] bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${showCustomerPanel ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Customer Information
              </h3>
              <button
                onClick={() => setShowCustomerPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close customer panel"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex mt-4 space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "info"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Customer Info
              </button>
              <button
                onClick={() => setActiveTab("order")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "order"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Order Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "history"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Call History
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {customerData ? (
              activeTab === "info" ? (
                <CustomerInfoPanel customerData={customerData} />
              ) : activeTab === "order" ? (
                <OrderDetailsPanel
                  orderData={orderData}
                  customerData={customerData}
                />
              ) : (
                <CustomerCallHistory callHistory={callHistory} customerData={customerData} />
              )
            ) : (
              <div className="p-4 text-center">
                <div className="text-gray-500 text-sm">
                  {hasSearched
                    ? "No customer data found"
                    : "Search for customer information to view details"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutboundCallRemarksPage;
