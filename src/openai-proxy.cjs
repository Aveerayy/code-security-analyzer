const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Use environment variable for API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-api-key-here";

// Function to wait for a specified time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to call OpenAI API with retry logic
async function callOpenAIWithRetry(data, maxRetries = 5) {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        data: data,
        responseType: 'json'
      });
      
      return response;
    } catch (err) {
      if (err.response && err.response.status === 429) {
        // Extract wait time from error message if available
        let waitTime = 30000; // Default 30 seconds
        
        if (err.response.data && err.response.data.error && err.response.data.error.message) {
          const match = err.response.data.error.message.match(/try again in (\d+\.\d+)s/);
          if (match && match[1]) {
            waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000; // Convert to ms and add 1s buffer
          }
        }
        
        // Exponential backoff
        const jitter = Math.random() * 1000;
        const actualWaitTime = waitTime + (retries * 5000) + jitter;
        
        console.log(`Rate limit hit. Retrying in ${actualWaitTime/1000} seconds...`);
        await sleep(actualWaitTime);
        retries++;
      } else {
        // For other errors, don't retry
        throw err;
      }
    }
  }
  
  // If we've exhausted retries
  throw new Error(`Failed after ${maxRetries} retries`);
}

// Function to chunk text with sliding window using LangChain
async function chunkWithSlidingWindow(text, chunkSize = 8000, chunkOverlap = 800) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ["\n\n", "\n", " ", ""], // More logical separation
    });
    
    const chunks = await splitter.createDocuments([text]);
    return chunks.map(chunk => chunk.pageContent);
  } catch (error) {
    console.error("Error chunking text with LangChain:", error);
    // Fallback to basic chunking
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Component-based chunking for architecture diagrams
async function componentBasedChunking(text) {
  try {
    // First, try to identify components, metadata, and connections
    const componentsPattern = /Component:|Shape:|Entity:|Service:|Database:|API:|Server:|Client:|Interface:/gi;
    const metadataPattern = /Label:|Description:|Metadata:|Properties:|Attributes:|Tag:|Info:/gi;
    const connectionsPattern = /Connection:|Flow:|Relationship:|Link:|Arrow:|Data Flow:|Connects to:|Interacts with:|Sends data to:|Receives data from:/gi;
    
    // Extract chunks based on categories
    const componentChunks = [];
    const metadataChunks = [];
    const connectionChunks = [];
    
    // Rough draft - split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    
    paragraphs.forEach(paragraph => {
      if (componentsPattern.test(paragraph)) {
        componentChunks.push({
          type: 'component',
          content: paragraph.trim()
        });
      } else if (connectionsPattern.test(paragraph)) {
        connectionChunks.push({
          type: 'connection',
          content: paragraph.trim()
        });
      } else if (metadataPattern.test(paragraph)) {
        metadataChunks.push({
          type: 'metadata',
          content: paragraph.trim()
        });
      } else {
        // Try to determine category based on content
        if (paragraph.includes("->") || paragraph.includes("↔") || 
            paragraph.includes("connects") || paragraph.includes("flow")) {
          connectionChunks.push({
            type: 'connection',
            content: paragraph.trim()
          });
        } else if (paragraph.length < 200 && 
                  (paragraph.includes(":") || paragraph.includes("="))) {
          metadataChunks.push({
            type: 'metadata',
            content: paragraph.trim()
          });
        } else {
          // Default to component if can't determine
          componentChunks.push({
            type: 'component',
            content: paragraph.trim()
          });
        }
      }
    });
    
    // Group connections by related components where possible
    const groupedConnections = {};
    connectionChunks.forEach(conn => {
      // Try to identify source and target components
      const sourceMatch = conn.content.match(/from\s+["']?([^"'\n,]+)["']?/i) || 
                          conn.content.match(/source\s*[:=]\s*["']?([^"'\n,]+)["']?/i);
      const targetMatch = conn.content.match(/to\s+["']?([^"'\n,]+)["']?/i) || 
                          conn.content.match(/target\s*[:=]\s*["']?([^"'\n,]+)["']?/i);
      
      if (sourceMatch && targetMatch) {
        const key = `${sourceMatch[1]}_${targetMatch[1]}`;
        if (!groupedConnections[key]) {
          groupedConnections[key] = [];
        }
        groupedConnections[key].push(conn);
      } else {
        // If can't identify source/target, keep as individual
        const key = `conn_${Object.keys(groupedConnections).length}`;
        groupedConnections[key] = [conn];
      }
    });
    
    // Combine all chunks with type information
    const allChunks = [
      ...componentChunks,
      ...metadataChunks,
      ...Object.values(groupedConnections).map(group => {
        return {
          type: 'connection_group',
          content: group.map(conn => conn.content).join("\n\n")
        };
      })
    ];
    
    // Filter out empty chunks and ensure minimum content
    return allChunks
      .filter(chunk => chunk.content && chunk.content.trim().length > 10)
      .map(chunk => `[${chunk.type.toUpperCase()}]\n${chunk.content}`);
  } catch (error) {
    console.error("Error in component-based chunking:", error);
    // Fallback to regular chunking
    return chunkWithSlidingWindow(text);
  }
}

// Create embeddings for texts
async function createEmbeddings(texts) {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: OPENAI_API_KEY,
      batchSize: 1 // Process one at a time to avoid rate limits
    });
    
    if (Array.isArray(texts)) {
      return await embeddings.embedDocuments(texts);
    } else {
      return await embeddings.embedQuery(texts);
    }
  } catch (error) {
    console.error("Error creating embeddings:", error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

// Find most relevant chunks based on a query
async function findRelevantChunks(query, chunks, topK = 3) {
  try {
    // Create embeddings for query and all chunks
    const queryEmbedding = await createEmbeddings(query);
    const chunkEmbeddings = await createEmbeddings(chunks);
    
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

// Function to clean and fix JSON response from OpenAI
function cleanAndFixJSON(jsonString) {
  try {
    // First try direct parsing
    return JSON.parse(jsonString);
  } catch (error) {
    console.log("Initial JSON parse failed, attempting cleanup...");
    
    // Remove markdown code blocks if present
    let cleanedJSON = jsonString.replace(/```json\n|\n```|```/g, '');
    
    // Clean up common JSON formatting issues
    cleanedJSON = cleanedJSON
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3') // Ensure property names are quoted
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/:\s*"([^"]*)\s*([,}])/g, ':"$1"$2') // Fix unclosed quotes in values
      .replace(/:\s*"([^"]*)$/g, ':"$1"') // Fix unclosed quotes at the end
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    try {
      // Try parsing after basic cleanup
      return JSON.parse(cleanedJSON);
    } catch (parseError) {
      console.log("Basic cleanup failed, attempting more aggressive fixes...");
      
      // More aggressive fixes for complex cases
      // Look for common structural issues
      if (cleanedJSON.match(/"\s*:\s*"[^"]*[^"]$/)) {
        // Fix unclosed string values
        cleanedJSON = cleanedJSON.replace(/("\s*:\s*"[^"]*[^"])(\s*[,}])/g, '$1"$2');
      }
      
      // Try to fix unescaped quotes inside strings
      cleanedJSON = cleanedJSON.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, function(match, p1, p2, p3) {
        return '"' + p1 + '\\"' + p2 + '\\"' + p3 + '"';
      });
      
      // Try to balance missing quotes and braces
      let openBraces = (cleanedJSON.match(/{/g) || []).length;
      let closeBraces = (cleanedJSON.match(/}/g) || []).length;
      let openBrackets = (cleanedJSON.match(/\[/g) || []).length;
      let closeBrackets = (cleanedJSON.match(/\]/g) || []).length;
      
      // Add missing closing braces/brackets
      if (openBraces > closeBraces) {
        cleanedJSON += '}'.repeat(openBraces - closeBraces);
      }
      if (openBrackets > closeBrackets) {
        cleanedJSON += ']'.repeat(openBrackets - closeBrackets);
      }
      
      // Final attempt at parsing after aggressive cleanup
      try {
        return JSON.parse(cleanedJSON);
      } catch (finalError) {
        console.error("Failed to parse JSON after multiple cleanup attempts:", finalError);
        console.error("Problematic JSON:", jsonString.substring(0, 500) + "...");
        
        // Last resort: return a minimal valid JSON with error info
        return {
          error: "JSON parsing failed",
          errorMessage: finalError.message,
          timestamp: new Date().toISOString(),
          summary: "Error in analysis output format. Please check server logs."
        };
      }
    }
  }
}

// Process text with chunking and embeddings
app.post('/api/process-text', async (req, res) => {
  try {
    const { text, query } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Chunk the text
    const chunks = await chunkWithSlidingWindow(text);
    console.log(`Text chunked into ${chunks.length} chunks`);
    
    // If a query is provided, find relevant chunks
    if (query) {
      const relevantChunks = await findRelevantChunks(query, chunks);
      return res.json({ chunks: relevantChunks });
    }
    
    // Otherwise, return all chunks
    return res.json({ chunks });
  } catch (error) {
    console.error('Error processing text:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced OpenAI endpoint with chunking and summarization
app.post('/api/analyze-security', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Step 1: Use component-based chunking instead of character-based
    const chunks = await componentBasedChunking(text);
    console.log(`Text chunked into ${chunks.length} logical components for security analysis`);
    
    // Step 2: Process ALL chunks with OpenAI
    const chunkResults = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing component ${i+1}/${chunks.length}`);
      
      const response = await callOpenAIWithRetry({
        model: "gpt-4o-mini", // Using gpt-4o-mini which has higher RPM and TPM
        messages: [
          {
            role: "system",
            content: `You are a security analyst. You are provided partial context about a larger architecture diagram (component ${i+1} of ${chunks.length}). 
These chunks contain relevant parts for performing a security review.
The content is tagged with its type: [COMPONENT], [METADATA], or [CONNECTION_GROUP].
Evaluate the provided information thoroughly, and point out clearly if crucial information appears missing or incomplete.

Even if this chunk seems incomplete or lacks context, analyze only what you see here and RESPOND WITH VALID JSON WITHOUT MARKDOWN CODE BLOCKS OR FORMATTING.

Return your findings in the following JSON format WITHOUT ANY MARKDOWN FORMATTING:
{
  "summary": "Brief overall assessment of the architecture's security posture",
  "components": ["Component1", "Component2", ...], // List of identified components in the architecture
  "dataFlows": ["Flow1", "Flow2", ...], // List of identified data flows
  "keywords": ["keyword1", "keyword2", ...], // Key security-related terms identified
  "strideCategories": [
    {
      "title": "Spoofing Threats",
      "description": "Description of spoofing threats",
      "risks": [
        {
          "description": "Detailed description of a specific spoofing risk",
          "severity": "high|medium|low",
          "remediation": "Specific remediation steps for this risk",
          "technicalNotes": "Optional technical implementation details"
        }
      ]
    },
    // Repeat for Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description of the recommendation",
      "priority": "high|medium|low"
    }
  ],
  "timestamp": "${new Date().toISOString()}"
}

Include all six STRIDE categories in your response. If a category has no risks, include it with an empty risks array.
If information is incomplete, note this in relevant descriptions but still maintain the JSON structure.
DO NOT WRAP YOUR RESPONSE IN MARKDOWN CODE BLOCKS, JUST RETURN PURE JSON.`,
          },
          {
            role: "user",
            content: chunks[i],
          }
        ],
        stream: false,
      });
      
      // Try to clean any markdown formatting from the response
      let content = response.data.choices[0].message.content;
      // Use the enhanced JSON cleaner instead of manual replacements
      try {
        const parsedContent = cleanAndFixJSON(content);
        chunkResults.push(JSON.stringify(parsedContent));
      } catch (parseError) {
        console.error("Error handling chunk content:", parseError);
        // If all else fails, push the cleaned but unparsed content
        content = content.replace(/```json\n|\n```|```/g, '')
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
          .replace(/'/g, '"');
        chunkResults.push(content);
      }
      
      // Wait between API calls to avoid rate limits
      if (i < chunks.length - 1) {
        const delayTime = 1000 + (Math.random() * 1000); // 1-2 seconds
        console.log(`Waiting ${delayTime/1000} seconds before next component to avoid rate limits...`);
        await sleep(delayTime);
      }
    }
    
    // Step 3: Summarize the results
    if (chunkResults.length > 1) {
      // Process in batches to avoid context length limits
      const batchSize = 10; // Adjust based on average chunk size
      const batches = [];
      
      // Split chunks into batches
      for (let i = 0; i < chunkResults.length; i += batchSize) {
        batches.push(chunkResults.slice(i, i + batchSize));
      }
      
      console.log(`Split summarization into ${batches.length} batches`);
      
      // Process each batch
      const batchResults = [];
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`Processing summary batch ${i+1}/${batches.length}`);
        const batchResponse = await callOpenAIWithRetry({
          model: "gpt-4o", // Using model with larger context window
          messages: [
            {
              role: "system",
              content: `You are a security analyst tasked with summarizing multiple security analyses into an interim report. 
You have been provided analyses from multiple components (batch ${i+1} of ${batches.length}).
Your job is to consolidate these findings into a concise interim report.

Create a consolidated report following this exact JSON structure WITHOUT ANY MARKDOWN FORMATTING:

{
  "summary": "Brief overall assessment of the architecture's security posture",
  "components": ["Component1", "Component2", ...], // List of identified components in the architecture
  "dataFlows": ["Flow1", "Flow2", ...], // List of identified data flows
  "keywords": ["keyword1", "keyword2", ...], // Key security-related terms identified
  "strideCategories": [
    {
      "title": "Spoofing Threats",
      "description": "Description of spoofing threats",
      "risks": [
        {
          "description": "Detailed description of a specific spoofing risk",
          "severity": "high|medium|low",
          "remediation": "Specific remediation steps for this risk",
          "technicalNotes": "Optional technical implementation details"
        }
      ]
    },
    // Repeat for Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description of the recommendation",
      "priority": "high|medium|low"
    }
  ],
  "timestamp": "${new Date().toISOString()}"
}

Consolidate similar findings, remove duplicates, and ensure all six STRIDE categories are included. If a category has no risks, include it with an empty risks array.
DO NOT USE MARKDOWN CODE BLOCKS. RETURN PURE JSON WITHOUT ANY BACKTICKS OR MARKDOWN FORMATTING.`,
            },
            {
              role: "user",
              content: batches[i].join("\n\n====CHUNK SEPARATOR====\n\n"),
            }
          ],
          stream: false,
        });
        
        // Clean any markdown formatting from the response
        let batchContent = batchResponse.data.choices[0].message.content;
        
        // Use the enhanced JSON cleaner instead of manual replacements
        try {
          const parsedContent = cleanAndFixJSON(batchContent);
          batchResults.push(JSON.stringify(parsedContent));
        } catch (parseError) {
          console.error("Error handling batch content:", parseError);
          // If all else fails, push the cleaned but unparsed content
          batchContent = batchContent.replace(/```json\n|\n```|```/g, '')
            .replace(/,(\s*[}\]])/g, '$1')
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
            .replace(/'/g, '"');
          batchResults.push(batchContent);
        }
        
        // Wait between API calls to avoid rate limits
        if (i < batches.length - 1) {
          const delayTime = 1000 + (Math.random() * 1000); // 1-2 seconds
          console.log(`Waiting ${delayTime/1000} seconds before next batch to avoid rate limits...`);
          await sleep(delayTime);
        }
      }
      
      // Final summarization of batch results
      const finalSummarizationResponse = await callOpenAIWithRetry({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a security analyst tasked with creating a final comprehensive security report.
You have been provided with ${batches.length} interim security reports that need to be consolidated.
Your job is to combine these reports into a single coherent assessment, eliminating redundancies and resolving any contradictions.

Create a final consolidated report following this exact JSON structure WITHOUT ANY MARKDOWN FORMATTING:

{
  "summary": "Brief overall assessment of the architecture's security posture",
  "components": ["Component1", "Component2", ...], // List of identified components in the architecture
  "dataFlows": ["Flow1", "Flow2", ...], // List of identified data flows
  "keywords": ["keyword1", "keyword2", ...], // Key security-related terms identified
  "strideCategories": [
    {
      "title": "Spoofing Threats",
      "description": "Description of spoofing threats",
      "risks": [
        {
          "description": "Detailed description of a specific spoofing risk",
          "severity": "high|medium|low",
          "remediation": "Specific remediation steps for this risk",
          "technicalNotes": "Optional technical implementation details"
        }
      ]
    },
    // Repeat for Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description of the recommendation",
      "priority": "high|medium|low"
    }
  ],
  "timestamp": "${new Date().toISOString()}"
}

Consolidate similar findings, remove duplicates, and ensure all six STRIDE categories are included. If a category has no risks, include it with an empty risks array.
DO NOT USE MARKDOWN CODE BLOCKS. RETURN PURE JSON WITHOUT ANY BACKTICKS OR MARKDOWN FORMATTING.`,
          },
          {
            role: "user",
            content: batchResults.join("\n\n====BATCH SEPARATOR====\n\n"),
          }
        ],
        stream: false,
      });
      
      // Clean any markdown formatting from the response
      let finalContent = finalSummarizationResponse.data.choices[0].message.content;
      
      // Use the enhanced JSON cleaner
      try {
        finalResult = cleanAndFixJSON(finalContent);
        // Add timestamp if missing
        if (!finalResult.timestamp) {
          finalResult.timestamp = new Date().toISOString();
        }
        res.json({ 
          result: JSON.stringify(finalResult),
          processedChunks: chunks.length,
          totalChunks: chunks.length
        });
      } catch (parseError) {
        console.error("Error parsing JSON from OpenAI:", parseError);
        // Send the original result if parsing fails
        res.json({ 
          result: finalContent,
          processedChunks: chunks.length,
          totalChunks: chunks.length,
          error: "JSON parsing failed: " + parseError.message
        });
      }
    } else if (chunkResults.length === 1) {
      // If only one chunk, no need to summarize
      // Try to parse the JSON response for validation
      try {
        const finalResult = cleanAndFixJSON(chunkResults[0]);
        // Add timestamp if missing
        if (!finalResult.timestamp) {
          finalResult.timestamp = new Date().toISOString();
        }
        res.json({ 
          result: JSON.stringify(finalResult),
          processedChunks: 1,
          totalChunks: chunks.length
        });
      } catch (parseError) {
        console.error("Error parsing JSON from OpenAI:", parseError);
        // Send the original result if parsing fails
        res.json({ 
          result: chunkResults[0],
          processedChunks: 1,
          totalChunks: chunks.length,
          error: "JSON parsing failed: " + parseError.message
        });
      }
    } else {
      res.status(400).json({ error: 'No chunks could be processed' });
    }
  } catch (error) {
    console.error('Error analyzing security:', error);
    if (error.response) {
      console.error('OpenAI error details:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Original OpenAI endpoint (kept for compatibility)
app.post('/api/openai', async (req, res) => {
  try {
    console.log('Proxying request to OpenAI with body length:', JSON.stringify(req.body).length);
    console.log('Request model:', req.body.model);
    console.log('Request stream mode:', req.body.stream);
    
    // Call OpenAI with retry logic
    const response = await callOpenAIWithRetry(req.body);
    
    console.log('OpenAI response status:', response.status);
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Error calling OpenAI API:', err.message);
    if (err.response) {
      console.error('OpenAI error details:', err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OpenAI proxy server running on port ${PORT}`);
}); 