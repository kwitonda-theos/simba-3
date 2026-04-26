const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Perform a conversational search using Groq
 * @param {string} query - The user's natural language query
 * @param {Array} products - The product catalog (minimized)
 * @returns {Promise<{message: string, productIds: Array<number>}>}
 */
export async function conversationalSearch(query, products) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  // Minimize product data to save context tokens
  const minimizedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    category: p.category
  }));

  const systemPrompt = `
    You are a helpful and friendly store assistant for Simba Supermarket.
    Your goal is to help users find relevant products from the catalog based on their requests.
    
    CATALOG:
    ${JSON.stringify(minimizedProducts)}
    
    INSTRUCTIONS:
    1. Analyze the user's message to understand their intent (e.g., "breakfast", "cleaning", "baking").
    2. Identify up to 12 relevant products from the CATALOG.
    3. Provide a short, friendly natural-language response (max 2 sentences).
    4. Return ONLY a JSON object with the following structure:
       {
         "message": "Friendly response string",
         "productIds": [123, 456, ...]
       }
    
    If no products match, suggest a category or ask for clarification, but still return the JSON structure.
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to call Groq API');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      message: result.message || "I found some products that might interest you.",
      productIds: result.productIds || []
    };
  } catch (error) {
    console.error('Groq Search Error:', error);
    throw error;
  }
}
