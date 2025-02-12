const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const cloudscraper = require('cloudscraper'); 
const { cekKey, updateKeyExpiry, deactivateKey, reactivateKey } = require('../database/db'); // Adjust path as needed
const { youtubePlay, youtubeMp4, youtubeMp3 } = require('../controllers/yt'); // Adjust path as needed
const { cakLontong, bijak, quotes, fakta, ptl, motivasi } = require('../controllers/randomtext'); // Adjust path as needed
const { geminiAi } = require('../ai'); // Adjust path as needed

const router = express.Router(); // Create a router instance

// API Keys (Consider moving these to environment variables)
const GOOGLE_API_KEY = "AIzaSyCuV73IqmbO25dYuMIMDrmmIwVowNWEUns";
const WEATHER_API_KEY = "e4517bde90e743f0b99112303252001";

// Helper function to format paragraphs
const formatParagraph = (text) => text ? text.replace(/\.\s+/g, ".\n\n") : "Tidak ada jawaban.";

// Middleware to check API Key (apply where needed)
const checkApiKey = async (req, res, next) => {
    const apikey = req.query.apikey;

    if (!apikey) {
        return res.status(400).json({ status: 400, message: 'Parameter apikey is required!' });
    }

    try {
        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).json({ status: 403, message: `API Key ${apikey} not found or invalid!` });
        }

        req.apikeyInfo = check; // Attach API key info to the request object (optional)
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("API Key check error:", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error during API key check" });
    }
};

async function kanyutkanyut(url, method = "GET", payload = null) {
    try {
        const response = method === "POST"
            ? await cloudscraper.post(url, { json: payload })
            : await cloudscraper.get(url);

        return JSON.parse(response);
    } catch (error) {
        console.error(`Cloudscraper ERROR dalam method ${method}:`, error.message);
        return { error: error.message }; // Kembalikan informasi kesalahan dalam format objek
    }
}

// Fungsi-fungsi untuk mengakses API Roblox (dipanggil di dalam handler endpoint)
async function getUserInfo(userId) { return kanyutkanyut(`https://users.roblox.com/v1/users/${userId}`); }
async function getUserGroups(userId) { return kanyutkanyut(`https://groups.roblox.com/v1/users/${userId}/groups/roles`); }
async function getUserBadges(userId) { return kanyutkanyut(`https://badges.roblox.com/v1/users/${userId}/badges`); }
async function getUserGames(userId) { return kanyutkanyut(`https://games.roblox.com/v2/users/${userId}/games`); }
async function getUserAvatar(userId) {
    return kanyutkanyut(
        `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`
    );
}
async function getUsernameHistory(userId) {
    return kanyutkanyut(`https://users.roblox.com/v1/users/${userId}/username-history`);
}
async function getUserFriends(userId) { return kanyutkanyut(`https://friends.roblox.com/v1/users/${userId}/friends`); }
async function getUserFriendCount(userId) {
    return kanyutkanyut(`https://friends.roblox.com/v1/users/${userId}/friends/count`);
}
async function getUserFollowers(userId) {
    return kanyutkanyut(`https://friends.roblox.com/v1/users/${userId}/followers`);
}
async function getUserFollowing(userId) {
    return kanyutkanyut(`https://friends.roblox.com/v1/users/${userId}/followings`);
}
async function getUserCreatedAssets(userId) {
    return kanyutkanyut(`https://catalog.roblox.com/v1/search/items?CreatorId=${userId}&CreatorType=User`);
}
async function robloxStalk(userId) {
    const results = {
        userInfo: await getUserInfo(userId),
        userGroups: await getUserGroups(userId),
        userBadges: await getUserBadges(userId),
        userGames: await getUserGames(userId),
        userAvatar: await getUserAvatar(userId),
        usernameHistory: await getUsernameHistory(userId),
        userFriends: await getUserFriends(userId),
        userFriendCount: await getUserFriendCount(userId),
        userFollowers: await getUserFollowers(userId),
        userFollowing: await getUserFollowing(userId),
        userCreatedAssets: await getUserCreatedAssets(userId),
    };

    return results;
                            }
// API Endpoints (Adapting from your provided server (5).js and api.js)
// ----------------------------------------------------------------------

// HTML serving routes (if you want to include these in the module)
router.get("/kebijakan", (req, res) => {
    res.sendFile(path.join(__dirname, "kebijakan.html"));
});

router.get("/docs", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

router.get('/daftar', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// API Endpoints to Deactivate and Reactivate API Keys
router.post('/deactivate-api', checkApiKey, async (req, res) => {
    const { apikey } = req.query; // Get apikey from query parameter
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await deactivateKey(apikey); // Use the deactivateKey function from db.js
        if (result) {
            return res.json({ creator: "WANZOFC TECH", result: true, message: "API key berhasil dinonaktifkan." });
        } else {
            return res.status(404).json({ creator: "WANZOFC TECH", result: false, message: "API key tidak ditemukan." });
        }
    } catch (error) {
        console.error("Gagal menonaktifkan API key:", error);
        return res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Terjadi kesalahan server saat menonaktifkan API key." });
    }
});

router.post('/reactivate-api', checkApiKey, async (req, res) => {
    const { apikey } = req.query; // Get apikey from query parameter
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await reactivateKey(apikey); // Use the reactivateKey function from db.js
        if (result) {
            return res.json({ creator: "WANZOFC TECH", result: true, message: "API key berhasil diaktifkan kembali." });
        } else {
            return res.status(404).json({ creator: "WANZOFC TECH", result: false, message: "API key tidak ditemukan." });
        }
    } catch (error) {
        console.error("Gagal mengaktifkan kembali API key:", error);
        return res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Terjadi kesalahan server saat mengaktifkan kembali API key." });
    }
});

// AI Endpoints (adapting examples, ensure API keys are handled securely)
router.get('/ai/deepseek-chat', checkApiKey, async (req, res) => {
    const query = req.query.content || "halo";
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Deepseek Chat", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Deepseek Chat bermasalah." });
    } finally {
        console.log('Deepseek Chat request completed.');
    }
});

router.get('/ai/image2text', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/ai/image2text?url=https://cataas.com/cat");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Image to Text", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Image to Text bermasalah." });
    } finally {
        console.log('Image to Text request completed.');
    }
});

router.get('/ai/gemini-pro', checkApiKey, async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`);
        res.json
           ({ creator: "WANZOFC TECH",
             result: true, message: "Gemini Pro AI",
             data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json
            ({ creator: "WANZOFC TECH",
              result: false,
              message: "Gemini Pro bermasalah." });
    } finally {
        console.log('Gemini Pro AI request completed.');
    }
});

router.get('/ai/meta-llama', checkApiKey, async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/meta-llama-33-70B-instruct-turbo?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Meta Llama", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Meta Llama bermasalah." });
    } finally {
        console.log('Meta Llama request completed.');
    }
});

router.get('/ai/dbrx-instruct', checkApiKey, async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/dbrx-instruct?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "DBRX Instruct", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "DBRX Instruct bermasalah." });
    } finally {
        console.log('DBRX Instruct request completed.');
    }
});

router.get('/ai/deepseek-r1', checkApiKey, async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/deepseek-r1?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Deepseek R1", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Deepseek R1 bermasalah." });
    } finally {
        console.log('Deepseek R1 request completed.');
    }
});

router.get('/gita', checkApiKey, async (req, res) => {
    const query = req.query.q || "hai";
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gita?q=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Gita AI", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gita AI bermasalah." });
    } finally {
        console.log('Gita AI request completed.');
    }
});

router.get('/anime/latest', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/anime/latest");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Anime Terbaru", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Anime Terbaru bermasalah." });
    } finally {
        console.log('Anime Terbaru request completed.');
    }
});

router.get('/anime/anichin-episode', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tolong tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/anime/anichin-episode?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Anichin Episode", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Anichin Episode bermasalah." });
    } finally {
        console.log('Anichin Episode request completed.');
    }
});

router.get('/d/mediafire', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "MediaFire Downloader", data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "MediaFire Downloader bermasalah." });
    } finally {
        console.log('MediaFire Downloader request completed.');
    }
});

router.get('/r/blue-archive', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/r/blue-archive");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Blue Archive Image", data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil gambar Blue Archive." });
    } finally {
        console.log('Random Blue Archive Image request completed.');
    }
});

router.get('/r/quotesanime', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/r/quotesanime");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Anime Quotes", data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil quote anime." });
    } finally {
        console.log('Random Anime Quotes request completed.');
    }
});

router.get('/d/tiktok', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/tiktok?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "TikTok Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "TikTok Downloader bermasalah." });
    } finally {
        console.log('TikTok Downloader request completed.');
    }
});

router.get('/d/igdl', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Instagram Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Instagram Downloader bermasalah." });
    } finally {
        console.log('Instagram Downloader request completed.');
    }
});

router.get('/d/snackvideo', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/snackvideo?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "SnackVideo Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "SnackVideo Downloader bermasalah." });
    } finally {
        console.log('SnackVideo Downloader request completed.');
    }
});

router.get('/d/capcut', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "CapCut Template Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "CapCut Template Downloader bermasalah." });
    } finally {
        console.log('CapCut Template Downloader request completed.');
    }
});

router.get('/stalk/youtube', checkApiKey, async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ result: false, message: "Tambahkan parameter 'username'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(username)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "YouTube Stalker", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "YouTube Stalker bermasalah." });
    } finally {
        console.log('YouTube Stalker request completed.');
    }
});

router.get('/stalk/tiktok', checkApiKey, async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ result: false, message: "Tambahkan parameter 'username'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(username)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "TikTok Stalker", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "TikTok Stalker bermasalah." });
    } finally {
        console.log('TikTok Stalker request completed.');
    }
});

router.get('/stalk/github', checkApiKey, async (req, res) => {
    const user = req.query.user;
    if (!user) return res.status(400).json({ result: false, message: "Tambahkan parameter 'user'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/stalk/github?user=${encodeURIComponent(user)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "GitHub Stalker", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "GitHub Stalker bermasalah." });
    } finally {
        console.log('GitHub Stalker request completed.');
    }
});

router.get('/s/tiktok', checkApiKey, async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ result: false, message: "Tambahkan parameter 'query'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/tiktok?query=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "TikTok Search", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "TikTok Search bermasalah." });
    } finally {
        console.log('TikTok Search request completed.');
    }
});

router.get('/ai/uncovr', checkApiKey, async (req, res) => {
    const content = req.query.content;
    if (!content) return res.status(400).json({ result: false, message: "Tambahkan parameter 'content'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/uncovr?content=${encodeURIComponent(content)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "AI - Uncovr Chat", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "AI - Uncovr Chat bermasalah." });
    } finally {
        console.log('AI - Uncovr Chat request completed.');
    }
});

router.get('/ai/wanzofc', checkApiKey, async (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).json({ result: false, message: "Tambahkan parameter 'text'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/yousearch?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "AI - wanzofc", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "AI - wanzofc bermasalah." });
    } finally {
        console.log('AI - wanzofc request completed.');
    }
});

router.get('/anime/otakudesu/search', checkApiKey, async (req, res) => {
    const s = req.query.s;
    if (!s) return res.status(400).json({ result: false, message: "Tambahkan parameter 's'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/anime/otakudesu/search?s=${encodeURIComponent(s)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Anime - Otakudesu Search", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Anime - Otakudesu Search bermasalah." });
    } finally {
        console.log('Anime - Otakudesu Search request completed.');
    }
});

router.get('/d/savefrom', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Downloader - SaveFrom", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Downloader - SaveFrom bermasalah." });
    } finally {
        console.log('Downloader - SaveFrom request completed.');
    }
});

router.get('/d/github', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/github?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Downloader - GitHub Repository", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Downloader - GitHub Repository bermasalah." });
    } finally {
        console.log('Downloader - GitHub Repository request completed.');
    }
});

router.get('/info/jadwaltv', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/info/jadwaltv`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - Jadwal TV", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - Jadwal TV bermasalah." });
    } finally {
        console.log('Informasi - Jadwal TV request completed.');
    }
});

router.get('/info/liburnasional', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/info/liburnasional`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - Hari Libur Nasional", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - Hari Libur Nasional bermasalah." });
    } finally {
        console.log('Informasi - Hari Libur Nasional request completed.');
    }
});

router.get('/info/bmkg', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/info/bmkg`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - BMKG", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - BMKG bermasalah." });
    } finally {
        console.log('Informasi - BMKG request completed.');
    }
});

router.get('/info/cuaca', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/info/cuaca`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - Cuaca", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - Cuaca bermasalah." });
    } finally {
        console.log('Informasi - Cuaca request completed.');
    }
});

router.get('/s/gitagram', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/gitagram`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Gitagram", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Gitagram bermasalah." });
    } finally {
        console.log('Search - Gitagram request completed.');
    }
});

router.get('/s/duckduckgo', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/duckduckgo`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - DuckDuckGo", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - DuckDuckGo bermasalah." });
    } finally {
        console.log('Search - DuckDuckGo request completed.');
    }
});

router.get('/s/combot', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/combot`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Combot", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Combot bermasalah." });
    } finally {
        console.log('Search - Combot request completed.');
    }
});

router.get('/s/bukalapak', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/bukalapak`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Bukalapak", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Bukalapak bermasalah." });
    } finally {
        console.log('Search - Bukalapak request completed.');
    }
});

router.get('/s/brave', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/brave`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Brave", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Brave bermasalah." });
    } finally {
        console.log('Search - Brave request completed.');
    }
});

router.get('/berita/kompas', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/kompas`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Kompas", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Kompas bermasalah." });
    } finally {
        console.log('Berita - Kompas request completed.');
    }
});

router.get('/berita/jkt48', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/jkt48`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - JKT48", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - JKT48 bermasalah." });
    } finally {
        console.log('Berita - JKT48 request completed.');
    }
});

router.get('/berita/cnn', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/cnn`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - CNN", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - CNN bermasalah." });
    } finally {
        console.log('Berita - CNN request completed.');
    }
});

router.get('/berita/cnbcindonesia', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/cnbcindonesia`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - CNBC Indonesia", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - CNBC Indonesia bermasalah." });
    } finally {
        console.log('Berita - CNBC Indonesia request completed.');
    }
});

router.get('/berita/antara', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/antara`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Antara", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Antara bermasalah." });
    } finally {
        console.log('Berita - Antara request completed.');
    }
});

router.get('/berita/tribunnews', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/tribunnews`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Tribunnews", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Tribunnews bermasalah." });
    } finally {
        console.log('Berita - Tribunnews request completed.');
    }
});

router.get('/berita/suara', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/suara`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Suara", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Suara bermasalah." });
    } finally {
        console.log('Berita - Suara request completed.');
    }
});

router.get('/berita/merdeka', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/merdeka`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Merdeka", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Merdeka bermasalah." });
    } finally {
        console.log('Berita - Merdeka request completed.');
    }
});

router.get('/berita/sindonews', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/sindonews`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Sindonews", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Sindonews bermasalah." });
    } finally {
        console.log('Berita - Sindonews request completed.');
    }
});

router.get('/berita/liputan6', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/berita/liputan6`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Liputan6", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Liputan6 bermasalah." });
    } finally {
        console.log('Berita - Liputan6 request completed.');
    }
});

router.get('/apk/playstore', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/apk/playstore`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - Play Store", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari Play Store." });
    } finally {
        console.log('APK - Play Store request completed.');
    }
});

router.get('/apk/happymod', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/apk/happymod`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - HappyMod", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari HappyMod." });
    } finally {
        console.log('APK - HappyMod request completed.');
    }
});

router.get('/apk/appstore', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/apk/appstore`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - App Store", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari App Store." });
    } finally {
        console.log('APK - App Store request completed.');
    }
});

router.get('/apk/apkpure', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/apk/apkpure`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - APKPure", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari APKPure." });
    } finally {
        console.log('APK - APKPure request completed.');
    }
});

router.get('/apk/apkmody', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/apk/apkmody`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - APKMody", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari APKMody." });
    } finally {
        console.log('APK - APKMody request completed.');
    }
});

router.get('/tools/subdomains', checkApiKey, async (req, res) => {
    try {
        const domain = req.query.domain;
        if (!domain) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter domain!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/subdomains?domain=${encodeURIComponent(domain)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: `Subdomain Scanner untuk ${domain}`, data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data subdomain." });
    } finally {
        console.log('Subdomain Scanner request completed.');
    }
});

router.get('/tools/text2base64', checkApiKey, async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan teks untuk dikonversi!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/text2base64?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text to Base64", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengonversi teks ke Base64." });
    } finally {
        console.log('Text to Base64 request completed.');
    }
});

router.get('/tools/text2qr', checkApiKey, async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan teks untuk dikonversi!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/text2qr?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text to QR Code", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengonversi teks ke QR Code." });
    } finally {
        console.log('Text to QR Code request completed.');
    }
});

router.get('/tools/translate', checkApiKey, async (req, res) => {
    try {
        const text = req.query.text;
        const lang = req.query.lang || "en"; // Default English jika tidak ada parameter lang
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan teks untuk diterjemahkan!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(text)}&lang=${lang}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text Translation", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal menerjemahkan teks." });
    } finally {
        console.log('Text Translation request completed.');
    }
});

router.get('/ai/lepton', checkApiKey, async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter text!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/lepton?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Lepton AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari Lepton AI." });
    } finally {
        console.log('Lepton AI Response request completed.');
    }
});

router.get('/ai/gpt3', checkApiKey, async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const content = req.query.content;
        if (!prompt || !content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt dan content!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}&content=${encodeURIComponent(content)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "GPT-3 AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari GPT-3 AI." });
    } finally {
        console.log('GPT-3 AI Response request completed.');
    }
});

router.get('/r/waifu', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/r/waifu");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Waifu Image", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan waifu random." });
    } finally {
        console.log('Random Waifu Image request completed.');
    }
});

router.get('/cf/sentiment', checkApiKey, async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter text!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/cf/sentiment?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Sentiment Analysis Result", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan hasil analisis sentimen." });
    } finally {
        console.log('Sentiment Analysis Result request completed.');
    }
});

router.get('/cf/image-classification', checkApiKey, async (req, res) => {
    try {
        const imageUrl = req.query.imageUrl;
        if (!imageUrl) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter imageUrl!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/cf/image-classification?imageUrl=${encodeURIComponent(imageUrl)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Image Classification Result", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengklasifikasikan gambar." });
    } finally {
        console.log('Image Classification Result request completed.');
    }
});

router.get('/cf/embedding', checkApiKey, async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter text!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/cf/embedding?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text Embedding Result", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan embedding teks." });
    } finally {
        console.log('Text Embedding Result request completed.');
    }
});

router.get('/cf/chat', checkApiKey, async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const system = req.query.system;
        if (!prompt || !system) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt dan system!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/cf/chat?prompt=${encodeURIComponent(prompt)}&system=${encodeURIComponent(system)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Cloudflare AI Chat Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari chatbot AI." });
    } finally {
        console.log('Cloudflare AI Chat Response request completed.');
    }
});

router.get('/ai/qwen257b', checkApiKey, async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const text = req.query.text;
        if (!prompt || !text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt dan text!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/qwen257b?prompt=${encodeURIComponent(prompt)}&text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Qwen 257B AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari AI Qwen 257B." });
    } finally {
        console.log('Qwen 257B AI Response request completed.');
    }
});

router.get('/ai/qwq-32b-preview', checkApiKey, async (req, res) => {
    try {
        const content = req.query.content;
        if (!content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter content!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/qwq-32b-preview?content=${encodeURIComponent(content)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "QWQ 32B AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari AI QWQ 32B." });
    } finally {
        console.log('QWQ 32B AI Response request completed.');
    }
});

router.get('/s/pinterest', checkApiKey, async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Hasil pencarian Pinterest", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan hasil dari Pinterest." });
    } finally {
        console.log('Hasil pencarian Pinterest request completed.');
    }
});

router.get('/s/soundcloud', checkApiKey, async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/soundcloud?query=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Hasil pencarian SoundCloud", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan hasil dari SoundCloud." });
    } finally {
        console.log('Hasil pencarian SoundCloud request completed.');
    }
});

router.get('/stalk/npm', checkApiKey, async (req, res) => {
    try {
        const packageName = req.query.packageName;
        if (!packageName) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter packageName!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/stalk/npm?packageName=${encodeURIComponent(packageName)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi NPM Package", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan informasi dari NPM." });
    } finally {
        console.log('Informasi NPM Package request completed.');
    }
});

router.get('/ai/stabilityai', checkApiKey, async (req, res) => {
    try {
        const prompt = req.query.prompt;
        if (!prompt) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(prompt)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Gambar dari Stability AI", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan gambar dari Stability AI." });
    } finally {
        console.log('Gambar dari Stability AI request completed.');
    }
});

router.get('/s/wikipedia', checkApiKey, async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/wikipedia?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Wikipedia." });
    } finally {
        console.log('Wikipedia Search request completed.');
    }
});

router.get('/s/spotify', checkApiKey, async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Spotify." });
    } finally {
        console.log('Spotify Search request completed.');
    }
});

router.get('/tools/fake-data', checkApiKey, async (req, res) => {
    try {
        const type = req.query.type || "person";
        const count = req.query.count || 5;

        const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/fake-data?type=${type}&count=${count}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil fake data." });
    } finally {
        console.log('Fake Data request completed.');
    }
});

router.get('/primbon/cek_potensi_penyakit', checkApiKey, async (req, res) => {
    try {
        const { tgl, bln, thn } = req.query;
        if (!tgl || !bln || !thn) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter tgl, bln, dan thn!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/cek_potensi_penyakit?tgl=${tgl}&bln=${bln}&thn=${thn}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Primbon Penyakit." });
    } finally {
        console.log('Primbon Penyakit request completed.');
    }
});

router.get('/primbon/ramalanjodoh', checkApiKey, async (req, res) => {
    try {
        const { nama1, tgl1, bln1, thn1, nama2, tgl2, bln2, thn2 } = req.query;
        if (!nama1 || !tgl1 || !bln1 || !thn1 || !nama2 || !tgl2 || !bln2 || !thn2)
            return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan semua parameter yang diperlukan!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/ramalanjodoh?nama1=${encodeURIComponent(nama1)}&tgl1=${tgl1}&bln1=${bln1}&thn1=${thn1}&nama2=${encodeURIComponent(nama2)}&tgl2=${tgl2}&bln2=${bln2}&thn2=${thn2}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Ramalan Jodoh." });
    } finally {
        console.log('Ramalan Jodoh request completed.');
    }
});

router.get('/primbon/rejeki_hoki_weton', checkApiKey, async (req, res) => {
    try {
        const { tgl, bln, thn } = req.query;
        if (!tgl || !bln || !thn) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter tgl, bln, dan thn!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/rejeki_hoki_weton?tgl=${tgl}&bln=${bln}&thn=${thn}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Rejeki Weton." });
    } finally {
        console.log('Rejeki Weton request completed.');
    }
});

router.get('/primbon/sifat_usaha_bisnis', checkApiKey, async (req, res) => {
    try {
        const { tgl, bln, thn } = req.query;
        if (!tgl || !bln || !thn) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter tgl, bln, dan thn!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/sifat_usaha_bisnis?tgl=${tgl}&bln=${bln}&thn=${thn}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Sifat Usaha." });
    } finally {
        console.log('Sifat Usaha request completed.');
    }
});

router.get('/primbon/tafsirmimpi', checkApiKey, async (req, res) => {
    try {
        const mimpi = req.query.mimpi;
        if (!mimpi) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter mimpi!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/tafsirmimpi?mimpi=${encodeURIComponent(mimpi)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Tafsir Mimpi." });
    } finally {
        console.log('Tafsir Mimpi request completed.');
    }
});

router.get('/primbon/artinama', checkApiKey, async (req, res) => {
    try {
        const nama = req.query.nama;
        if (!nama) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter nama!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/artinama?nama=${encodeURIComponent(nama)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Arti Nama." });
    } finally {
        console.log('Arti Nama request completed.');
    }
});

router.get('/primbon/kecocokan_nama_pasangan', checkApiKey, async (req, res) => {
    try {
        const { nama1, nama2 } = req.query;
        if (!nama1 || !nama2) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter nama1 dan nama2!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan?nama1=${encodeURIComponent(nama1)}&nama2=${encodeURIComponent(nama2)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Kecocokan Nama Pasangan." });
    } finally {
        console.log('Kecocokan Nama Pasangan request completed.');
    }
});

router.get('/primbon/nomorhoki', checkApiKey, async (req, res) => {
    try {
        const phoneNumber = req.query.phoneNumber;
        if (!phoneNumber) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter phoneNumber!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/nomorhoki?phoneNumber=${phoneNumber}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Nomor Hoki." });
    } finally {
        console.log('Nomor Hoki request completed.');
    }
});

router.get('/primbon/zodiak', checkApiKey, async (req, res) => {
    try {
        const zodiak = req.query.zodiak;
        if (!zodiak) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter zodiak!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/primbon/zodiak?zodiak=${encodeURIComponent(zodiak)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Zodiak." });
    } finally {
        console.log('Zodiak request completed.');
    }
});

router.get('/ai/metaai', checkApiKey, async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/metaai?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Meta AI." });
    } finally {
        console.log('Meta AI request completed.');
    }
});

router.get('/ai/ustadz', checkApiKey, async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/muslimai?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data USTADZ AI." });
    } finally {
        console.log('USTADZ AI request completed.');
    }
});

router.get('/ai/khodam', checkApiKey, async (req, res) => {
    try {
        const content = req.query.content;
        if (!content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter content!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/dukun?content=${encodeURIComponent(content)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Khodam AI." });
    } finally {
        console.log('Khodam AI request completed.');
    }
});

router.get('/ai/wanzofc-you', checkApiKey, async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });
        const { data } = await axios.get(`https://api.neoxr.eu/api/you?q=${encodeURIComponent(q)}&apikey=PJaLJu`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari wanzofc You." });
    } finally {
        console.log('wanzofc You request completed.');
    }
});

router.get('/ai/wanzofc-llama', checkApiKey, async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });
        const { data } = await axios.get(`https://api.neoxr.eu/api/llama?q=${encodeURIComponent(q)}&apikey=PJaLJu`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari wanzofc Llama." });
    } finally {
        console.log('wanzofc Llama request completed.');
    }
});

router.get('/ai/meta-llama', checkApiKey, async (req, res) => {
    try {
        const content = req.query.content;
        if (!content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter content!" });

        const { data } = await axios.get(`https://api.siputzx.my.id/api/ai/meta-llama-33-70B-instruct-turbo?content=${encodeURIComponent(content)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari Meta LLaMA." });
    } finally {
        console.log('Meta LLaMA request completed.');
    }
});

router.get('/search/xnxx', checkApiKey, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });

        const { data } = await axios.get(`https://archive-ui.tanakadomp.biz.id/search/xnxx?q=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari XNXX." });
    } finally {
        console.log('XNXX Search request completed.');
    }
});
router.get('/r/cecan/china', checkApiKey, async (req, res) => {
    try {
        const { data } = await axios.get("https://api.siputzx.my.id/api/r/cecan/china");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Chinese Cecan Image", data: data });
    } catch (error) {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil gambar Cecan China." });
    } finally {
        console.log('Random Chinese Cecan Image request completed.');
    }
});

router.get('/d/spotify', checkApiKey, async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Spotify Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Spotify Downloader bermasalah." });
    } finally {
        console.log('Spotify Downloader request completed.');
    }
});

router.get('/tools/ngl', checkApiKey, async (req, res) => {
    const link = req.query.link;
    const text = req.query.text;

    if (!link || !text) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tambahkan parameter 'link' dan 'text'." });
    }

    try {
        const { data } = await axios.get(`https://api.siputzx.my.id/api/tools/ngl?link=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "NGL Tool", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "NGL Tool bermasalah." });
    } finally {
        console.log('NGL Tool request completed.');
    }
});

router.get('/api/e/dana', checkApiKey, async (req, res) => {
    try {
        // Lakukan permintaan ke API eksternal menggunakan axios
        const response = await axios.get('https://apis.xyrezz.online-server.biz.id/api/okeconnect/dana');

        // Ambil data dari respons
        const data = response.data;

        // Kirim data yang diterima sebagai respons
        res.json({ 
            creator: "WANZOFC TECH", 
            result: true, 
            message: "Data dari API Dana berhasil diambil.", 
            data: data 
        });

    } catch (error) {
        console.error("Terjadi kesalahan saat memanggil API Dana:", error);
        res.status(500).json({ 
            creator: "WANZOFC TECH", 
            result: false, 
            message: "Terjadi kesalahan server saat memanggil API Dana: " + error.message 
        });
    } finally {
        console.log('Permintaan ke API Dana selesai.');
    }
});
router.get('/stalk/roblox', checkApiKey, async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json(formatResponse("WANZOFC TECH", false, "ID Pengguna Roblox diperlukan. Parameter 'userId' harus ditambahkan."));
    }

    try {
        const data = await robloxStalk(userId);
        res.json(formatResponse("WANZOFC TECH", true, "Informasi Roblox Stalk", data));
    } catch (error) {
        console.error("Kesalahan saat melakukan Roblox Stalk:", error);
        res.status(500).json(formatResponse("WANZOFC TECH", false, "Gagal melakukan Roblox Stalk. Coba lagi nanti."));
    } finally {
        console.log(`Roblox Stalk selesai untuk userId: ${userId}`);
    }
});

// API Endpoints to Deactivate and Reactivate API Keys
router.post('/deactivate-api', checkApiKey, async (req, res) => {
    const { apikey } = req.query; // Get apikey from query parameter
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await deactivateKey(apikey); // Use the deactivateKey function from db.js
        if (result) {
            return res.json({ creator: "WANZOFC TECH", result: true, message: "API key berhasil dinonaktifkan." });
        } else {
            return res.status(404).json({ creator: "WANZOFC TECH", result: false, message: "API key tidak ditemukan." });
        }
    } catch (error) {
        console.error("Gagal menonaktifkan API key:", error);
        return res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Terjadi kesalahan server saat menonaktifkan API key." });
    }
});

router.post('/reactivate-api', checkApiKey, async (req, res) => {
    const { apikey } = req.query; // Get apikey from query parameter
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await reactivateKey(apikey); // Use the reactivateKey function from db.js
        if (result) {
            return res.json({ creator: "WANZOFC TECH", result: true, message: "API key berhasil diaktifkan kembali." });
        } else {
            return res.status(404).json({ creator: "WANZOFC TECH", result: false, message: "API key tidak ditemukan." });
        }
    } catch (error) {
        console.error("Gagal mengaktifkan kembali API key:", error);
        return res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Terjadi kesalahan server saat mengaktifkan kembali API key." });
    }
});

module.exports = router;
