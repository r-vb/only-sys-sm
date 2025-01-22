const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const shortid = require("shortid");
const WebSocket = require("ws");

const app = express();

// MongoDB connection setup
mongoose.connect("mongodb+srv://rahulvb27:QhVxdVXegfJQrthF@r1cluster27.cel5auk.mongodb.net/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// URL schema and model
const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true },
    domain: { type: String, required: true },
});
const Url = mongoose.model("Url", urlSchema);

// Middleware setup
app.use(express.json());
app.use(cors({
    origin: "https://short-me-front.onrender.com", // Replace with your frontend domain
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
}));

// API Endpoint for URL shortening
app.post("/shorten", async (req, res) => {
    const { originalUrl, alias, domain } = req.body;

    try {
        // Validate input
        if (!originalUrl || !domain) {
            return res.status(400).json({ error: "Original URL and domain are required" });
        }

        // Check if alias already exists for the domain
        if (alias) {
            const existingAlias = await Url.findOne({ shortUrl: alias, domain });
            if (existingAlias) {
                return res.status(400).json({ error: "Alias already in use. Please choose another one." });
            }
        }

        // Generate or use provided alias for the short URL
        const shortUrl = alias || shortid.generate();

        // Save the new shortened URL to the database
        const newUrl = new Url({ originalUrl, shortUrl, domain });
        await newUrl.save();

        res.json({
            shortUrl: `${domain}/${shortUrl}`,
            originalUrl,
            domain,
        });
    } catch (err) {
        console.error("Error creating short URL:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// WebSocket server setup
const wss = new WebSocket.Server({ port: 10000 });
wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
        console.log("Received from client:", message);
    });

    ws.on("close", () => {
        console.log("WebSocket client disconnected");
    });
});

// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
