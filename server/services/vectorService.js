const { Pinecone } = require('@pinecone-database/pinecone');
const { randomUUID } = require('crypto');

class VectorService {
  constructor() {
    this.client = null;
    this.index = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    this.index = this.client.index(process.env.PINECONE_INDEX);
    this.initialized = true;
    console.log('✅ Vector service initialized with Pinecone');
  }

  async addDocuments(documents) {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('Invalid documents array');
    }
    // Each document should have: id, embedding (array of 768 floats), metadata
    const vectors = documents.map(doc => ({
      id: randomUUID() || `doc_${Date.now()}_${Math.random()}`,
      values: this.normalizeVector(doc.embedding), // Normalize for cosine similarity
      metadata: {
        ...doc.metadata,
        content: doc.content,
        text: doc.content
      },
    }));
    await this.index.upsert(vectors);
    console.log(`✅ Upserted ${vectors.length} vectors to Pinecone (cosine similarity)`);
    return { added: vectors.length };
  }

  async searchSimilar(queryEmbedding, limit = 5) {
    if (!this.initialized) {
      await this.initialize();
    }
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
      throw new Error('Invalid query embedding (must be 768-d float array)');
    }
    const result = await this.index.query({
      vector: this.normalizeVector(queryEmbedding), // Normalize for cosine similarity
      topK: limit,
      includeMetadata: true,
    });
    return (result.matches || []).map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    }));
  }

  // Normalize vector for cosine similarity
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  async getCollectionStats() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalDocuments: stats.totalVectorCount || 0,
        dimension: stats.dimension || 768,
        indexFullness: stats.indexFullness || 0
      };
    } catch (error) {
      console.error('❌ Failed to get collection stats:', error);
      return { totalDocuments: 0, dimension: 768, indexFullness: 0 };
    }
  }
}

module.exports = new VectorService();
