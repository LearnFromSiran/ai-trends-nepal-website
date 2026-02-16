const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cache for news data
let cachedNews = null;
let lastFetched = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fetch AI News from Gemini
async function fetchAINews() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `Generate 3 recent and realistic AI technology news articles specifically related to Nepal's AI ecosystem, tech startups, or AI adoption in South Asia. Format as JSON array with objects containing: tag (Breaking/AI Trends/Innovation), title, and summary (max 150 chars). Focus on: AI policy, startups, language models for Nepali, agricultural AI, education tech.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
    if (jsonMatch) {
      const articles = JSON.parse(jsonMatch[0]);
      return {
        articles,
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      };
    }
    
    // Fallback demo data
    return {
      articles: [
        {
          tag: 'Breaking',
          title: 'Nepal AI Strategy 2026 Framework Drafted',
          summary: 'The Ministry of Communication and IT has unveiled a new roadmap to integrate AI into public service delivery across Kathmandu and beyond.'
        },
        {
          tag: 'AI Trends',
          title: 'Large Language Models Localized for Nepali Dialects',
          summary: 'Local tech startups are successfully fine-tuning open-source models to improve accuracy in Nepali, Maithili, and Bhojpuri translations.'
        },
        {
          tag: 'Innovation',
          title: 'AI Hub Established in Pulchowk',
          summary: 'A new collaborative space for AI researchers has opened, focusing on using computer vision for agricultural optimization in the Terai region.'
        }
      ],
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    };
  } catch (error) {
    console.error('Error fetching AI news:', error);
    throw error;
  }
}

// API endpoint
app.get('/api/news', async (req, res) => {
  try {
    // Check cache
    const now = Date.now();
    if (cachedNews && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return res.json(cachedNews);
    }
    
    // Fetch fresh news
    const news = await fetchAINews();
    cachedNews = news;
    lastFetched = now;
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'AI Trends Nepal API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
