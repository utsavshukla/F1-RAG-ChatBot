const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');

// Load our custom services for the RAG pipeline
const ragService = require('./services/ragService');
const dataService = require('./services/dataService');
const embeddingService = require('./services/embeddingService');
const vectorService = require('./services/vectorService');

// Load environment variables first thing
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set up middleware stack
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(cors()); // Allow cross-origin requests
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies up to 10MB
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Simple health check - useful for monitoring
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'F1 RAG Chatbot is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Main chat endpoint - this is where the magic happens
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    // Basic validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a message to process' 
      });
    }

    // Log the incoming request (truncated for privacy)
    const truncatedMessage = message.length > 100 
      ? `${message.substring(0, 100)}...` 
      : message;
    console.log(`New chat request: "${truncatedMessage}"`);
    
    // Send it through our RAG pipeline
    const response = await ragService.processQuery(message, conversationId);
    
    res.json(response);
  } catch (error) {
    console.error('Something went wrong processing the chat:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error processing your message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Data initialization endpoint - loads F1 knowledge into the system
app.post('/api/init-data', async (req, res) => {
  try {
    console.log('Starting F1 data initialization...');
    const result = await dataService.initializeData();
    console.log('Data initialization completed successfully');
    res.json(result);
  } catch (error) {
    console.error('Data initialization failed:', error);
    res.status(500).json({ 
      error: 'Failed to initialize F1 data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
});

// Retrieve conversation history for a specific chat session
app.get('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const history = await ragService.getConversationHistory(conversationId);
    res.json({ history });
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    res.status(500).json({ 
      error: 'Could not retrieve conversation history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available F1 topics that users can ask about
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await dataService.getAvailableTopics();
    res.json({ topics });
  } catch (error) {
    console.error('Error getting F1 topics:', error);
    res.status(500).json({ 
      error: 'Could not retrieve F1 topics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start the server and initialize our services
app.listen(PORT, async () => {
  console.log(`🏎️  F1 RAG Chatbot server is up and running!`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log('');
  
  // Initialize all our services in the background
  try {
    console.log('Setting up services...');
    
    // Start with the vector database
    await vectorService.initialize();
    console.log('  ✓ Vector database ready');
    
    // Then the embedding service
    await embeddingService.initialize();
    console.log('  ✓ Embedding service ready');
    
    // Check if we have F1 data loaded already
    const hasExistingData = await dataService.checkDataExists();
    if (!hasExistingData) {
      console.log('');
      console.log('💡 Tip: No F1 data found yet.');
      console.log('   Send a POST request to /api/init-data to load the knowledge base');
    } else {
      console.log('  ✓ F1 knowledge base is loaded and ready');
    }
    
    console.log('');
    console.log('🎉 All systems ready! You can start chatting about F1.');
    
  } catch (error) {
    console.error('');
    console.error('⚠️  Warning: Some services failed to initialize:', error.message);
    console.error('   The server is running, but functionality may be limited.');
  }
});

module.exports = app;
