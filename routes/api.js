const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Untuk encrypt dan decrypt
const path = require('path'); // Untuk menangani path
const router = express.Router();
const { cekKey, updateKeyExpiry, deactivateKey, reactivateKey } = require('../database/db');
const { youtubePlay, youtubeMp4, youtubeMp3 } = require('../controllers/yt');
const { cakLontong, bijak, quotes, fakta, ptl, motivasi } = require('../controllers/randomtext');
const { geminiAi } = require('../ai');

// Set view engine ke EJS
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views')); // Pastikan path views benar

// Middleware JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint cek API Key
router.get('/checkkey', async (req, res) => {
    const apikey = req.query.apikey;
    if (!apikey) return res.status(404).json({
        status: 404,
        message: 'Parameter apikey is required!'
    });

    const check = await cekKey(apikey);
    if (!check) return res.status(403).json({
        status: 403,
        message: `API Key ${apikey} not found, please register first!`
    });

    res.status(200).json({ status: 200, apikey, response: 'Active' });
});

// Endpoint untuk membaca file buyFull.ejs
router.get('/buyfull', (req, res) => {
    const data = {
        title: 'Buy Full Access',
        description: 'Upgrade to premium and unlock all features!',
        author: 'Awanberlian',
    };

    res.render('buyFull', data); // Menggunakan file buyFull.ejs di folder views
});

// Endpoint lainnya
router.get('/ytplay', youtubePlay);
router.get('/ytmp4', youtubeMp4);
router.get('/ytmp3', youtubeMp3);
router.get('/caklontong', cakLontong);
router.get('/quotes', quotes);
router.get('/fakta', fakta);
router.get('/bijak', bijak);
router.get('/ptl', ptl);
router.get('/motivasi', motivasi);

// Tambahkan endpoint untuk Gemini AI
router.get('/google-gemini', geminiAi);

// Endpoint whoami
router.get('/whoami', (req, res) => {
    res.status(200).json({
        status: 200,
        message: 'Welcome to the API!',
        author: 'Awanberlian',
        github: 'https://github.com/awanbrayy',
        telegram: '@wanzofc',
    });
});

// Fungsi encrypt dan decrypt
const ENCRYPTION_KEY = 'abcdefghijklmnop'.repeat(2); // Kunci 32 karakter
const IV_LENGTH = 16; // Panjang IV

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
    const [iv, encryptedText] = text.split(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Endpoint encrypt
router.get('/encrypt', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ status: 400, message: 'Parameter text is required!' });
    }
    const encrypted = encrypt(text);
    res.status(200).json({ status: 200, encrypted });
});

// Endpoint decrypt
router.get('/decrypt', (req, res) => {
    const { text } = req.query;
    if (!text) {
        return res.status(400).json({ status: 400, message: 'Parameter text is required!' });
    }
    try {
        const decrypted = decrypt(text);
        res.status(200).json({ status: 200, decrypted });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Invalid encrypted text!' });
    }
});

// Endpoint cuaca
router.get('/cuaca', async (req, res) => {
    const { kota } = req.query;
    if (!kota) {
        return res.status(400).json({
            status: 400,
            message: 'Parameter kota is required!'
        });
    }

    try {
        const apiKey = 'e4517bde90e743f0b99112303252001'; // API Key dari WeatherAPI
        const response = await axios.get(`https://api.weatherapi.com/v1/current.json`, {
            params: {
                key: apiKey,
                q: kota
            }
        });

        const data = response.data;
        res.status(200).json({
            status: 200,
            kota: data.location.name,
            negara: data.location.country,
            suhu: `${data.current.temp_c}°C`,
            cuaca: data.current.condition.text,
            angin: `${data.current.wind_kph} km/h`
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Gagal mendapatkan data cuaca!',
            error: error.message
        });
    }
});

// Export router
module.exports = router;
