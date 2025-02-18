const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const cloudscraper = require('cloudscraper');
const { cekKey, updateKeyExpiry, deactivateKey, reactivateKey } = require('../database/db');
const { youtubePlay, youtubeMp4, youtubeMp3 } = require('../controllers/yt');
const { cakLontong, bijak, quotes, fakta, ptl, motivasi } = require('../controllers/randomtext');
const { geminiAi } = require('../ai');
const compression = require('compression');
const redis = require('redis');
const apicache = require('apicache');
const http = require('http');
const https = require('https');
require('dotenv').config();

const router = express.Router();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

const formatParagraph = (text) => text ? text.replace(/\.\s+/g, ".\n\n") : "Tidak ada jawaban.";

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

        req.apikeyInfo = check;
        next();
    } catch (error) {
        console.error("API Key check error:", error);
        return res.status(500).json({ status: 500, message: "Internal Server Error during API key check" });
    }
};

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const axiosInstance = axios.create({
    httpAgent: httpAgent,
    httpsAgent: httpsAgent
});

async function kanyutkanyut(url, method = "GET", payload = null) {
    try {
        const response = method === "POST"
            ? await cloudscraper.post(url, { json: payload })
            : await cloudscraper.get(url);

        return JSON.parse(response);
    } catch (error) {
        console.error(`Cloudscraper ERROR dalam method ${method}:`, error.message);
        return { error: error.message };
    }
}

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

router.use(compression());
let cache = apicache.middleware;
const redisClient = redis.createClient();

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch(err => {
    console.log('Could not connect to Redis', err);
});
const cacheWithRedis = async (req, res, next) => {
    const { url } = req;
    try {
        const cachedData = await redisClient.get(url);
        if (cachedData) {
            const result = JSON.parse(cachedData);
            res.status(200).json(result);
        } else {
            next();
        }
    } catch (error) {
        console.error("Redis cache error:", error);
        next();
    }
}
const setCacheWithRedis = async (req, res, next) => {
    const { url } = req;
    try {
        await redisClient.set(url, JSON.stringify(res.locals.responseData), {
            EX: 30,
            NX: true
        });
        next();
    } catch (error) {
        console.error("Redis set cache error:", error);
        next();
    }
}

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

router.post('/deactivate-api', checkApiKey, async (req, res) => {
    const { apikey } = req.query;
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await deactivateKey(apikey);
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
    const { apikey } = req.query;
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await reactivateKey(apikey);
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

router.get('/ai/deepseek-chat', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.content || "halo";
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/deepseek-llm-67b-chat?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Deepseek Chat", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Deepseek Chat bermasalah." });
    } finally {
        console.log('Deepseek Chat request completed.');
    }
});

router.get('/ai/image2text', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get("https://api.siputzx.my.id/api/ai/image2text?url=https://cataas.com/cat");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Image to Text", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Image to Text bermasalah." });
    } finally {
        console.log('Image to Text request completed.');
    }
});

router.get('/ai/gemini-pro', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`);
        res.json
            ({
                creator: "WANZOFC TECH",
                result: true, message: "Gemini Pro AI",
                data: formatParagraph(data?.data)
            });
    } catch {
        res.status(500).json
            ({
                creator: "WANZOFC TECH",
                result: false,
                message: "Gemini Pro bermasalah."
            });
    } finally {
        console.log('Gemini Pro AI request completed.');
    }
});

router.get('/ai/meta-llama', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/meta-llama-33-70B-instruct-turbo?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Meta Llama", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Meta Llama bermasalah." });
    } finally {
        console.log('Meta Llama request completed.');
    }
});

router.get('/ai/dbrx-instruct', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/dbrx-instruct?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "DBRX Instruct", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "DBRX Instruct bermasalah." });
    } finally {
        console.log('DBRX Instruct request completed.');
    }
});

router.get('/ai/deepseek-r1', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.content || "hai";
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/deepseek-r1?content=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Deepseek R1", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Deepseek R1 bermasalah." });
    } finally {
        console.log('Deepseek R1 request completed.');
    }
});

router.get('/gita', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.q || "hai";
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/gita?q=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Gita AI", data: formatParagraph(data?.data) });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gita AI bermasalah." });
    } finally {
        console.log('Gita AI request completed.');
    }
});

router.get('/anime/latest', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get("https://api.siputzx.my.id/api/anime/latest");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Anime Terbaru", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Anime Terbaru bermasalah." });
    } finally {
        console.log('Anime Terbaru request completed.');
    }
});

router.get('/anime/anichin-episode', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tolong tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/anime/anichin-episode?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Anichin Episode", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Anichin Episode bermasalah." });
    } finally {
        console.log('Anichin Episode request completed.');
    }
});

router.get('/d/mediafire', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "MediaFire Downloader", data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "MediaFire Downloader bermasalah." });
    } finally {
        console.log('MediaFire Downloader request completed.');
    }
});

router.get('/r/blue-archive', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get("https://api.siputzx.my.id/api/r/blue-archive");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Blue Archive Image", data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil gambar Blue Archive." });
    } finally {
        console.log('Random Blue Archive Image request completed.');
    }
});

router.get('/r/quotesanime', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get("https://api.siputzx.my.id/api/r/quotesanime");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Anime Quotes", data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil quote anime." });
    } finally {
        console.log('Random Anime Quotes request completed.');
    }
});

router.get('/d/tiktok', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tiktok?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "TikTok Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "TikTok Downloader bermasalah." });
    } finally {
        console.log('TikTok Downloader request completed.');
    }
});

router.get('/d/igdl', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Instagram Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Instagram Downloader bermasalah." });
    } finally {
        console.log('Instagram Downloader request completed.');
    }
});

router.get('/d/snackvideo', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/snackvideo?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "SnackVideo Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "SnackVideo Downloader bermasalah." });
    } finally {
        console.log('SnackVideo Downloader request completed.');
    }
});

router.get('/d/capcut', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/capcut?url=${encodeURIComponent(url)}`);
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
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/stalk/youtube?username=${encodeURIComponent(username)}`);
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
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/stalk/tiktok?username=${encodeURIComponent(username)}`);
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
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/stalk/github?user=${encodeURIComponent(user)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "GitHub Stalker", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "GitHub Stalker bermasalah." });
    } finally {
        console.log('GitHub Stalker request completed.');
    }
});

router.get('/s/tiktok', checkApiKey, cacheWithRedis, async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ result: false, message: "Tambahkan parameter 'query'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/tiktok?query=${encodeURIComponent(query)}`);
        res.locals.responseData = { creator: "WANZOFC TECH", result: true, message: "TikTok Search", data: data };
        await setCacheWithRedis(req, res, () => {
            res.json(res.locals.responseData);
        });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "TikTok Search bermasalah." });
    } finally {
        console.log('TikTok Search request completed.');
    }
});

router.get('/ai/uncovr', checkApiKey, cache('5 minutes'), async (req, res) => {
    const content = req.query.content;
    if (!content) return res.status(400).json({ result: false, message: "Tambahkan parameter 'content'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/uncovr?content=${encodeURIComponent(content)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "AI - Uncovr Chat", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "AI - Uncovr Chat bermasalah." });
    } finally {
        console.log('AI - Uncovr Chat request completed.');
    }
});

router.get('/ai/wanzofc', checkApiKey, cache('5 minutes'), async (req, res) => {
    const text = req.query.text;
    if (!text) return res.status(400).json({ result: false, message: "Tambahkan parameter 'text'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/yousearch?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "AI - wanzofc", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "AI - wanzofc bermasalah." });
    } finally {
        console.log('AI - wanzofc request completed.');
    }
});

router.get('/anime/otakudesu/search', checkApiKey, cache('1 hour'), async (req, res) => {
    const s = req.query.s;
    if (!s) return res.status(400).json({ result: false, message: "Tambahkan parameter 's'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/anime/otakudesu/search?s=${encodeURIComponent(s)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Anime - Otakudesu Search", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Anime - Otakudesu Search bermasalah." });
    } finally {
        console.log('Anime - Otakudesu Search request completed.');
    }
});

router.get('/d/savefrom', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Downloader - SaveFrom", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Downloader - SaveFrom bermasalah." });
    } finally {
        console.log('Downloader - SaveFrom request completed.');
    }
});

router.get('/d/github', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ result: false, message: "Tambahkan parameter 'url'." });
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/github?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Downloader - GitHub Repository", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Downloader - GitHub Repository bermasalah." });
    } finally {
        console.log('Downloader - GitHub Repository request completed.');
    }
});

router.get('/info/jadwaltv', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/info/jadwaltv`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - Jadwal TV", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - Jadwal TV bermasalah." });
    } finally {
        console.log('Informasi - Jadwal TV request completed.');
    }
});

router.get('/info/liburnasional', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/info/liburnasional`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - Hari Libur Nasional", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - Hari Libur Nasional bermasalah." });
    } finally {
        console.log('Informasi - Hari Libur Nasional request completed.');
    }
});

router.get('/info/bmkg', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/info/bmkg`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - BMKG", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - BMKG bermasalah." });
    } finally {
        console.log('Informasi - BMKG request completed.');
    }
});

router.get('/info/cuaca', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/info/cuaca`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi - Cuaca", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Informasi - Cuaca bermasalah." });
    } finally {
        console.log('Informasi - Cuaca request completed.');
    }
});

router.get('/s/gitagram', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/gitagram`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Gitagram", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Gitagram bermasalah." });
    } finally {
        console.log('Search - Gitagram request completed.');
    }
});

router.get('/s/duckduckgo', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/duckduckgo`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - DuckDuckGo", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - DuckDuckGo bermasalah." });
    } finally {
        console.log('Search - DuckDuckGo request completed.');
    }
});

router.get('/s/combot', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/combot`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Combot", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Combot bermasalah." });
    } finally {
        console.log('Search - Combot request completed.');
    }
});

router.get('/s/bukalapak', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/bukalapak`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Bukalapak", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Bukalapak bermasalah." });
    } finally {
        console.log('Search - Bukalapak request completed.');
    }
});

router.get('/s/brave', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/brave`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Search - Brave", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Search - Brave bermasalah." });
    } finally {
        console.log('Search - Brave request completed.');
    }
});

router.get('/berita/kompas', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/kompas`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Kompas", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Kompas bermasalah." });
    } finally {
        console.log('Berita - Kompas request completed.');
    }
});

router.get('/berita/jkt48', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/jkt48`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - JKT48", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - JKT48 bermasalah." });
    } finally {
        console.log('Berita - JKT48 request completed.');
    }
});

router.get('/berita/cnn', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/cnn`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - CNN", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - CNN bermasalah." });
    } finally {
        console.log('Berita - CNN request completed.');
    }
});

router.get('/berita/cnbcindonesia', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/cnbcindonesia`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - CNBC Indonesia", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - CNBC Indonesia bermasalah." });
    } finally {
        console.log('Berita - CNBC Indonesia request completed.');
    }
});

router.get('/berita/antara', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/antara`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Antara", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Antara bermasalah." });
    } finally {
        console.log('Berita - Antara request completed.');
    }
});

router.get('/berita/tribunnews', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/tribunnews`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Tribunnews", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Tribunnews bermasalah." });
    } finally {
        console.log('Berita - Tribunnews request completed.');
    }
});

router.get('/berita/suara', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/suara`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Suara", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Suara bermasalah." });
    } finally {
        console.log('Berita - Suara request completed.');
    }
});

router.get('/berita/merdeka', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/merdeka`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Merdeka", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Merdeka bermasalah." });
    } finally {
        console.log('Berita - Merdeka request completed.');
    }
});

router.get('/berita/sindonews', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/sindonews`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Sindonews", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Sindonews bermasalah." });
    } finally {
        console.log('Berita - Sindonews request completed.');
    }
});

router.get('/berita/liputan6', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/berita/liputan6`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Berita - Liputan6", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Berita - Liputan6 bermasalah." });
    } finally {
        console.log('Berita - Liputan6 request completed.');
    }
});

router.get('/apk/playstore', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/apk/playstore`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - Play Store", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari Play Store." });
    } finally {
        console.log('APK - Play Store request completed.');
    }
});

router.get('/apk/happymod', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/apk/happymod`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - HappyMod", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari HappyMod." });
    } finally {
        console.log('APK - HappyMod request completed.');
    }
});

router.get('/apk/appstore', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/apk/appstore`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - App Store", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari App Store." });
    } finally {
        console.log('APK - App Store request completed.');
    }
});

router.get('/apk/apkpure', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/apk/apkpure`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - APKPure", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari APKPure." });
    } finally {
        console.log('APK - APKPure request completed.');
    }
});

router.get('/apk/apkmody', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/apk/apkmody`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "APK - APKMody", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data dari APKMody." });
    } finally {
        console.log('APK - APKMody request completed.');
    }
});

router.get('/tools/subdomains', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const domain = req.query.domain;
        if (!domain) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter domain!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tools/subdomains?domain=${encodeURIComponent(domain)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: `Subdomain Scanner untuk ${domain}`, data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan data subdomain." });
    } finally {
        console.log('Subdomain Scanner request completed.');
    }
});

router.get('/tools/text2base64', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan teks untuk dikonversi!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tools/text2base64?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text to Base64", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengonversi teks ke Base64." });
    } finally {
        console.log('Text to Base64 request completed.');
    }
});

router.get('/tools/text2qr', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan teks untuk dikonversi!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tools/text2qr?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text to QR Code", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengonversi teks ke QR Code." });
    } finally {
        console.log('Text to QR Code request completed.');
    }
});

router.get('/tools/translate', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const text = req.query.text;
        const lang = req.query.lang || "en";
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan teks untuk diterjemahkan!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tools/translate?text=${encodeURIComponent(text)}&lang=${lang}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text Translation", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal menerjemahkan teks." });
    } finally {
        console.log('Text Translation request completed.');
    }
});

router.get('/ai/lepton', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter text!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/lepton?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Lepton AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari Lepton AI." });
    } finally {
        console.log('Lepton AI Response request completed.');
    }
});

router.get('/ai/gpt3', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const content = req.query.content;
        if (!prompt || !content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt dan content!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(prompt)}&content=${encodeURIComponent(content)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "GPT-3 AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari GPT-3 AI." });
    } finally {
        console.log('GPT-3 AI Response request completed.');
    }
});

router.get('/r/waifu', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get("https://api.siputzx.my.id/api/r/waifu");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Waifu Image", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan waifu random." });
    } finally {
        console.log('Random Waifu Image request completed.');
    }
});

router.get('/cf/sentiment', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter text!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/cf/sentiment?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Sentiment Analysis Result", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan hasil analisis sentimen." });
    } finally {
        console.log('Sentiment Analysis Result request completed.');
    }
});

router.get('/cf/image-classification', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const imageUrl = req.query.imageUrl;
        if (!imageUrl) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter imageUrl!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/cf/image-classification?imageUrl=${encodeURIComponent(imageUrl)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Image Classification Result", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengklasifikasikan gambar." });
    } finally {
        console.log('Image Classification Result request completed.');
    }
});

router.get('/cf/embedding', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter text!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/cf/embedding?text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Text Embedding Result", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan embedding teks." });
    } finally {
        console.log('Text Embedding Result request completed.');
    }
});

router.get('/cf/chat', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const system = req.query.system;
        if (!prompt || !system) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt dan system!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/cf/chat?prompt=${encodeURIComponent(prompt)}&system=${encodeURIComponent(system)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Cloudflare AI Chat Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari chatbot AI." });
    } finally {
        console.log('Cloudflare AI Chat Response request completed.');
    }
});

router.get('/ai/qwen257b', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const prompt = req.query.prompt;
        const text = req.query.text;
        if (!prompt || !text) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter prompt dan text!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/qwen257b?prompt=${encodeURIComponent(prompt)}&text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Qwen 257B AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari AI Qwen 257B." });
    } finally {
        console.log('Qwen 257B AI Response request completed.');
    }
});

router.get('/ai/qwq-32b-preview', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const content = req.query.content;
        if (!content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter content!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/qwq-32b-preview?content=${encodeURIComponent(content)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "QWQ 32B AI Response", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan respons dari AI QWQ 32B." });
    } finally {
        console.log('QWQ 32B AI Response request completed.');
    }
});

router.get('/s/pinterest', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Hasil pencarian Pinterest", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan hasil dari Pinterest." });
    } finally {
        console.log('Hasil pencarian Pinterest request completed.');
    }
});

router.get('/s/soundcloud', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/soundcloud?query=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Hasil pencarian SoundCloud", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan hasil dari SoundCloud." });
    } finally {
        console.log('Hasil pencarian SoundCloud request completed.');
    }
});

router.get('/stalk/npm', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const packageName = req.query.packageName;
        if (!packageName) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter packageName!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/stalk/npm?packageName=${encodeURIComponent(packageName)}`);
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

        const response = await axios.get(`https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer' // Penting: minta respons sebagai arraybuffer
        });

        const imageBuffer = Buffer.from(response.data, 'binary'); // Convert data to Buffer

        // Tetapkan Content-Type berdasarkan jenis gambar (sesuaikan jika perlu)
        res.setHeader('Content-Type', 'image/jpeg'); // Asumsi: gambar adalah JPEG
        // Opsi lain: 'image/png', 'image/gif', dll. Tergantung jenis gambar yang dikembalikan API.

        res.send(imageBuffer); // Kirim data gambar sebagai respons
    } catch (error) {
        console.error(error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendapatkan gambar dari Stability AI.", error: error.message });
    } finally {
        console.log('Gambar dari Stability AI request completed.');
    }
});

router.get('/s/wikipedia', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/wikipedia?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Wikipedia." });
    } finally {
        console.log('Wikipedia Search request completed.');
    }
});

router.get('/s/spotify', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Spotify." });
    } finally {
        console.log('Spotify Search request completed.');
    }
});

router.get('/tools/fake-data', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const type = req.query.type || "person";
        const count = req.query.count || 5;

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tools/fake-data?type=${type}&count=${count}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil fake data." });
    } finally {
        console.log('Fake Data request completed.');
    }
});

router.get('/primbon/cek_potensi_penyakit', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { tgl, bln, thn } = req.query;
        if (!tgl || !bln || !thn) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter tgl, bln, dan thn!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/cek_potensi_penyakit?tgl=${tgl}&bln=${bln}&thn=${thn}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Primbon Penyakit." });
    } finally {
        console.log('Primbon Penyakit request completed.');
    }
});

router.get('/primbon/ramalanjodoh', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { nama1, tgl1, bln1, thn1, nama2, tgl2, bln2, thn2 } = req.query;
        if (!nama1 || !tgl1 || !bln1 || !thn1 || !nama2 || !tgl2 || !bln2 || !thn2)
            return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan semua parameter yang diperlukan!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/ramalanjodoh?nama1=${encodeURIComponent(nama1)}&tgl1=${tgl1}&bln1=${bln1}&thn1=${thn1}&nama2=${encodeURIComponent(nama2)}&tgl2=${tgl2}&bln2=${bln2}&thn2=${thn2}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Ramalan Jodoh." });
    } finally {
        console.log('Ramalan Jodoh request completed.');
    }
});

router.get('/primbon/rejeki_hoki_weton', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { tgl, bln, thn } = req.query;
        if (!tgl || !bln || !thn) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter tgl, bln, dan thn!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/rejeki_hoki_weton?tgl=${tgl}&bln=${bln}&thn=${thn}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Rejeki Weton." });
    } finally {
        console.log('Rejeki Weton request completed.');
    }
});

router.get('/primbon/sifat_usaha_bisnis', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { tgl, bln, thn } = req.query;
        if (!tgl || !bln || !thn) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter tgl, bln, dan thn!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/sifat_usaha_bisnis?tgl=${tgl}&bln=${bln}&thn=${thn}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Sifat Usaha." });
    } finally {
        console.log('Sifat Usaha request completed.');
    }
});

router.get('/primbon/tafsirmimpi', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const mimpi = req.query.mimpi;
        if (!mimpi) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter mimpi!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/tafsirmimpi?mimpi=${encodeURIComponent(mimpi)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Tafsir Mimpi." });
    } finally {
        console.log('Tafsir Mimpi request completed.');
    }
});

router.get('/primbon/artinama', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const nama = req.query.nama;
        if (!nama) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter nama!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/artinama?nama=${encodeURIComponent(nama)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Arti Nama." });
    } finally {
        console.log('Arti Nama request completed.');
    }
});

router.get('/primbon/kecocokan_nama_pasangan', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { nama1, nama2 } = req.query;
        if (!nama1 || !nama2) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter nama1 dan nama2!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan?nama1=${encodeURIComponent(nama1)}&nama2=${encodeURIComponent(nama2)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Kecocokan Nama Pasangan." });
    } finally {
        console.log('Kecocokan Nama Pasangan request completed.');
    }
});

router.get('/primbon/nomorhoki', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const phoneNumber = req.query.phoneNumber;
        if (!phoneNumber) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter phoneNumber!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/nomorhoki?phoneNumber=${phoneNumber}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Nomor Hoki." });
    } finally {
        console.log('Nomor Hoki request completed.');
    }
});

router.get('/primbon/zodiak', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const zodiak = req.query.zodiak;
        if (!zodiak) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter zodiak!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/primbon/zodiak?zodiak=${encodeURIComponent(zodiak)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Zodiak." });
    } finally {
        console.log('Zodiak request completed.');
    }
});

router.get('/ai/metaai', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const { prompt, query } = req.query;

        if (!prompt || !query) {
            return res.status(400).json({
                creator: "WANZOFC TECH",
                result: false,
                message: "Harap masukkan parameter prompt dan query!"
            });
        }

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/metaai`, {
            params: {
                prompt: prompt,
                query: query
            }
        });

        res.json(data);
    } catch (error) {
        console.error('Error fetching Meta AI data:', error);
        res.status(500).json({
            creator: "WANZOFC TECH",
            result: false,
            message: "Gagal mengambil data Meta AI."
        });
    } finally {
        console.log('Meta AI request completed.');
    }
});

router.get('/ai/ustadz', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const query = req.query.query;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter query!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/muslimai?query=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data USTADZ AI." });
    } finally {
        console.log('USTADZ AI request completed.');
    }
});

router.get('/ai/khodam', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const content = req.query.content;
        if (!content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter content!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/dukun?content=${encodeURIComponent(content)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data Khodam AI." });
    } finally {
        console.log('Khodam AI request completed.');
    }
});

router.get('/ai/wanzofc-you', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });
        const { data } = await axiosInstance.get(`https://api.neoxr.eu/api/you?q=${encodeURIComponent(q)}&apikey=PJaLJu`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari wanzofc You." });
    } finally {
        console.log('wanzofc You request completed.');
    }
});

router.get('/ai/wanzofc-llama', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });
        const { data } = await axiosInstance.get(`https://api.neoxr.eu/api/llama?q=${encodeURIComponent(q)}&apikey=PJaLJu`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari wanzofc Llama." });
    } finally {
        console.log('wanzofc Llama request completed.');
    }
});

router.get('/ai/meta-llama', checkApiKey, cache('5 minutes'), async (req, res) => {
    try {
        const content = req.query.content;
        if (!content) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter content!" });

        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/ai/meta-llama-33-70B-instruct-turbo?content=${encodeURIComponent(content)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari Meta LLaMA." });
    } finally {
        console.log('Meta LLaMA request completed.');
    }
});

router.get('/search/xnxx', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });

        const { data } = await axiosInstance.get(`https://archive-ui.tanakadomp.biz.id/search/xnxx?q=${encodeURIComponent(query)}`);
        res.json(data);
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari XNXX." });
    } finally {
        console.log('XNXX Search request completed.');
    }
});
router.get('/r/cecan/china', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get("https://api.siputzx.my.id/api/r/cecan/china");
        res.json({ creator: "WANZOFC TECH", result: true, message: "Random Chinese Cecan Image", data: data });
    } catch (error) {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil gambar Cecan China." });
    } finally {
        console.log('Random Chinese Cecan Image request completed.');
    }
});

router.get('/d/spotify', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tambahkan parameter 'url'." });

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(url)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Spotify Downloader", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Spotify Downloader bermasalah." });
    } finally {
        console.log('Spotify Downloader request completed.');
    }
});

router.get('/tools/ngl', checkApiKey, cache('1 hour'), async (req, res) => {
    const link = req.query.link;
    const text = req.query.text;

    if (!link || !text) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Tambahkan parameter 'link' dan 'text'." });
    }

    try {
        const { data } = await axiosInstance.get(`https://api.siputzx.my.id/api/tools/ngl?link=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "NGL Tool", data: data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "NGL Tool bermasalah." });
    } finally {
        console.log('NGL Tool request completed.');
    }
});

router.get('/api/e/dana', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const response = await axiosInstance.get('https://apis.xyrezz.online-server.biz.id/api/okeconnect/dana');
        const data = response.data;
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

router.get('/s/reddit', checkApiKey, cache('1 hour'), async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter q!" });

    try {
        const { data } = await axiosInstance.get(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Hasil pencarian Reddit", data: data });
    } catch (error) {
        console.error("Reddit Search error:", error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari Reddit.", error: error.message });
    } finally {
        console.log('Reddit Search request completed.');
    }
});

router.get('/stalk/reddit', checkApiKey, cache('1 hour'), async (req, res) => {
    const username = req.query.username;
    if (!username) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter username!" });

    try {
        const { data } = await axiosInstance.get(`https://www.reddit.com/user/${encodeURIComponent(username)}/submitted.json`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Reddit User Stalk", data: data });
    } catch (error) {
        console.error("Reddit User Stalk error:", error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mengambil data dari Reddit User.", error: error.message });
    } finally {
        console.log('Reddit User Stalk request completed.');
    }
});

router.get('/d/reddit', checkApiKey, cache('1 hour'), async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Harap masukkan parameter url!" });

    try {
        const { data } = await axiosInstance.get(`${url}.json`);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Reddit Downloader", data: data });
    } catch (error) {
        console.error("Reddit Downloader error:", error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal mendownload data dari Reddit.", error: error.message });
    } finally {
        console.log('Reddit Downloader request completed.');
    }
});
router.get('/stalk/roblox', checkApiKey, async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "ID Pengguna Roblox diperlukan. Parameter 'userId' harus ditambahkan." });
    }

    try {
        const data = await robloxStalk(userId);
        res.json({ creator: "WANZOFC TECH", result: true, message: "Informasi Roblox Stalk", data: data });
    } catch (error) {
        console.error("Kesalahan saat melakukan Roblox Stalk:", error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: "Gagal melakukan Roblox Stalk. Coba lagi nanti." });
    } finally {
        console.log(`Roblox Stalk selesai untuk userId: ${userId}`);
    }
});

router.post('/deactivate-api', checkApiKey, async (req, res) => {
    const { apikey } = req.query;
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await deactivateKey(apikey);
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
    const { apikey } = req.query;
    if (!apikey) {
        return res.status(400).json({ creator: "WANZOFC TECH", result: false, message: "Parameter apikey diperlukan." });
    }

    try {
        const result = await reactivateKey(apikey);
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
router.get('/kuis/islami/random', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get('https://kuis-islami-api.vercel.app/api/random');
        res.json({ creator: "WANZOFC TECH", result: true, data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: 'API Error' });
    }
});

router.get('/kuis/islami', checkApiKey, cache('1 hour'), async (req, res) => {
    try {
        const { data } = await axiosInstance.get('https://kuis-islami-api.vercel.app/');
        res.json({ creator: "WANZOFC TECH", result: true, data });
    } catch {
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: 'API Error' });
    }
});


router.get('/ai/gpt4omini', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: 'Query parameter (q) is required' });

    try {
        const { data } = await axiosInstance.get(`https://vapis.my.id/api/gpt4omini?q=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: 'API Error' });
    }
});

router.get('/ai/gpt4o', checkApiKey, cache('5 minutes'), async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ message: 'Query parameter (q) is required' });

    try {
        const { data } = await axiosInstance.get(`https://vapis.my.id/api/gpt4o?q=${encodeURIComponent(query)}`);
        res.json({ creator: "WANZOFC TECH", result: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: 'API Error' });
    }
});
router.get('/ai/gpt4', checkApiKey, async (req, res) => {
    const ask = req.query.ask;
    if (!ask) return res.status(400).json({ message: 'Ask parameter is required' });

    try {
        const { data } = await axios.get(`https://fastrestapis.fasturl.cloud/aillm/gpt-4?ask=${encodeURIComponent(ask)}`);
        const now = new Date();
        res.json({ creator: "WANZOFC TECH", result: true, date: now, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ creator: "WANZOFC TECH", result: false, message: 'API Error' });
    }
});
module.exports = router;
