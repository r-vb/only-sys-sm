import React, { useState } from "react";
import axios from "axios";

function App() {
    const [originalUrl, setOriginalUrl] = useState("");
    const [alias, setAlias] = useState("");
    const [domain, setDomain] = useState("shotme.cc"); // Default domain
    const [shortUrl, setShortUrl] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("https://shotme.cc/shorten", {
                originalUrl,
                alias: alias.trim() || null,
                domain,
            });
            setShortUrl(`${response.data.domain}/${response.data.shortUrl}`);
            setError("");
        } catch (err) {
            setError(err.response?.data?.error || "Something went wrong");
        }
    };

    return (
        <div>
            <h1>URL Shortener</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter URL"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Enter custom alias (optional)"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                />
                <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                    <option value="shotme.cc">shotme.cc</option>
                    <option value="smad.cc">smad.cc</option>
                </select>
                <button type="submit">Shorten</button>
            </form>
            {shortUrl && (
                <p>
                    Short URL: <a href={`https://${shortUrl}`} target="_blank" rel="noopener noreferrer">{shortUrl}</a>
                </p>
            )}
            {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
    );
}

export default App;
