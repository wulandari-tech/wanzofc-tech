const express = require('express');
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

module.exports = router;
