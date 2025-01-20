const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // Untuk encrypt dan decrypt
const router = express.Router();
const { cekKey, updateKeyExpiry, deactivateKey, reactivateKey } = require('../database/db'); 
const { youtubePlay, youtubeMp4, youtubeMp3 } = require('../controllers/yt');
const { cakLontong, bijak, quotes, fakta, ptl, motivasi } = require('../controllers/randomtext');
const { geminiAi } = require('../ai');

// Cek API Key
router.get('/checkkey', async (req, res) => {
    const apikey = req.query.apikey;
    if (apikey === undefined) return res.status(404).send({
        status: 404,
        message: `Input Parameter apikey`
    });
    const check = await cekKey(apikey);
    if (!check) return res.status(403).send({
        status: 403,
        message: `apikey ${apikey} not found, please register first!`
    });
    res.send({ status: 200, apikey: apikey, response: 'Active' });
});

// Tambahkan fitur premium

// Endpoint untuk mengupdate tanggal kadaluarsa API Key
router.post('/update-expiry', async (req, res) => {
    const { apikey, expiry_date } = req.body;
    if (!apikey || !expiry_date) {
        return res.status(400).send({ status: 400, message: 'apikey and expiry_date are required!' });
    }
    const result = await updateKeyExpiry(apikey, expiry_date);
    if (result) {
        res.send({ status: 200, message: 'Expiry date updated successfully!' });
    } else {
        res.status(404).send({ status: 404, message: 'API key not found!' });
    }
});

// Endpoint untuk menonaktifkan API Key
router.post('/deactivate-api', async (req, res) => {
    const { apikey } = req.body;
    if (!apikey) {
        return res.status(400).send({ status: 400, message: 'apikey is required!' });
    }
    const result = await deactivateKey(apikey);
    if (result) {
        res.send({ status: 200, message: 'API key deactivated successfully!' });
    } else {
        res.status(404).send({ status: 404, message: 'API key not found!' });
    }
});

// Endpoint untuk mengaktifkan kembali API Key
router.post('/reactivate-api', async (req, res) => {
    const { apikey } = req.body;
    if (!apikey) {
        return res.status(400).send({ status: 400, message: 'apikey is required!' });
    }
    const result = await reactivateKey(apikey);
    if (result) {
        res.send({ status: 200, message: 'API key reactivated successfully!' });
    } else {
        res.status(404).send({ status: 404, message: 'API key not found!' });
    }
});

// Endpoint lainnya tetap
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
        telegram: '@wanzofc'
    });
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
        const apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Ganti dengan API Key OpenWeather
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
                q: kota,
                units: 'metric',
                appid: apiKey
            }
        });

        const data = response.data;
        res.status(200).json({
            status: 200,
            kota: data.name,
            suhu: `${data.main.temp}°C`,
            cuaca: data.weather[0].description,
            angin: `${data.wind.speed} m/s`
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: 'Gagal mendapatkan data cuaca!',
            error: error.message
        });
    }
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

// Export router
module.exports = router;
