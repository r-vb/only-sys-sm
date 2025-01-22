const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const shortid = require("shortid");

const app = express();
const PORT = 5000;

// MongoDB connection
mongoose.connect("mongodb+srv://rahulvb27:QhVxdVXegfJQrthF@r1cluster27.cel5auk.mongodb.net/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true }, // Removed unique: true
    shortUrl: { type: String, unique: true, required: true }, // Ensure shortUrl remains unique
});

const Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(bodyParser.json());

// // Route to shorten URL
// app.post("/shorten", async (req, res) => {
//   const { originalUrl } = req.body;

//   const existingUrl = await Url.findOne({ originalUrl });
//   if (existingUrl) {
//     return res.json(existingUrl);
//   }

//   const shortUrl = shortid.generate();
//   const newUrl = new Url({ originalUrl, shortUrl });
//   await newUrl.save();
//   res.json(newUrl);
// });

// // Route to shorten URL with optional alias
// app.post("/shorten", async (req, res) => {
//     const { originalUrl, alias } = req.body;

//     try {
//         // Check if alias is provided and already exists
//         if (alias) {
//             const existingAlias = await Url.findOne({ shortUrl: alias });
//             if (existingAlias) {
//                 return res.status(400).json({ error: "Alias already in use. Please choose another one." });
//             }
//         }

//         // Use alias if provided, otherwise generate a random short URL
//         const shortUrl = alias || shortid.generate();

//         // Create and save new URL
//         const newUrl = new Url({ originalUrl, shortUrl });
//         await newUrl.save();

//         console.log("New short URL created:", newUrl); // Debugging
//         res.json(newUrl);
//     } catch (err) {
//         console.error("Error creating short URL:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

app.post("/shorten", async (req, res) => {
    const { originalUrl, alias, domain } = req.body;

    try {
        // Validate the domain
        if (!["shotme.cc", "smad.cc"].includes(domain)) {
            return res.status(400).json({ error: "Invalid domain selected." });
        }

        // Check if alias is provided and already exists
        if (alias) {
            const existingAlias = await Url.findOne({ shortUrl: `${domain}/${alias}` });
            if (existingAlias) {
                return res.status(400).json({ error: "Alias already in use. Please choose another one." });
            }
        }

        // Use alias if provided, otherwise generate a random short URL
        const shortPath = alias || shortid.generate();
        const shortUrl = `${domain}/${shortPath}`;

        // Create and save new URL
        const newUrl = new Url({ originalUrl, shortUrl });
        await newUrl.save();

        res.json({ shortUrl: `http://${shortUrl}` });
    } catch (err) {
        console.error("Error creating short URL:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});





// Route to redirect to original URL
app.get("/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;

    const url = await Url.findOne({ shortUrl });
    if (url) {
        return res.redirect(url.originalUrl);
    }
    res.status(404).json({ error: "URL not found" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
