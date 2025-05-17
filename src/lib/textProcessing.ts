import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";

// Function to split text into chunks with sliding window
export async function chunkTextWithSlidingWindow(
  text: string, 
  chunkSize = 4000, 
  chunkOverlap = 500
): Promise<string[]> {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", " ", ""], // More logical separation
    });
    
    const chunks = await splitter.createDocuments([text]);
    return chunks.map(chunk => chunk.pageContent);
  } catch (error) {
    console.error("Error chunking text:", error);
    // Fallback to simple chunking if langchain fails
    return simpleChunking(text, chunkSize);
  }
}

// Simple chunking fallback with no overlap
function simpleChunking(text: string, maxLength = 4000): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

// Create embeddings for a text
export async function createEmbeddings(
  text: string, 
  apiKey: string
): Promise<number[]> {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      batchSize: 1 // Process one at a time to avoid rate limits
    });
    
    const result = await embeddings.embedQuery(text);
    return result;
  } catch (error) {
    console.error("Error creating embeddings:", error);
    throw error;
  }
}

// Create embeddings for multiple texts
export async function createBatchEmbeddings(
  texts: string[], 
  apiKey: string
): Promise<number[][]> {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      batchSize: 1 // Process one at a time to avoid rate limits
    });
    
    const results = await embeddings.embedDocuments(texts);
    return results;
  } catch (error) {
    console.error("Error creating batch embeddings:", error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

// Find most relevant chunks based on a query
export async function findRelevantChunks(
  query: string,
  chunks: string[],
  apiKey: string,
  topK = 3
): Promise<string[]> {
  try {
    // Create embeddings for query and all chunks
    const queryEmbedding = await createEmbeddings(query, apiKey);
    const chunkEmbeddings = await createBatchEmbeddings(chunks, apiKey);
    
    // Calculate similarities
    const similarities = chunkEmbeddings.map(embedding => 
      cosineSimilarity(queryEmbedding, embedding)
    );
    
    // Get indices of top-k chunks
    const topIndices = similarities
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.index);
    
    // Return top-k relevant chunks
    return topIndices.map(index => chunks[index]);
  } catch (error) {
    console.error("Error finding relevant chunks:", error);
    // If there's an error, just return the first chunks
    return chunks.slice(0, topK);
  }
} 