const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const shortid = require("shortid");
const WebSocket = require("ws");

const app = express();

// MongoDB connection setup
mongoose.connect("mongodb+srv://rahulvb27:QhVxdVXegfJQrthF@r1cluster27.cel5auk.mongodb.net/test")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

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

// Middleware to set CSP headers for image loading
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:");
    next();
});

// Serve a basic HTML page with your custom template
app.get("/", (req, res) => {
    res.send(`
        <html>
            <head>
                <title>SMAD | Shotme's Parent Company</title>
                <meta name="description" content="SMAD - Shotme's Parent Company" />
                <link rel="icon" href="/logo-smad.png" />
                <!-- Include FontAwesome for the circle icon -->
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet" />
                <style>
                    /* General styles for the page */
                    .container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #000;
                    }

                    /* Embossed text styles */
                    .embossedText {
                        font-size: 5rem;
                        color: #fff;
                        font-weight: bold;
                        text-transform: uppercase;
                        text-align: center;
                        position: relative;
                        letter-spacing: 5px;
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        text-shadow: 
                            2px 2px 4px rgba(0, 0, 0, 0.4), 
                            -2px -2px 4px rgba(0, 0, 0, 0.4),
                            4px 4px 6px rgba(0, 0, 0, 0.2);
                    }

                    /* Dot styling */
                    .dot {
                        color: #cba921;
                        display: inline-flex;
                        align-items: center;
                        height: 1.5rem;
                        width: 1.5rem;
                        border-radius: 50%;
                        margin: 0 5px;
                        line-height: 0;
                    }

                    .dot i {
                        font-size: 1rem;
                    }

                    /* Emboss effect for the text */
                    .embossedText::before,
                    .embossedText::after {
                        content: "S M A D [dot] C C";
                        position: absolute;
                        top: 0;
                        left: 0;
                        color: rgba(255, 255, 255, 0.2);
                        z-index: -1;
                        transform: translate(4px, 4px);
                    }

                    .embossedText::after {
                        transform: translate(-4px, -4px);
                    }

                    /* Mobile responsiveness */
                    @media (max-width: 768px) {
                        .embossedText {
                            font-size: 3rem;
                            letter-spacing: 3px;
                        }
                    }

                    @media (max-width: 480px) {
                        .embossedText {
                            font-size: 2.5rem;
                            letter-spacing: 2px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="embossedText">
                        S M A D<span class="dot"><i class="fas fa-circle"></i></span>C C
                    </div>
                </div>
            </body>
        </html>
    `);
});

// API Endpoint for URL shortening
app.post("/shorten", async (req, res) => {
    const { originalUrl, alias, domain } = req.body;

    try {
        if (!originalUrl || !domain) {
            return res.status(400).json({ error: "Original URL and domain are required" });
        }

        if (alias) {
            const existingAlias = await Url.findOne({ shortUrl: alias, domain });
            if (existingAlias) {
                return res.status(400).json({ error: "Alias already in use. Please choose another one." });
            }
        }

        const shortUrl = alias || shortid.generate();
        const newUrl = new Url({ originalUrl, shortUrl, domain });
        await newUrl.save();

        res.json({
            shortUrl: `${shortUrl}`,
            domain,
            originalUrl,
        });
    } catch (err) {
        console.error("Error creating short URL:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// URL redirection for shortened links
app.get("/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;
    try {
        const url = await Url.findOne({ shortUrl });
        if (!url) {
            return res.status(404).send("URL not found");
        }
        res.redirect(url.originalUrl);
    } catch (err) {
        console.error("Error redirecting:", err);
        res.status(500).send("Internal Server Error");
    }
});

// WebSocket server setup with a new port
const wss = new WebSocket.Server({ port: 10001 });
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
