const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Serve frontend properly
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

// ✅ ENV API KEY
const API_KEY = process.env.API_KEY;

/**
 * Best-effort byte size from CDN (HEAD, then short GET to read headers only).
 */
async function fetchMediaContentLength(mediaUrl) {
  try {
    const r = await axios.head(mediaUrl, {
      maxRedirects: 5,
      timeout: 20000,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const cl = r.headers["content-length"];
    if (cl) return parseInt(String(cl), 10);
  } catch (_) {
    /* try GET */
  }
  try {
    const r = await axios.get(mediaUrl, {
      responseType: "stream",
      maxRedirects: 5,
      timeout: 20000,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const cl = r.headers["content-length"];
    if (typeof r.data?.destroy === "function") r.data.destroy();
    if (cl) return parseInt(String(cl), 10);
  } catch (_) {
    /* ignore */
  }
  return null;
}

// ✅ DOWNLOAD ROUTE
app.post("/download", async (req, res) => {
  const { url } = req.body;

  const cleanUrl = url.split("?")[0];

  try {
    const response = await axios.get(
      "https://instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com/scraper",
      {
        params: { url: cleanUrl },
        headers: {
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host":
            "instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com",
        },
      }
    );

    const media = response.data.data;

    if (!media || media.length === 0) {
      return res.json({
        success: false,
        message: "No media found",
      });
    }

    const mediaUrl = media[0].media;
    const size = await fetchMediaContentLength(mediaUrl);

    res.json({
      success: true,
      url: mediaUrl,
      type: media[0].isVideo ? "video" : "image",
      ...(size != null ? { size } : {}),
    });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.json({
      success: false,
      message: "API failed",
    });
  }
});

// ✅ PROXY (GET — stream media)
app.get("/proxy", async (req, res) => {
  const url = req.query.url;

  try {
    const response = await axios.get(url, {
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);

  } catch {
    res.status(500).send("Proxy error");
  }
});

// ✅ PROXY HEAD — same-origin size probe for the browser
app.head("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).end();
  }
  try {
    const response = await axios.head(url, {
      maxRedirects: 5,
      timeout: 20000,
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const ct = response.headers["content-type"];
    const cl = response.headers["content-length"];
    if (ct) res.setHeader("Content-Type", ct);
    if (cl) res.setHeader("Content-Length", cl);
    res.status(200).end();
  } catch {
    res.status(500).end();
  }
});

// ✅ PORT FIX (IMPORTANT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});