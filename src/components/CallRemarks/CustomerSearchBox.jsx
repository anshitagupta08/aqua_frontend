import React, { useState, useEffect, useContext } from "react";
import {
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  User,
} from "lucide-react";
import DialerContext from "../../context/Dashboard/DialerContext";

const CustomerSearchBox = ({
  onSearch,
  isSearching,
  searchError,
  hasResults,
  setSearchTermNumber
}) => {
  // Get phone number from session context
  const { getCurrentSession } = useContext(DialerContext);

  const [searchTerm, setSearchTerm] = useState("");

  // Get current phone number from session
  const getCurrentPhoneNumber = () => {
    const session = getCurrentSession();
    return session?.callerNumber || "";
  };

  // Auto-fill with current number when available
  useEffect(() => {
    const currentNumber = getCurrentPhoneNumber();
    if (currentNumber && !searchTerm) {
      setSearchTerm(currentNumber);
    }
  }, [getCurrentSession]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSearchTermNumber(e.target.value);
  };

  const handleQuickSearch = () => {
    const currentNumber = getCurrentPhoneNumber();
    if (currentNumber) {
      setSearchTerm(currentNumber);
      onSearch(currentNumber);
    }
  };

  // Status icon based on search state
  const getStatusIcon = () => {
    if (isSearching) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (hasResults) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (searchError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Search className="w-4 h-4 text-gray-400" />;
  };

  // Input styling based on state
  const getInputStyling = () => {
    if (searchError) {
      return "border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500";
    }
    if (hasResults) {
      return "border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500";
    }
    return "border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500";
  };

  const currentNumber = getCurrentPhoneNumber();
  const isCurrentNumber = searchTerm === currentNumber;

  return (
    <div className="space-y-3">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Customer ID or Phone Number..."
            className={`w-full pl-10 pr-10 py-2 text-sm border rounded-lg transition-colors ${getInputStyling()}`}
            disabled={isSearching}
          />

          {/* Search icon on left */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

          {/* Status icon on right */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isSearching || !searchTerm.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Actions */}
      {currentNumber && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Current Call</p>
              <p className="text-xs text-blue-700">{currentNumber}</p>
            </div>
          </div>

          {!isCurrentNumber && (
            <button
              onClick={handleQuickSearch}
              disabled={isSearching}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Search This Number
            </button>
          )}

          {isCurrentNumber && !isSearching && (
            <div className="flex items-center space-x-1 text-xs text-blue-700">
              <CheckCircle className="w-3 h-3" />
              <span>Current number loaded</span>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      <div className="space-y-2">
        {/* Error Message */}
        {searchError && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-900">Search Failed</p>
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {hasResults && !searchError && (
          <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Customer Found
              </p>
              <p className="text-sm text-green-700">
                Customer information loaded successfully
              </p>
            </div>
          </div>
        )}

        {/* Loading Message */}
        {isSearching && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-900">Searching...</p>
              <p className="text-sm text-blue-700">
                Looking up customer information
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Session Info */}
      {getCurrentSession()?.sessionId && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
            <User className="w-3 h-3" />
            <span>Session: {getCurrentSession().sessionId.slice(-8)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchBox;
