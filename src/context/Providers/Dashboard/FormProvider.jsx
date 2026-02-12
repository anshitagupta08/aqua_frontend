import { useState, useEffect, useContext } from "react";
import FormContext from "../../Dashboard/FormContext";
import DialerContext from "../../Dashboard/DialerContext";
import UserContext from "../../User/UserContext";
import axiosInstance from "../../../library/axios";
import { UPDATE_FOLLOW_UP } from "../../../library/constans";

const FormProvider = ({ children }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [formError, setFormError] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);

  const [supportTypes, setSupportTypes] = useState([]);
  const [queryTypes, setQueryTypes] = useState([]);
  const [sourceTypes, setSourceTypes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const { userData } = useContext(UserContext);
  const dialerContext = useContext(DialerContext);

  const [mustCompleteForm, setMustCompleteForm] = useState(false);
  const [formCompletionRequired, setFormCompletionRequired] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // OUTGOING FORM STATES (new)
  const [isOutgoingFormOpen, setIsOutgoingFormOpen] = useState(false);
  const [isOutgoingSubmitting, setIsOutgoingSubmitting] = useState(false);
  const [outgoingFormData, setOutgoingFormData] = useState(null);
  const [outgoingFormError, setOutgoingFormError] = useState(null);
  const [lastOutgoingSubmission, setLastOutgoingSubmission] = useState(null);
  const [mustCompleteOutgoingForm, setMustCompleteOutgoingForm] = useState(false);
  const [outgoingFormCompletionRequired, setOutgoingFormCompletionRequired] = useState(false);
  const [isOutgoingFormSubmitted, setIsOutgoingFormSubmitted] = useState(false);

  const [callTypes, setCallTypes] = useState([]);
  const [attemptStatuses, setAttemptStatuses] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [outcomeTagOptions, setOutcomeTagOptions] = useState([]);
  const [closureStatuses, setClosureStatuses] = useState([]);
  const [loadingOutgoingOptions, setLoadingOutgoingOptions] = useState({
    callTypes: false,
    attemptStatuses: false,
    dispositions: false,
    outcomeTags: false,
    closureStatuses: false,

  });

  const [followUpFormData, setFollowUpFormData] = useState(null);
  const [followUpFormError, setFollowUpFormError] = useState(null);
  const [isFollowUpSubmitting, setIsFollowUpSubmitting] = useState(false);

  useEffect(() => {
    loadFormOptions();
    loadOutgoingFormOptions();
  }, []);

  // Update the useEffect that listens to dialer state changes in FormProvider.jsx

  useEffect(() => {
    const callStatus = dialerContext?.callStatus;
    const CALL_STATUS = dialerContext?.CALL_STATUS;
    const currentSessionId = dialerContext?.currentSessionId;

    //Incoming Call
    // Auto-open form when call is connected (but only if form wasn't already submitted)
    if (
      callStatus === CALL_STATUS?.CONNECTED &&
      !isFormOpen &&
      !mustCompleteForm
    ) {
      if (isFormSubmitted) {
        setIsFormSubmitted(false);
      }
      openFormForCall();
    }

    // Handle call ended
    if (callStatus === CALL_STATUS?.ENDED) {
      console.log("📝 FormProvider: Call ended, handling cleanup");

      // ✅ FIXED: If form was already submitted, close form and return to dashboard
      if (isFormSubmitted) {
        console.log(
          "📝 FormProvider: Form already submitted, closing form and returning to dashboard"
        );

        // Clear session immediately since form is done
        if (currentSessionId && dialerContext?.clearSession) {
          dialerContext.clearSession(currentSessionId);
          console.log(
            "🗑️ Session cleared after call ended (form was submitted)"
          );
        }

        // Close form and reset states after a brief delay
        setTimeout(() => {
          closeFormAfterSubmission();
        }, 1500); // Show success message briefly

        return; // Exit early, don't process other logic
      }

      // Handle call ended with form still open (unsaved changes)
      if (isFormOpen) {
        console.log(
          "📝 FormProvider: Call ended with form open, checking unsaved changes"
        );
        if (hasUnsavedChanges()) {
          console.log("📝 FormProvider: Setting form completion required");
          setMustCompleteForm(true);
          setFormCompletionRequired(true);
          setFormError(
            "Call ended. Please complete the form before proceeding."
          );
        } else {
          console.log("📝 FormProvider: No unsaved changes, closing form");
          closeForm();
        }
      }
    }

    // Clear completion requirements when call reconnects
    if (
      callStatus === CALL_STATUS?.CONNECTED &&
      (mustCompleteForm || formCompletionRequired)
    ) {
      console.log(
        "📝 FormProvider: New call connected, clearing previous completion requirements"
      );
      setMustCompleteForm(false);
      setFormCompletionRequired(false);
      setFormError(null);
    }

    //Outgoing Call
    if (
      callStatus === CALL_STATUS?.OUTGOING_CONNECTED &&
      !isOutgoingFormOpen &&
      !mustCompleteOutgoingForm
    ) {
      if (isOutgoingFormSubmitted) {
        setIsOutgoingFormSubmitted(false);
      }
      openOutgoingFormForCall();
    }

    // Handle call ended for outbound
    if (callStatus === CALL_STATUS?.OUTGOING_DISCONNECTED) {
      console.log("📝 FormProvider: Outbound call ended, handling cleanup");

      if (isOutgoingFormSubmitted) {
        console.log("📝 FormProvider: Outgoing form already submitted, closing form");
        if (currentSessionId && dialerContext?.clearSession) {
          dialerContext.clearSession(currentSessionId);
          console.log("🗑️ Session cleared after outbound call ended (form was submitted)");
        }
        setTimeout(() => {
          closeOutgoingFormAfterSubmission();
        }, 1500);
        return;
      }

      if (isOutgoingFormOpen) {
        console.log("📝 FormProvider: Outbound call ended with form open");
        if (hasUnsavedOutgoingChanges()) {
          setMustCompleteOutgoingForm(true);
          setOutgoingFormCompletionRequired(true);
          setOutgoingFormError("Call ended. Please complete the form before proceeding.");
        } else {
          closeOutgoingForm();
        }
      }
    }


    // Clear completion requirements when call reconnects
    if (
      callStatus === CALL_STATUS?.OUTGOING_CONNECTED &&
      (mustCompleteForm || formCompletionRequired || mustCompleteOutgoingForm || outgoingFormCompletionRequired)
    ) {
      console.log("📝 FormProvider: New call connected, clearing previous completion requirements");
      setMustCompleteForm(false);
      setFormCompletionRequired(false);
      setMustCompleteOutgoingForm(false);
      setOutgoingFormCompletionRequired(false);
      setFormError(null);
      setOutgoingFormError(null);
    }
  }, [
    dialerContext?.callStatus,
    dialerContext?.currentSessionId,
    isFormSubmitted,
    isFormOpen,
    isOutgoingFormSubmitted,
    isOutgoingFormOpen,
  ]);

  //Incoming
  const resetFormForNewCall = () => {
    console.log("📝 FormProvider: Resetting all form states for new call");

    setIsFormOpen(false);
    setFormData(null);
    setFormError(null);
    setIsFormSubmitted(false);
    setMustCompleteForm(false);
    setFormCompletionRequired(false);
    setIsSubmitting(false);
    setLastSubmission(null);

    console.log("✅ FormProvider: All form states reset for new call");
  };

  const openFormForCall = () => {
    const session = dialerContext?.getCurrentSession();

    if (!session?.sessionId || !session?.callerNumber) return;

    if (isFormSubmitted || isFormOpen) {
      console.log(
        "📝 FormProvider: Resetting form state before opening for new call"
      );
      resetFormForNewCall();
    }

    // Don't open if completion is required for previous call (should be cleared by reset above)
    if (mustCompleteForm) {
      console.log("📝 Form completion still required, forcing reset");
      resetFormForNewCall();
    }

    const initialFormData = {
      callId: session.sessionId,
      sessionId: session.sessionId,
      employeeId: userData?.EmployeeId,
      callerNumber: session.callerNumber,
      agentNumber: session.agentNumber,
      callDateTime: new Date().toISOString(),
      callType: "incoming",
      supportTypeId: "",
      inquiryNumber: session.callerNumber,
      queryTypeId: "",
      remarks: "",
      status: "closed",
      followUpDate: null,
      attachments: [],
    };

    setFormData(initialFormData);
    setIsFormOpen(true);
    setFormError(null);
    setIsFormSubmitted(false);
    setMustCompleteForm(false);
    setFormCompletionRequired(false);
  };

  //Outgoing
  const resetOutgoingFormForNewCall = () => {
    console.log("📝 FormProvider: Resetting all outgoing form states for new call");
    setIsOutgoingFormOpen(false);
    setOutgoingFormData(null);
    setOutgoingFormError(null);
    setIsOutgoingFormSubmitted(false);
    setMustCompleteOutgoingForm(false);
    setOutgoingFormCompletionRequired(false);
    setIsOutgoingSubmitting(false);
    setLastOutgoingSubmission(null);
  };

  const openOutgoingFormForCall = () => {
    const session = dialerContext?.getCurrentSession();
    if (!session?.sessionId || !session?.callerNumber) return;

    if (isOutgoingFormSubmitted || isOutgoingFormOpen) {
      resetOutgoingFormForNewCall();
    }

    if (mustCompleteOutgoingForm) {
      resetOutgoingFormForNewCall();
    }

    const initialOutgoingFormData = {
      callId: session.sessionId,
      sessionId: session.sessionId,
      employeeId: userData?.EmployeeId,
      callerNumber: session.callerNumber,
      agentNumber: session.agentNumber,
      callDateTime: new Date().toISOString(),
      callType: "outgoing",
      callTypeId: "",
      attemptStatusId: "",
      dispositionId: "",
      outcomeTagIds: [],
      closureStatusId: "",
      remarks: "",
      followUpDate: "",
      followUpRequired: false,
    };

    setOutgoingFormData(initialOutgoingFormData);
    setIsOutgoingFormOpen(true);
    setOutgoingFormError(null);
    setIsOutgoingFormSubmitted(false);
    setMustCompleteOutgoingForm(false);
    setOutgoingFormCompletionRequired(false);
  };

  const loadFormOptions = async () => {
    setLoadingOptions(true);
    try {
      const supportResponse = await axiosInstance.get("/support-types");
      if (supportResponse.data.success) {
        setSupportTypes(supportResponse.data.data || []);
      }

      const queryResponse = await axiosInstance.get("/query-types");
      if (queryResponse.data.success) {
        setQueryTypes(queryResponse.data.data || []);
      }

      const sourceResponse = await axiosInstance.get("/source-types");
      if (sourceResponse.data.success) {
        setSourceTypes(sourceResponse.data.data || []);
      }

    } catch {
      setFormError("Failed to load form options");
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadOutgoingFormOptions = async () => {
    try {
      setLoadingOutgoingOptions(prev => ({ ...prev, callTypes: true }));
      const callTypesResponse = await axiosInstance.get("/outbound-call-types");
      if (callTypesResponse.data.success) {
        setCallTypes(callTypesResponse.data.data || []);
      }

      setLoadingOutgoingOptions(prev => ({ ...prev, attemptStatuses: true }));
      const statusesResponse = await axiosInstance.get("/call-status");
      if (statusesResponse.data.success) {
        setAttemptStatuses(statusesResponse.data.data || []);
      }

      setLoadingOutgoingOptions(prev => ({ ...prev, dispositions: true }));
      const dispositionsResponse = await axiosInstance.get("/call-dispositions");
      if (dispositionsResponse.data.success) {
        setDispositions(dispositionsResponse.data.data || []);
      }

      setLoadingOutgoingOptions(prev => ({ ...prev, outcomeTags: true }));
      const outcomesResponse = await axiosInstance.get("/outcome-tags");
      if (outcomesResponse.data.success) {
        setOutcomeTagOptions(outcomesResponse.data.data || []);
      }

      setLoadingOutgoingOptions(prev => ({ ...prev, closureStatuses: true }));
      const closuresResponse = await axiosInstance.get("/closure-status");
      if (closuresResponse.data.success) {
        setClosureStatuses(closuresResponse.data.data || []);
      }

    } catch (error) {
      setOutgoingFormError("Failed to load outgoing form options");
    } finally {
      setLoadingOutgoingOptions({
        callTypes: false,
        attemptStatuses: false,
        dispositions: false,
        outcomeTags: false,
        closureStatuses: false,
      });
    }
  };

  const updateOutgoingFormField = (fieldName, value) => {
    if (!outgoingFormData) return;
    setOutgoingFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (outgoingFormError) setOutgoingFormError(null);
  };

  const updateFormField = (fieldName, value) => {
    if (!formData) return;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    if (formError) {
      setFormError(null);
    }
  };

  const addAttachment = (file) => {
    if (!formData) return false;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError("File size must be less than 10MB");
      return false;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError("File type not supported");
      return false;
    }

    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, file],
    }));

    return true;
  };

  const removeAttachment = (index) => {
    if (!formData) return;

    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (data) => {
    const errors = [];

    if (!data.supportTypeId) errors.push("Support type is required");
    if (!data.queryTypeId) errors.push("Query type is required");
    if (!data.remarks || data.remarks.trim().length < 10)
      errors.push("Remarks must be at least 10 characters");
    if (!data.status) errors.push("Status is required");
    if (data.status === "open" && !data.followUpDate)
      errors.push("Follow-up date is required for open tickets");

    return errors;
  };

  const validateOutgoingForm = (data) => {
    const errors = [];
    if (!data.callTypeId) errors.push("Call type is required");
    if (!data.attemptStatusId) errors.push("Call attempt status is required");
    if (!data.dispositionId) // Assuming '1' is connected status
      errors.push("Call disposition is required when connected");
    // if (data.followUpRequired && !data.followUpDate)
    //   errors.push("Follow-up date is required");
    return errors;
  };

  const submitForm = async (externalFormData = null) => {
    // Use external data if provided, otherwise use internal formData
    const dataToSubmit = externalFormData || formData;

    if (!dataToSubmit) {
      setFormError("No form data to submit");
      return false;
    }

    const validationErrors = validateForm(dataToSubmit);
    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(", "));
      return false;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log("📝 Submitting form data:", dataToSubmit);

      // Prepare API payload
      const apiPayload = {
        CallId:
          dataToSubmit.CallId || dataToSubmit.callId || dataToSubmit.sessionId,
        EmployeeId: dataToSubmit.EmployeeId || dataToSubmit.employeeId,
        callDateTime: dataToSubmit.callDateTime,
        callType: dataToSubmit.callType || "InBound",
        supportTypeId: parseInt(dataToSubmit.supportTypeId),
        inquiryNumber: dataToSubmit.inquiryNumber || "",
        queryTypeId: parseInt(dataToSubmit.queryTypeId),
        remarks: dataToSubmit.remarks,
        status: dataToSubmit.status,
        followUpDate: dataToSubmit.followUpDate || null,
        customerPhoneNumber: dataToSubmit.customerNumber,
        sourceTypeId: parseInt(dataToSubmit.sourceTypeId),
      };

      // Submit to API
      const response = await axiosInstance.post("/form-details", apiPayload, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Submission failed");
      }

      console.log("✅ Form submitted successfully:", response.data);

      setIsFormSubmitted(true);

      // Store submission data
      setLastSubmission({
        ...dataToSubmit,
        submittedAt: new Date(),
        response: response.data,
      });

      // Clear completion requirements
      setMustCompleteForm(false);
      setFormCompletionRequired(false);

      // ✅ FIXED: Only clear session if call has ended
      // Don't clear session while call is still active
      const callStatus = dialerContext?.callStatus;
      const CALL_STATUS = dialerContext?.CALL_STATUS;
      const sessionId = dataToSubmit.sessionId || dataToSubmit.CallId;

      if (
        callStatus === CALL_STATUS?.ENDED &&
        sessionId &&
        dialerContext?.clearSession
      ) {
        // Call has ended, safe to clear session
        dialerContext.clearSession(sessionId);
        console.log("🗑️ Session cleared after form submission (call ended)");
      } else if (sessionId) {
        // Call is still active, keep session but mark form as submitted
        console.log(
          "📝 Form submitted but keeping session (call still active)"
        );
      }

      // ✅ FIXED: Don't call closeForm() immediately after successful submission
      // Let the form stay open to show success message, especially if call is still active
      if (callStatus === CALL_STATUS?.ENDED) {
        // Only close form if call has already ended
        setTimeout(() => {
          closeFormAfterSubmission();
        }, 1500);
      }
      // If call is still active, keep form open showing success message

      return true;
    } catch (error) {
      console.error("❌ Form submission failed:", error);

      let errorMessage = "Submission failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOutgoingForm = async (externalFormData = null) => {
    const dataToSubmit = externalFormData || outgoingFormData;

    if (!dataToSubmit) {
      setOutgoingFormError("No form data to submit");
      return false;
    }

    const validationErrors = validateOutgoingForm(dataToSubmit);
    if (validationErrors.length > 0) {
      setOutgoingFormError(validationErrors.join(", "));
      return false;
    }

    setIsOutgoingSubmitting(true);
    setOutgoingFormError(null);

    try {
      const apiPayload = {
        CallId: dataToSubmit.CallId || dataToSubmit.callId || dataToSubmit.sessionId,
        EmployeeId: dataToSubmit.EmployeeId || dataToSubmit.employeeId,
        callDateTime: dataToSubmit.callDateTime,
        callType: "OutBound",
        callTypeId: parseInt(dataToSubmit.callTypeId),
        attemptStatusId: parseInt(dataToSubmit.attemptStatusId),
        dispositionId: dataToSubmit.dispositionId ? parseInt(dataToSubmit.dispositionId) : null,
        outcomeTagIds: dataToSubmit.outcomeTagIds || null,
        closureStatusId: parseInt(dataToSubmit.closureStatusId),
        remarks: dataToSubmit.remarks,
        followUpRequired: dataToSubmit.followUpRequired,
        followUpDate: dataToSubmit.followUpDate || null,
        customerNumber: dataToSubmit.customerNumber
      };

      const response = await axiosInstance.post("/outbound-form-details", apiPayload, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Submission failed");
      }

      setIsOutgoingFormSubmitted(true);
      setLastOutgoingSubmission({
        ...dataToSubmit,
        submittedAt: new Date(),
        response: response.data,
      });

      setMustCompleteOutgoingForm(false);
      setOutgoingFormCompletionRequired(false);

      const callStatus = dialerContext?.callStatus;
      const CALL_STATUS = dialerContext?.OUTGOING_CONNECTED;
      const sessionId = dataToSubmit.sessionId || dataToSubmit.CallId;

      if (callStatus === CALL_STATUS?.OUTGOING_DISCONNECTED && sessionId && dialerContext?.clearSession) {
        dialerContext.clearSession(sessionId);
      }

      if (callStatus === CALL_STATUS?.OUTGOING_DISCONNECTED) {
        setTimeout(() => {
          closeOutgoingFormAfterSubmission();
        }, 1500);
      }

      return true;
    } catch (error) {
      console.error("❌ Outgoing form submission failed:", error);
      let errorMessage = "Submission failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setOutgoingFormError(errorMessage);
      return false;
    } finally {
      setIsOutgoingSubmitting(false);
    }
  };

  const closeOutgoingFormAfterSubmission = () => {
    setIsOutgoingFormOpen(false);
    setOutgoingFormData(null);
    setOutgoingFormError(null);
    setMustCompleteOutgoingForm(false);
    setOutgoingFormCompletionRequired(false);
    setIsOutgoingFormSubmitted(false);
  };


  const closeFormAfterSubmission = () => {
    console.log("📝 FormProvider: closeFormAfterSubmission called");

    setIsFormOpen(false);
    setFormData(null);
    setFormError(null);
    setMustCompleteForm(false);
    setFormCompletionRequired(false);
    // Reset isFormSubmitted only when we're actually done with the form
    setIsFormSubmitted(false);

    console.log("📝 Form closed after successful submission");
  };

  const closeForm = () => {
    console.log("📝 FormProvider: closeForm called", {
      isFormOpen,
      isFormSubmitted,
      mustCompleteForm,
      formCompletionRequired,
      callStatus: dialerContext?.callStatus,
    });

    // Reset all form states
    setIsFormOpen(false);
    setFormData(null);
    setFormError(null);
    setMustCompleteForm(false);
    setFormCompletionRequired(false);

    // Note: Don't reset isFormSubmitted here, let the calling code control it
    // setIsFormSubmitted(false); // This will be handled by the caller when appropriate

    console.log("📝 Form closed and states reset");
  };

  const closeOutgoingForm = () => {
    setIsOutgoingFormOpen(false);
    setOutgoingFormData(null);
    setOutgoingFormError(null);
    setMustCompleteOutgoingForm(false);
    setOutgoingFormCompletionRequired(false);
  };

  const cancelForm = () => {
    if (mustCompleteForm || formCompletionRequired) {
      if (
        window.confirm(
          "This form must be completed because the call has ended. Are you sure you want to cancel? This may affect call reporting."
        )
      ) {
        setMustCompleteForm(false);
        setFormCompletionRequired(false);
        closeForm();

        if (formData?.sessionId && dialerContext?.clearSession) {
          dialerContext.clearSession(formData.sessionId);
        }
      }
      return;
    }

    if (hasUnsavedChanges()) {
      if (
        window.confirm(
          "Are you sure you want to cancel? All entered data will be lost."
        )
      ) {
        closeForm();
      }
    } else {
      closeForm();
    }
  };

  const cancelOutgoingForm = () => {
    if (mustCompleteOutgoingForm || outgoingFormCompletionRequired) {
      if (window.confirm("This form must be completed because the call has ended. Are you sure you want to cancel? This may affect call reporting.")) {
        setMustCompleteOutgoingForm(false);
        setOutgoingFormCompletionRequired(false);
        closeOutgoingForm();
        if (outgoingFormData?.sessionId && dialerContext?.clearSession) {
          dialerContext.clearSession(outgoingFormData.sessionId);
        }
      }
      return;
    }

    if (hasUnsavedOutgoingChanges()) {
      if (window.confirm("Are you sure you want to cancel? All entered data will be lost.")) {
        closeOutgoingForm();
      }
    } else {
      closeOutgoingForm();
    }
  };

  const forceCloseForm = () => {
    setIsFormSubmitted(false);
    closeForm();
  };

  const forceCloseOutgoingForm = () => {
    setIsOutgoingFormSubmitted(false);
    closeOutgoingForm();
  };

  const hasUnsavedChanges = () => {
    if (!formData) return false;

    return (
      (formData.remarks && formData.remarks.trim().length > 0) ||
      formData.supportTypeId ||
      formData.queryTypeId ||
      (formData.inquiryNumber && formData.inquiryNumber.trim().length > 0) ||
      (formData.attachments && formData.attachments.length > 0)
    );
  };

  const hasUnsavedOutgoingChanges = () => {
    if (!outgoingFormData) return false;
    return (
      (outgoingFormData.remarks && outgoingFormData.remarks.trim().length > 0) ||
      outgoingFormData.callTypeId ||
      outgoingFormData.attemptStatusId ||
      outgoingFormData.dispositionId ||
      outgoingFormData.closureStatusId ||
      (outgoingFormData.outcomeTagIds && outgoingFormData.outcomeTagIds.length > 0)
    );
  };

  const getFormValidation = () => {
    if (!formData) return { isValid: false, errors: [] };
    const errors = validateForm(formData);
    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const getOutgoingFormValidation = () => {
    if (!outgoingFormData) return { isValid: false, errors: [] };
    const errors = validateOutgoingForm(outgoingFormData);
    return { isValid: errors.length === 0, errors };
  };


  //FollowUp Submit
  const submitFollowUpForm = async (externalFormData = null) => {
    const dataToSubmit = externalFormData;

    if (!dataToSubmit) {
      setFollowUpFormError("No form data to submit");
      return false;
    }

    setIsFollowUpSubmitting(true);
    setFollowUpFormError(null);

    try {
      const apiPayload = {
        id: dataToSubmit?.id,
        type: dataToSubmit.type,
        remarks: dataToSubmit.remarks.trim()
      };

      if (dataToSubmit.type === "incoming_form") {
        apiPayload.status = dataToSubmit.status;
        apiPayload.followUpDate = dataToSubmit.status === "open" ? dataToSubmit.followUpDate : null;
      }

      // Add fields specific to outgoing form
      if (dataToSubmit.type === "outgoing_form") {
        apiPayload.followUpRequired = dataToSubmit.followUpRequired || false;
        apiPayload.followUpDate = dataToSubmit.followUpRequired ? dataToSubmit.followUpDate : null;
      }

      const response = await axiosInstance.post(`${UPDATE_FOLLOW_UP}/${dataToSubmit.type}/${dataToSubmit.id}`, apiPayload, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Submission failed");
      }

      setIsFollowUpSubmitting(true);

      return true;
    } catch (error) {
      console.error("❌ FollowUp form submission failed:", error);
      let errorMessage = "Submission failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setFollowUpFormError(errorMessage);
      return false;
    } finally {
      setIsFollowUpSubmitting(false);
    }
  };


  const value = {
    isFormOpen,
    setIsFormOpen,
    isSubmitting,
    formData,
    formError,
    lastSubmission,
    supportTypes,
    queryTypes,
    sourceTypes,
    loadingOptions,
    openFormForCall,
    updateFormField,
    addAttachment,
    removeAttachment,
    submitForm,
    closeForm,
    cancelForm,
    forceCloseForm,
    formCompletionRequired,
    mustCompleteForm,
    isFormSubmitted,
    hasUnsavedChanges,
    getFormValidation,
    validateForm,
    resetFormForNewCall,

    isOutgoingFormOpen,
    setIsOutgoingFormOpen,
    isOutgoingSubmitting,
    setIsOutgoingSubmitting,
    outgoingFormData,
    outgoingFormError,
    setOutgoingFormError,
    lastOutgoingSubmission,
    callTypes,
    attemptStatuses,
    dispositions,
    outcomeTagOptions,
    closureStatuses,
    loadingOutgoingOptions,
    openOutgoingFormForCall,
    updateOutgoingFormField,
    submitOutgoingForm,
    closeOutgoingForm,
    cancelOutgoingForm,
    forceCloseOutgoingForm,
    outgoingFormCompletionRequired,
    mustCompleteOutgoingForm,
    isOutgoingFormSubmitted,
    hasUnsavedOutgoingChanges,
    getOutgoingFormValidation,
    validateOutgoingForm,
    resetOutgoingFormForNewCall,

    submitFollowUpForm,
    followUpFormError,
    setFollowUpFormError,
    setIsFollowUpSubmitting,

    isFormReady: () =>
      !loadingOptions && supportTypes.length > 0 && queryTypes.length > 0,
    canSubmit: () => !isSubmitting && getFormValidation().isValid,

    isOutgoingFormReady: () =>
      !Object.values(loadingOutgoingOptions).some(loading => loading) &&
      callTypes.length > 0 && attemptStatuses.length > 0 && closureStatuses.length > 0,
    canSubmitOutgoing: () => !isOutgoingSubmitting && getOutgoingFormValidation().isValid,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export default FormProvider;
