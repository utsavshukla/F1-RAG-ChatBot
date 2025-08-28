import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);

  useEffect(() => {
    const checkDataStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('/api/health', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          // Check if data is initialized
          const hasData = await checkDataExists();
          setDataInitialized(hasData);
        }
      } catch (error) {
        console.error('Failed to check server status:', error);
        // Set dataInitialized to false when backend is not available
        setDataInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDataStatus();
  }, []);



  const checkDataExists = async () => {
    try {
      const response = await fetch('/api/topics');
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const initializeData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/init-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setDataInitialized(true);
        return result;
      } else {
        throw new Error('Failed to initialize data');
      }
    } catch (error) {
      console.error('Data initialization failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-red-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-200 mx-auto mb-4"></div>
          <h2 className="text-red-200 text-xl font-semibold">Loading F1 RAG Chatbot...</h2>
          <p className="text-red-100 mt-2">Initializing services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-red-800">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />
      
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header 
            dataInitialized={dataInitialized}
          />
          
          <main className="flex-1 overflow-hidden">
            <ChatInterface 
              dataInitialized={dataInitialized}
              onInitializeData={initializeData}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
