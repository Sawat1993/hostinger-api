import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AI, AIDocument } from './ai.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AIService {
  private gemini: GoogleGenerativeAI;
  private geminiGenerateModel: string;
  private geminiEmbedModel: string;

  constructor(
    @InjectModel(AI.name) private aiModel: Model<AIDocument>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    this.geminiGenerateModel =
      this.configService.get<string>('GEMINI_GENERATE_MODEL') ||
      'models/gemini-1.0';
    this.geminiEmbedModel =
      this.configService.get<string>('GEMINI_EMBED_MODEL') ||
      'models/embedding-gecko-001';
    this.gemini = new GoogleGenerativeAI(apiKey);
  }

  // Save content and generate embedding
  async save(content: string): Promise<AIDocument> {
    try {
      const embedding = await this.generateEmbedding(content);
      const createdAI = new this.aiModel({ content, embedding });
      return await createdAI.save();
    } catch (error) {
      throw new HttpException(
        `Failed to save AI content: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // In-memory vector search using local MongoDB (for small datasets)
  private async findSimilarByQuery(
    query: string,
    topK = 5,
  ): Promise<AIDocument[]> {
    const embedding = await this.generateEmbedding(query);
    const all = await this.aiModel.find().exec();
    const scored = all.map((doc) => ({
      doc: doc,
      score: this.cosineSimilarity(doc.embedding, embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.doc);
  }
  // Cosine similarity for vector search
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] || 0), 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return normA && normB ? dot / (normA * normB) : 0;
  }

  // Query endpoint: use Gemini and vector search to answer
  async query(query: string, topK = 8): Promise<{ answer: string }> {
    try {
      const relevantDocs = await this.findSimilarByQuery(query, topK);
      const contextTexts = relevantDocs.map((doc) => doc.content);
      const prompt = `You are an expert assistant who knows everything about Sawatantra.\n\nBelow is information about Sawatantra, extracted from a knowledge base.
      Use only this information to answer the user's question as accurately as possible.\n\nKnowledge Base:\n${contextTexts.join('\n---\n')}\n\nUser Question: ${query}\n\n 
      Answer as if you are personal AI assistant of Sawatantra. (Address the user as "you" and Sawatantra as "he")`;
      // Use base Gemini model (not pro)
      const model = this.gemini.getGenerativeModel({
        model: this.geminiGenerateModel,
      });
      const result = await model.generateContent(prompt);
      const answer = result.response.text();
      return { answer };
    } catch (error) {
      // Check for Too Many Requests (HTTP 429)
      const isTooManyRequests =
        error?.response?.status === 429 ||
        error?.status === 429 ||
        /too many requests/i.test(error?.message || '');
      if (isTooManyRequests) {
        throw new HttpException(
          'Too many requests to the AI service. Please try again after some time.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        `Failed to process AI query: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Gemini embedding API usage
    // Use a supported embedding model (see Google API docs or ListModels)
    const model = this.gemini.getGenerativeModel({
      model: this.geminiEmbedModel,
    });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }
}
