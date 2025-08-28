import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import MessageInput from './MessageInput';
import SourcesPanel from './SourcesPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatInterface = ({ dataInitialized, onInitializeData }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sources, setSources] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Set conversation ID if not already set
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date().toISOString(),
        sources: data.sources || [],
        context: data.context,
      };

      setMessages(prev => [...prev, botMessage]);
      setSources(data.sources || []);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInitializeData = async () => {
    try {
      await onInitializeData();
      toast.success('F1 data initialized successfully!');
      
      // Add welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        content: "Hello! I'm your F1 RAG Chatbot. I'm now ready to answer your questions about Formula 1 racing, including teams, drivers, circuits, regulations, and history. What would you like to know?",
        timestamp: new Date().toISOString(),
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      toast.error('Failed to initialize data. Please try again.');
    }
  };

  if (!dataInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="mb-6">
              <Bot className="w-24 h-24 text-red-400 mx-auto mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Welcome to F1 RAG Chatbot
            </h2>
            <p className="text-red-100 mb-6">
              I need to load F1 racing data before I can help you. This will only take a moment.
            </p>
            <button
              onClick={handleInitializeData}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
            >
              <Send className="w-5 h-5 mr-2" />
              Initialize F1 Data
            </button>
            <p className="text-red-200 text-sm mt-4">
              This will load information about teams, drivers, circuits, and more.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Message message={message} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
          >
            <Bot className="w-6 h-6 text-white" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-white text-sm">F1 Assistant is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sources Panel */}
      {sources.length > 0 && (
        <SourcesPanel sources={sources} />
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/20">
        <MessageInput onSendMessage={sendMessage} disabled={isTyping} />
      </div>
    </div>
  );
};

export default ChatInterface;
