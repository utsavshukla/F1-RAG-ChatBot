import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';

const MessageInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-3">
      {/* Input Field */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTextareaResize();
          }}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about F1 racing..."
          disabled={disabled}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-200 min-h-[48px] max-h-[120px]"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        
        {/* Character Count */}
        {message.length > 0 && (
          <div className="absolute bottom-2 right-3 text-xs text-white/50">
            {message.length}/1000
          </div>
        )}
      </div>

      {/* Send Button */}
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
          message.trim() && !disabled
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        }`}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};

export default MessageInput;
