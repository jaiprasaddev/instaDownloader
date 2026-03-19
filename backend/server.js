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

    res.json({
      success: true,
      url: media[0].media,
      type: media[0].isVideo ? "video" : "image",
    });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.json({
      success: false,
      message: "API failed",
    });
  }
});

// ✅ PROXY
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

// ✅ PORT FIX (IMPORTANT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});