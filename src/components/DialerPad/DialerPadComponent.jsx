import React, { useState, useRef, useEffect } from "react";
import { Phone, PhoneCall, ArrowLeft } from "lucide-react";

const DialerPadComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const inputRef = useRef(null);

  const dialPadNumbers = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "*",
    "0",
    "#",
  ];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleNumberClick = (number) => {
    setPhoneNumber((prev) => prev + number);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber) {
      alert(`Calling ${phoneNumber}...`);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9*#+]/g, "");
    setPhoneNumber(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && phoneNumber) {
      handleCall();
    } else if (e.key === "Backspace") {
      handleBackspace();
    }
  };

  const formatIndianNumber = (number) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      const match = cleaned.match(/^(\d{0,5})(\d{0,5})$/);
      if (!match) return number;
      const [, first, second] = match;
      if (second) return `${first} ${second}`;
      return first;
    } else {
      // For numbers with country code
      const match = cleaned.match(/^(\d{1,3})(\d{0,5})(\d{0,5})$/);
      if (!match) return number;
      const [, country, first, second] = match;
      if (second) return `+${country} ${first} ${second}`;
      if (first) return `+${country} ${first}`;
      return `+${country}`;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-sm transform animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">
              Phone Dialer
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Phone Number Input */}
          <div className="px-6 py-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={phoneNumber}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Enter phone number"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xl font-mono text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <div className="text-center mt-2 text-sm text-gray-500">
                {phoneNumber && formatIndianNumber(phoneNumber)}
              </div>
            </div>
          </div>

          {/* Dial Pad */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {dialPadNumbers.map((number) => (
                <button
                  key={number}
                  onClick={() => handleNumberClick(number)}
                  className="group bg-gray-50 hover:bg-blue-50 active:bg-blue-100 border border-gray-200 hover:border-blue-300 rounded-2xl p-4 flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <span className="text-2xl font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                    {number}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between px-6 pb-6">
            <button
              onClick={handleBackspace}
              disabled={!phoneNumber}
              className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <button
              onClick={handleCall}
              disabled={!phoneNumber}
              className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 p-4 rounded-full shadow-lg hover:shadow-green-500/25 disabled:shadow-none transition-all duration-200 transform hover:scale-110 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <PhoneCall
                size={28}
                className="text-white group-hover:rotate-12 transition-transform duration-300"
              />
            </button>
            <div className="w-16"></div> {/* Spacer for symmetry */}
          </div>

          {/* India-specific helper text */}
          <div className="px-6 pb-4 text-center">
            <p className="text-xs text-gray-500">
              Enter 10-digit mobile number or include +91 for country code
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DialerPadComponent;
