import React, { useState, useEffect, useContext } from 'react';
import { AlertCircle, Phone, User, Calendar, FileText, CheckCircle, X, Loader2, Clock, PhoneIncoming, PhoneOutgoing, MessageSquare } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import FormContext from '../../../context/Dashboard/FormContext';

const FollowUpEditForm = ({ followUpData, onSubmit, onCancel }) => {

  const {
    submitFollowUpForm,
    setFollowUpFormError,
    setIsFollowUpSubmitting,
    followUpFormError
  } = useContext(FormContext);

  const [formData, setFormData] = useState({
    status: '',
    followUpDate: '',
    remarks: '',
    closureStatusId: '',
    outcomeTagIds: '',
    followUpRequired: false
  });

  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (followUpData) {
      if (followUpData.type === "incoming_form") {
        setFormData({
          status: followUpData?.data?.status || '',
          followUpRequired: followUpData?.data?.status === 'open',
          followUpDate: followUpData?.data?.followUpDate ? followUpData?.data?.followUpDate.split("T")[0] : "",
          remarks: followUpData?.data?.remarks || "",
          closureStatusId: '',
          outcomeTagIds: ''
        });
      } else {
        // outgoing_form
        setFormData({
          status: "",
          followUpRequired: followUpData?.data?.followUpRequired || false,
          followUpDate: followUpData?.data?.followUpDate ? followUpData?.data?.followUpDate.split("T")[0] : "",
          remarks: followUpData?.data?.remarks || "",
          closureStatusId: followUpData?.data?.closureStatusId || '',
          outcomeTagIds: followUpData?.data?.outcomeTagIds || ''
        });
      }
    }
  }, [followUpData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear follow-up date when status is closed (incoming form)
    if (name === 'status' && value === 'closed') {
      setFormData(prev => ({ ...prev, followUpDate: '' }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      followUpRequired: checked,
      // Clear follow-up date when checkbox is unchecked (outgoing form)
      followUpDate: checked ? prev.followUpDate : ''
    }));

    if (errors.followUpDate) {
      setErrors(prev => ({ ...prev, followUpDate: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation for incoming form
    if (followUpData.type === "incoming_form") {
      if (!formData.status) {
        newErrors.status = 'Status is required';
      }

      if (formData.status === 'open' && !formData.followUpDate) {
        newErrors.followUpDate = 'Follow-up date is required for open status';
      }
    }

    // Validation for outgoing form
    if (followUpData.type === "outgoing_form") {
      if (formData.followUpRequired && !formData.followUpDate) {
        newErrors.followUpDate = 'Follow-up date is required when follow-up is required';
      }
    }

    // Common validation for both types
    if (!formData.remarks.trim()) {
      newErrors.remarks = 'Remarks are required';
    } else if (formData.remarks.trim().length < 10) {
      newErrors.remarks = 'Remarks must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setFollowUpFormError('');

    if (!validateForm()) {
      return;
    }

    // Prepare submission data based on form type
    const submissionData = {
      id: followUpData?.data?.id,
      type: followUpData.type,
      remarks: formData.remarks.trim()
    };

    console.log(followUpData);


    // Add fields specific to incoming form
    if (followUpData.type === "incoming_form") {
      submissionData.status = formData.status;
      submissionData.followUpDate = formData.status === "open" ? formData.followUpDate : null;
    }

    // Add fields specific to outgoing form
    if (followUpData.type === "outgoing_form") {
      submissionData.followUpRequired = formData.followUpRequired || false;
      submissionData.followUpDate = formData.followUpRequired ? formData.followUpDate : null;

    }

    console.log(submissionData, '----------');

    try {
      setIsFollowUpSubmitting(true);
      const isSubmitted = await submitFollowUpForm(submissionData);
      
      if (isSubmitted) {
        navigate("/dashboard/followup-page"); // <-- whatever your main page path is
      }
    } catch (error) {
      console.error('Submission error:', error);
      setFollowUpFormError('Failed to update follow-up. Please try again.');
    } finally {
      setIsFollowUpSubmitting(false);
    }
  };

  console.log(followUpData);
  

  if (!followUpData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No follow-up data available</p>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg shadow-lg h-full flex flex-col" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 font-medium">
              Updating follow-up...
            </p>
          </div>
        </div>
      )}

      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          Edit Latest Follow-up
        </h2>
        <p className="text-xs text-gray-500">Update the most recent follow-up call</p>
      </div>

      <div className="p-3 space-y-4 overflow-y-auto flex-1">
        {followUpFormError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Update Error</p>
              <p className="text-sm text-red-700">{followUpFormError}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
          <div className="flex items-center space-x-3 mb-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Customer Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Number:</span>
              <span className="font-medium text-gray-900">
                {followUpData?.data?.customerNumber || followUpData?.data?.customerPhoneNumber || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">Call Date:</span>
              <span className="font-medium text-gray-900">
                {followUpData?.data?.callDateTime ? new Date(followUpData.data.callDateTime).toLocaleString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {followUpData.type === "incoming_form" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select status</option>
                  <option value="open">Open (Requires Follow-up)</option>
                  <option value="closed">Closed</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                )}
              </div>

              {formData.status === 'open' && (
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    Follow-up Date *
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${errors.followUpDate ? 'border-red-500' : 'border-orange-300'
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

            {formData.status === 'open' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-800">
                  <strong>Note:</strong> The follow-up will be rescheduled to the new date.
                </p>
              </div>
            )}
          </>
        )}

        {followUpData.type === "outgoing_form" && (
          <>
            <div className="p-3 border rounded-md bg-blue-50">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={handleCheckboxChange}
                />
                <span>Follow-up Required</span>
              </label>

              {formData.followUpRequired && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-orange-700 mb-1">
                    Follow-up Date *
                  </label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${errors.followUpDate ? 'border-red-500' : 'border-orange-300'
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

            {formData.followUpRequired && (
              <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-800">
                  <strong>Note:</strong> The follow-up will be rescheduled to the new date.
                </p>
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks *
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${errors.remarks ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Enter detailed remarks (minimum 10 characters)..."
          />
          {errors.remarks && (
            <p className="text-red-500 text-xs mt-1">{errors.remarks}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formData.remarks.length}/10 characters minimum
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
        {/* <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          Cancel
        </button> */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <CheckCircle className="w-4 h-4" />
          <span>{isSubmitting ? 'Updating...' : 'Update Follow-up'}</span>
        </button>
      </div>
    </div>
  );
};

const TimelineItem = ({ item, isLatest }) => {
  const isIncoming = item.type === 'incoming_form';
  const data = item.data;

  return (
    <div className="relative pb-8">
      <div className="relative flex items-start space-x-3">
        <div className="relative">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-4 ring-white ${isIncoming ? 'bg-green-100' : 'bg-blue-100'
            }`}>
            {isIncoming ? (
              <PhoneIncoming className="h-5 w-5 text-green-600" />
            ) : (
              <PhoneOutgoing className="h-5 w-5 text-blue-600" />
            )}
          </div>
          {!isLatest && (
            <div className="absolute top-10 left-5 -ml-px h-full w-0.5 bg-gray-300"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className={`bg-white rounded-lg shadow-sm border p-4 ${isLatest ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold ${isIncoming ? 'text-green-700' : 'text-blue-700'
                  }`}>
                  {isIncoming ? 'Incoming Call' : 'Outgoing Call'}
                </span>
                {isLatest && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Latest
                  </span>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {data.CallId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Call ID:</span>
                  <span className="font-medium text-gray-900">{data.CallId}</span>
                </div>
              )}

              {!isIncoming && data.followUpRequired !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Follow-up:</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${data.followUpRequired
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {data.followUpRequired ? 'Required' : 'Not Required'}
                  </span>
                </div>
              )}

              {data.followUpDate && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Follow-up Date:</span>
                  <span className="font-medium text-orange-600">
                    {new Date(data.followUpDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {data.callTypeId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Outbound Call Type:</span>
                  <span className="font-medium text-gray-900">{data?.OutboundCallType?.type_name}</span>
                </div>
              )}

              {data.dispositionId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Call Disposition:</span>
                  <span className="font-medium text-gray-900">{data?.CallDisposition?.disposition_name}</span>
                </div>
              )}

              {data.attemptStatusId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Call Attempt Status:</span>
                  <span className="font-medium text-gray-900">{data?.CallAttemptStatus?.status_name}</span>
                </div>
              )}

              {data.closureStatusId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Final Closure Status:</span>
                  <span className="font-medium text-gray-900">{data?.FinalClosureStatus?.status_name}</span>
                </div>
              )}

              {data.queryTypeId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Query Type:</span>
                  <span className="font-medium text-gray-900">{data?.QueryType?.queryName}</span>
                </div>
              )}

              {data.sourceTypeId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Source Type:</span>
                  <span className="font-medium text-gray-900">{data?.SourceType?.source_name}</span>
                </div>
              )}

              {data.supportTypeId && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Support Type:</span>
                  <span className="font-medium text-gray-900">{data?.SupportType?.supportName}</span>
                </div>
              )}

              {data.remarks && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Remarks:</p>
                      <p className="text-sm text-gray-700">{data.remarks}</p>
                    </div>
                  </div>
                </div>
              )}

              {data.status && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize font-medium ${data.status === 'closed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
                    }`}>
                    {data.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FollowUpEditDemo = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('9860065031');
  const [latestFollowUp, setLatestFollowUp] = useState(null);

  const params = useParams();


  const fetchHistoryTimeline = async (number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/call-history-details?number=${number}`);

      if (!response.ok) {
        throw new Error('Failed to fetch history data');
      }

      const data = await response.json();

      if (data.success) {
        setHistoryData(data.timeline);

        const followUps = data.timeline.filter(item => {
          const isOutgoing =
            item.type === "outgoing_form" && item.data?.followUpRequired === true;

          const isIncoming =
            item.type === "incoming_form" && item.data?.followUpDate;

          return isOutgoing || isIncoming;
        });

        // Get latest by timestamp
        const latestFollowUp =
          followUps.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )[0] || null;

        setLatestFollowUp(latestFollowUp);

      } else {
        setError('No data found for this number');
        setHistoryData([]);
        setLatestFollowUp(null);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load history data');
      setHistoryData([]);
      setLatestFollowUp(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryTimeline(params.number);

  }, []);

  const handleSubmit = async (data) => {
    console.log('Submitting update:', data);

    // Here you would make an API call to update the follow-up
    // Example: await fetch('http://localhost:5000/api/update-followup', { method: 'PUT', body: JSON.stringify(data) })

    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('Follow-up updated successfully!');

    // Refresh the history
    fetchHistoryTimeline(phoneNumber);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2">
      <div className="max-w-11xl mx-auto">


        {/* Phone Number Input */}
        {/* <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Phone Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => fetchHistoryTimeline(phoneNumber)}
              disabled={isLoading || !phoneNumber}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  Load History
                </>
              )}
            </button>
          </div>
        </div> */}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 text-lg">Loading call history...</p>
          </div>
        ) : historyData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Edit Form */}
            <div className="lg:sticky lg:top-2 h-fit">
              <FollowUpEditForm
                followUpData={latestFollowUp}
                onSubmit={handleSubmit}
                onCancel={() => { }}
              />
            </div>

            {/* Right Side - Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Call History Timeline</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {historyData.length} {historyData.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <Clock className="w-6 h-6 text-gray-400" />
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {historyData.map((item, index) => (
                  <TimelineItem
                    key={item.data.id || index}
                    item={item}
                    isLatest={index === 0}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg mb-2">No call history found</p>
            <p className="text-sm text-gray-500">Enter a phone number and click "Load History" to view data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpEditDemo;