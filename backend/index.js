const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const shortid = require("shortid");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB setup
mongoose.connect("mongodb+srv://rahulvb27:QhVxdVXegfJQrthF@r1cluster27.cel5auk.mongodb.net/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Schema and Model
const urlSchema = new mongoose.Schema({
    originalUrl: String,
    shortUrl: String,
});
const Url = mongoose.model("Url", urlSchema);

// API Endpoint for URL Shortening
app.post("/shorten", async (req, res) => {
    const { originalUrl, alias, domain } = req.body;

    try {
        // Validate input
        if (!originalUrl || !domain) {
            return res.status(400).json({ error: "Original URL and domain are required" });
        }

        // Check if alias already exists
        if (alias) {
            const existingAlias = await Url.findOne({ shortUrl: alias });
            if (existingAlias) {
                return res.status(400).json({ error: "Alias already in use. Please choose another one." });
            }
        }

        // Generate or use alias
        const shortUrl = alias || shortid.generate();

        // Save the new URL
        const newUrl = new Url({ originalUrl, shortUrl });
        await newUrl.save();

        res.json({ originalUrl, shortUrl });
    } catch (err) {
        console.error("Error creating short URL:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// WebSocket Server
const wss = new WebSocket.Server({ port: 10000 });
wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("message", (message) => {
        console.log("Received from client:", message);
    });
});
