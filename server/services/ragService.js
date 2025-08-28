const embeddingService = require('./embeddingService');
const vectorService = require('./vectorService');
const llmService = require('./llmService');
const { v4: uuidv4 } = require('uuid');

// In-memory conversation storage (in production, use Redis or database)
const conversations = new Map();

class RAGService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    await embeddingService.initialize();
    await vectorService.initialize();
    await llmService.initialize();
    
    this.initialized = true;
    console.log('✅ RAG Service initialized');
  }

  async processQuery(message, conversationId = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate conversation ID if not provided
    if (!conversationId) {
      conversationId = uuidv4();
    }

    console.log(`🔄 Processing query: "${message}"`);

    try {
      // Step 1: Generate embedding for the query
      const queryEmbedding = await embeddingService.embedText(message);
      console.log('✅ Query embedding generated');

      // Step 2: Search for relevant documents in vector database
      const relevantDocs = await vectorService.searchSimilar(queryEmbedding, 5);
      console.log(`✅ Found ${relevantDocs.length} relevant documents`);

      // Step 3: Create context from relevant documents
      const context = this.createContext(relevantDocs);
      console.log(`📄 Context created with ${context.length} characters`);

      // Step 4: Generate response using LLM with context
      const response = await llmService.generateResponse(message, context);
      console.log('✅ Response generated');

      // Step 5: Store conversation
      this.storeConversation(conversationId, message, response, relevantDocs);

      return {
        response,
        conversationId,
        sources: relevantDocs.map(doc => ({
          title: doc.metadata?.title || 'F1 Document',
          content: (doc.metadata?.content || doc.metadata?.text || '').substring(0, 200) + '...',
          score: doc.score
        })),
        context: {
          documentsFound: relevantDocs.length,
          totalContextLength: context.length
        }
      };

    } catch (error) {
      console.error('❌ RAG processing error:', error);
      throw new Error(`RAG processing failed: ${error.message}`);
    }
  }

  createContext(relevantDocs) {
    if (!relevantDocs || relevantDocs.length === 0) {
      return "No relevant F1 information found.";
    }

    // Combine relevant documents into context
    const contextParts = relevantDocs.map((doc, index) => {
      const content = doc.metadata?.content || doc.metadata?.text || '';
      const title = doc.metadata?.title || `Document ${index + 1}`;
      return `[${title}]: ${content}`;
    });

    return contextParts.join('\n\n');
  }

  storeConversation(conversationId, userMessage, botResponse, sources) {
    if (!conversations.has(conversationId)) {
      conversations.set(conversationId, []);
    }

    const conversation = conversations.get(conversationId);
    conversation.push({
      timestamp: new Date().toISOString(),
      user: userMessage,
      bot: botResponse,
      sources: sources.map(doc => ({
        title: doc.metadata?.title || 'F1 Document',
        score: doc.score
      }))
    });

    // Keep only last 20 messages to prevent memory issues
    if (conversation.length > 20) {
      conversation.splice(0, conversation.length - 20);
    }
  }

  async getConversationHistory(conversationId) {
    return conversations.get(conversationId) || [];
  }

  async getConversationSummary(conversationId) {
    const history = await this.getConversationHistory(conversationId);
    if (history.length === 0) {
      return { messageCount: 0, topics: [] };
    }

    // Extract topics from conversation
    const topics = this.extractTopics(history);
    
    return {
      messageCount: history.length,
      topics,
      lastMessage: history[history.length - 1]?.timestamp
    };
  }

  extractTopics(history) {
    const topics = new Set();
    
    history.forEach(entry => {
      const text = `${entry.user} ${entry.bot}`.toLowerCase();
      
      // F1-specific topic extraction
      if (text.includes('driver') || text.includes('piloto')) topics.add('Drivers');
      if (text.includes('team') || text.includes('equipo')) topics.add('Teams');
      if (text.includes('race') || text.includes('carrera')) topics.add('Races');
      if (text.includes('championship') || text.includes('campeonato')) topics.add('Championship');
      if (text.includes('circuit') || text.includes('circuito')) topics.add('Circuits');
      if (text.includes('engine') || text.includes('motor')) topics.add('Technology');
      if (text.includes('regulation') || text.includes('reglamento')) topics.add('Regulations');
    });

    return Array.from(topics);
  }
}

module.exports = new RAGService();
