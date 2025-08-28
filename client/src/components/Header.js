import React from 'react';
import { Wifi, CheckCircle, AlertCircle, Zap } from 'lucide-react';

const Header = ({ dataInitialized }) => {
  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-red-400" />
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            </div>
            <h1 className="text-xl font-bold text-white">F1 RAG Chatbot</h1>
          </div>
        </div>

        {/* Right Section - Status */}
        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white/80">Connected</span>
          </div>

          {/* Data Status */}
          <div className="flex items-center space-x-2">
            {dataInitialized ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/80">Data Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-white/80">Data Loading</span>
              </>
            )}
          </div>

          {/* Version */}
          <div className="text-xs text-white/60 px-2 py-1 bg-white/10 rounded">
            v1.0.0
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
