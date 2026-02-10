const axios = require("axios");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ is_success: false, message: "Method not allowed" });
    }

    const body = req.body;
    const EMAIL = process.env.EMAIL;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // prime check
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

    try {
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
        if (key === "fibonacci") {
            const n = body.fibonacci;
            if (!Number.isInteger(n) || n < 0)
                return res.status(400).json({ is_success: false });

            const fib = [0, 1];
            for (let i = 2; i < n; i++)
                fib[i] = fib[i - 1] + fib[i - 2];
            result = fib.slice(0, n);
        }

        // prime filter
        else if (key === "prime") {
            const arr = body.prime;
            if (!Array.isArray(arr))
                return res.status(400).json({ is_success: false });
            result = arr.filter(x => Number.isInteger(x) && isPrime(x));
        }

        // lcm
        else if (key === "lcm") {
            const arr = body.lcm;
            if (!Array.isArray(arr) || arr.length === 0)
                return res.status(400).json({ is_success: false });
            result = arr.reduce((a, b) => lcm(a, b));
        }

        // hcf
        else if (key === "hcf") {
            const arr = body.hcf;
            if (!Array.isArray(arr) || arr.length === 0)
                return res.status(400).json({ is_success: false });
            result = arr.reduce((a, b) => gcd(a, b));
        }

        // ai using gemini
        else if (key === "AI") {
            const question = body.AI;
            if (typeof question !== "string" || question.trim().length === 0) {
                return res.status(400).json({ is_success: false, message: "AI must be a non-empty string" });
            }

            const geminiRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
                {
                    contents: [{
                        parts: [{ text: question + ". Answer in ONE word only." }]
                    }]
                }
            );

            let answer = geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Unknown";
            answer = answer.trim().split(/\s+/)[0];
            result = answer;
        }

        else {
            return res.status(400).json({ is_success: false });
        }

        return res.status(200).json({
            is_success: true,
            official_email: EMAIL,
            data: result
        });

    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ is_success: false, message: "Internal server error" });
    }
};
