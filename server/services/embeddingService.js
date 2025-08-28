const { HfInference } = require('@huggingface/inference');

class EmbeddingService {
  constructor() {
    this.hf = null;
    this.model = 'sentence-transformers/all-MiniLM-L6-v2';
    this.initialized = false;
    this.useMockEmbeddings = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Setting up embedding service...');
      
      // Check if we have a valid API key
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      const hasValidKey = apiKey && 
                         apiKey !== 'your_huggingface_api_key_here' && 
                         apiKey.startsWith('hf_');
      
      if (!hasValidKey) {
        console.log('No HuggingFace API key found - using mock embeddings for development');
        this.useMockEmbeddings = true;
        this.initialized = true;
        return;
      }

      // Set up the HuggingFace client
      this.hf = new HfInference(apiKey);
      
      console.log(`Embedding service ready with model: ${this.model}`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize embedding service:', error.message);
      console.log('Falling back to mock embeddings...');
      this.useMockEmbeddings = true;
      this.initialized = true;
    }
  }

  async testConnection() {
    try {
      const testEmbedding = await this.hf.featureExtraction({
        model: this.model,
        inputs: 'test'
      });
      
      if (!testEmbedding || testEmbedding.length === 0) {
        throw new Error('Embedding test failed - no output received');
      }
      
      console.log(`✅ Embedding test successful - vector dimension: ${testEmbedding[0].length}`);
    } catch (error) {
      throw new Error(`Embedding service test failed: ${error.message}`);
    }
  }

  async embedText(text) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Please provide valid text to embed');
    }

    // Use mock embeddings if we don't have a real API key
    if (this.useMockEmbeddings) {
      return this.generateMockEmbedding(text);
    }

    // Try to use the real HuggingFace API
    try {
      const cleanedText = this.preprocessText(text);
      const embedding = await this.hf.featureExtraction({
        model: this.model,
        inputs: cleanedText
      });
      
      return Array.isArray(embedding[0]) ? embedding[0] : embedding;
    } catch (error) {
      console.warn('HuggingFace API failed, falling back to mock embeddings:', error.message);
      return this.generateMockEmbedding(text);
    }
  }

  generateMockEmbedding(text) {
    // Create a deterministic embedding based on text content
    // This ensures the same text always gets the same embedding
    const dimension = 768;
    const embedding = new Array(dimension).fill(0);
    
    // Use a simple but consistent algorithm
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % dimension;
      embedding[index] = Math.sin(charCode + i) * 0.1;
    }
    
    return embedding;
  }

  async embedBatch(texts) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Invalid texts array for batch embedding');
    }

    // Use mock embeddings if no API key is available
    if (this.useMockEmbeddings) {
      return texts.map(text => this.generateMockEmbedding(text));
    }

    try {
      // Clean and prepare texts
      const cleanedTexts = texts.map(text => this.preprocessText(text));
      
      // Generate embeddings in batch
      const embeddings = await this.hf.featureExtraction({
        model: this.model,
        inputs: cleanedTexts
      });

      return embeddings;
    } catch (error) {
      console.error('❌ Batch embedding generation failed:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  preprocessText(text) {
    // Basic text preprocessing
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 512); // Limit length for the model
  }

  // Calculate cosine similarity between two embeddings
  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return similarity;
  }

  // Get model information
  getModelInfo() {
    return {
      name: this.model,
      type: 'sentence-transformers',
      description: 'Lightweight sentence embedding model for semantic similarity',
      maxLength: 512,
      dimensions: 768
    };
  }
}

module.exports = new EmbeddingService();
