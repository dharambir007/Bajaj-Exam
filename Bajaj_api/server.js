const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const MY_EMAIL = process.env.EMAIL;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// check prime
const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
};

// gcd and lcm
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);

// post route
app.post('/bfhl', async (req, res) => {
    try {
        const body = req.body;

        if (!body || typeof body !== "object") {
            return res.status(400).json({ is_success: false });
        }

        const keys = Object.keys(body);
        if (keys.length !== 1) {
            return res.status(400).json({ is_success: false });
        }

        const key = keys[0];
        let result;

        // fibonacci
        if (key === 'fibonacci') {
            const n = body.fibonacci;
            if (!Number.isInteger(n) || n < 0)
                return res.status(400).json({ is_success: false });

            const fib = [0, 1];
            for (let i = 2; i < n; i++) {
                fib[i] = fib[i - 1] + fib[i - 2];
            }
            result = fib.slice(0, n);
        }

        // prime filter
        else if (key === 'prime') {
            const arr = body.prime;
            if (!Array.isArray(arr))
                return res.status(400).json({ is_success: false });

            result = arr.filter(x => Number.isInteger(x) && isPrime(x));
        }

        // lcm
        else if (key === 'lcm') {
            const arr = body.lcm;
            if (!Array.isArray(arr) || arr.length === 0)
                return res.status(400).json({ is_success: false });

            result = arr.reduce((a, b) => lcm(a, b));
        }

        // hcf
        else if (key === 'hcf') {
            const arr = body.hcf;
            if (!Array.isArray(arr) || arr.length === 0)
                return res.status(400).json({ is_success: false });

            result = arr.reduce((a, b) => gcd(a, b));
        }

        // ai using gemini
        else if (key === 'AI') {
            const question = body.AI;

            if (typeof question !== 'string' || question.trim().length === 0) {
                return res.status(400).json({ is_success: false, message: "AI must be a non-empty string" });
            }

            try {
                const geminiRes = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
                    {
                        contents: [{
                            parts: [{ text: question + '. Answer in ONE word only.' }]
                        }]
                    }
                );

                let answer = geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Unknown';
                answer = answer.trim().split(/\s+/)[0];

                return res.json({
                    is_success: true,
                    official_email: MY_EMAIL,
                    data: answer
                });
            } catch (err) {
                console.error("Gemini error:", err.response?.data || err.message);
                return res.status(500).json({
                    is_success: false,
                    message: "AI service failed"
                });
            }
        }

        // invalid key
        else {
            return res.status(400).json({ is_success: false });
        }

        // send back result
        return res.status(200).json({
            is_success: true,
            official_email: MY_EMAIL,
            data: result
        });

    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({
            is_success: false,
            message: "Internal server error"
        });
    }
});

// health check
app.get('/health', (req, res) => {
    res.json({
        is_success: true,
        official_email: MY_EMAIL
    });
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
