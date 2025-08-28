import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, AlertCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Message = ({ message }) => {
  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageIcon = () => {
    if (isError) return <AlertCircle className="w-6 h-6 text-red-400" />;
    if (isUser) return <User className="w-6 h-6 text-blue-400" />;
    return <Bot className="w-6 h-6 text-red-400" />;
  };

  const getMessageStyle = () => {
    if (isError) {
      return 'bg-red-500/20 border-red-500/30 text-red-100';
    }
    if (isUser) {
      return 'bg-blue-500/20 border-blue-500/30 text-blue-100 ml-auto';
    }
    return 'bg-white/10 border-white/20 text-white';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-red-500'}`}>
          {getMessageIcon()}
        </div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className={`rounded-2xl px-4 py-3 border backdrop-blur-sm ${getMessageStyle()}`}>
            {/* Message Header */}
            <div className={`flex items-center space-x-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className="text-sm font-medium">
                {isUser ? 'You' : isError ? 'Error' : 'F1 Assistant'}
              </span>
              <div className="flex items-center space-x-1 text-xs opacity-70">
                <Clock className="w-3 h-3" />
                <span>{formatTime(message.timestamp)}</span>
              </div>
            </div>

            {/* Message Text */}
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-yellow-300">{children}</strong>,
                  em: ({ children }) => <em className="italic text-red-200">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-black/30 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-black/30 p-2 rounded text-sm font-mono overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-red-400 pl-4 italic text-red-200">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Context Information for Bot Messages */}
            {!isUser && !isError && message.context && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-white/70">
                  <span className="font-medium">Context:</span> Found {message.context.documentsFound} relevant documents 
                  ({message.context.totalContextLength} characters)
                </div>
              </div>
            )}
          </div>

          {/* Sources for Bot Messages */}
          {!isUser && !isError && message.sources && message.sources.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-white/60 mb-1">Sources:</div>
              <div className="flex flex-wrap gap-1">
                {message.sources.slice(0, 3).map((source, index) => (
                  <span
                    key={index}
                    className="inline-block bg-white/10 px-2 py-1 rounded text-xs text-white/80"
                    title={`Score: ${(source.score * 100).toFixed(1)}%`}
                  >
                    {source.title}
                  </span>
                ))}
                {message.sources.length > 3 && (
                  <span className="inline-block bg-white/10 px-2 py-1 rounded text-xs text-white/60">
                    +{message.sources.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
