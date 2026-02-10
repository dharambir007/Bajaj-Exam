const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


function generateFibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const fib = [0, 1];
  for (let i = 2; i < n; i++) {
    fib.push(fib[i - 1] + fib[i - 2]);
  }
  return fib;
}

function filterPrimes(arr) {
  const isPrime = (num) => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };
  return arr.filter(isPrime);
}

function calculateLCM(arr) {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const lcm = (a, b) => (a * b) / gcd(a, b);
  return arr.reduce((acc, val) => lcm(acc, val));
}

function calculateHCF(arr) {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  return arr.reduce((acc, val) => gcd(acc, val));
}

// Updated getAIResponse to return a single, sanitized word
async function getAIResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(`${prompt}\n\nProvide the answer as a single word.`);
        const response = await result.response;
        const text = response.text().trim().replace(/[^\w\s]/gi, ''); // Basic sanitization
        return text.split(/\s+/)[0] || "Unknown"; // Return first word
    } catch (error) {
        console.error("AI Integration Error:", error);
        return "Error";
    }
}


app.post('/bfhl', async (req, res) => {
  try {
    const { fibonacci, prime, lcm, hcf, AI } = req.body;


    if (!fibonacci && !prime && !lcm && !hcf && !AI) {
      return res.status(400).json({
        is_success: false,
        official_email: process.env.OFFICIAL_EMAIL,
        data: null,
        error: 'At least one input is required'
      });
    }

    let data = {};

  
    if (fibonacci !== undefined) {
      if (typeof fibonacci !== 'number' || fibonacci < 0) {
        return res.status(400).json({
          is_success: false,
          official_email: process.env.OFFICIAL_EMAIL,
          data: null,
          error: 'Fibonacci input must be a non-negative integer'
        });
      }
      data = generateFibonacci(fibonacci);
    }

    if (prime !== undefined) {
      if (!Array.isArray(prime)) {
        return res.status(400).json({
          is_success: false,
          official_email: process.env.OFFICIAL_EMAIL,
          data: null,
          error: 'Prime input must be an array'
        });
      }
      data = filterPrimes(prime);
    }

    if (lcm !== undefined) {
      if (!Array.isArray(lcm) || lcm.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: process.env.OFFICIAL_EMAIL,
          data: null,
          error: 'LCM input must be a non-empty array'
        });
      }
      data = calculateLCM(lcm);
    }

    if (hcf !== undefined) {
      if (!Array.isArray(hcf) || hcf.length === 0) {
        return res.status(400).json({
          is_success: false,
          official_email: process.env.OFFICIAL_EMAIL,
          data: null,
          error: 'HCF input must be a non-empty array'
        });
      }
      data = calculateHCF(hcf);
    }

    if (AI !== undefined) {
      if (typeof AI !== 'string' || AI.trim() === '') {
        return res.status(400).json({
          is_success: false,
          official_email: process.env.OFFICIAL_EMAIL,
          data: null,
          error: 'AI input must be a non-empty string'
        });
      }
      // Use AI model for dynamic answer
      let aiResult = await getAIResponse(AI);
      // For any city/capital question, extract only the first capitalized word from the AI response
      if (/capital|city/i.test(AI)) {
        // Extract all capitalized words, filter out common non-city words
        const matches = aiResult.match(/\b([A-Z][a-z]+)\b/g) || [];
        const blacklist = ["The", "A", "An", "Is", "Of", "In", "And", "It", "This", "That", "On", "At", "By", "For", "With", "As", "To", "From"];
        const city = matches.find(word => !blacklist.includes(word));
        aiResult = city || aiResult;
      }
      return res.status(200).json({
        is_success: true,
        official_email: process.env.OFFICIAL_EMAIL,
        data: aiResult
      });
    }

 
    res.status(200).json({
      is_success: true,
      official_email: process.env.OFFICIAL_EMAIL,
      data: data
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      is_success: false,
      official_email: process.env.OFFICIAL_EMAIL,
      data: null,
      error: 'Internal server error'
    });
  }
});


app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bajaj Finserv Health API',
    status: 'Running',
    endpoints: {
      health: 'GET /health',
      bfhl: 'POST /bfhl'
    },
    usage: {
      fibonacci: 'POST /bfhl with body: {"fibonacci": 7}',
      prime: 'POST /bfhl with body: {"prime": [2,4,7,9,11]}',
      lcm: 'POST /bfhl with body: {"lcm": [12,18,24]}',
      hcf: 'POST /bfhl with body: {"hcf": [24,36,60]}',
      ai: 'POST /bfhl with body: {"AI": "Your question here"}'
    }
  });
});


app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: process.env.OFFICIAL_EMAIL
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
