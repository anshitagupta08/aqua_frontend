import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-6 text-center">
            <h1 className="text-6xl font-extrabold text-blue-700 mb-2 animate-pulse">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">
                Page Not Found
            </h2>
            <p className="text-gray-600 max-w-md mb-8">
                Oops! The page you are looking for might have been removed, had its name changed,
                or is temporarily unavailable.
            </p>
            <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-full shadow-md transition-all duration-200"
            >
                <ArrowLeft size={20} />
                <span>Go Back Home</span>
            </button>
        </div>
    );
};

export default NotFound;
