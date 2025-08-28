import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const SourcesPanel = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const sortedSources = [...sources].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-white/20 bg-white/5 backdrop-blur-sm"
    >
      <div className="p-4">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-white" />
            <span className="text-white font-medium">
              Sources ({sources.length})
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Sources List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-3"
            >
              {sortedSources.map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 rounded-lg p-3 border border-white/20"
                >
                  {/* Source Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium text-sm">
                      {source.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-white/60">
                        {(source.score * 100).toFixed(1)}% match
                      </span>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>

                  {/* Source Content Preview */}
                  <p className="text-white/80 text-sm leading-relaxed">
                    {source.content}
                  </p>

                  {/* Source Metadata */}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-white/60">
                      <span>F1 Knowledge Base</span>
                      <span>•</span>
                      <span>Relevance: {source.score > 0.8 ? 'High' : source.score > 0.6 ? 'Medium' : 'Low'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary when collapsed */}
        {!isExpanded && (
          <div className="mt-2 text-xs text-white/60">
            Top sources: {sortedSources.slice(0, 2).map(s => s.title).join(', ')}
            {sortedSources.length > 2 && ` and ${sortedSources.length - 2} more`}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SourcesPanel;
