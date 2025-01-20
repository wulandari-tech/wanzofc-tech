const { ytPlay, ytMp3, ytMp4 } = require("../lib/youtube");
const { cekKey } = require('../database/db');

// Fungsi untuk respons standar
const response = (status, message, result = null) => ({
    status: status,
    message: message,
    ...(result && { result })
});

// Validasi URL
const isValidUrl = (url) => {
    const urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return urlRegex.test(url);
};

// Fungsi YouTube Play
async function youtubePlay(req, res) {
    try {
        const query = req.query.query;
        const apikey = req.query.apikey;

        if (!query || !apikey) {
            return res.status(400).send(response(400, "Parameter 'query' dan 'apikey' harus diisi!"));
        }

        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).send(response(403, `API key '${apikey}' tidak ditemukan, silakan daftar terlebih dahulu!`));
        }

        const result = await ytPlay(query);
        return res.status(200).send(response(200, "Berhasil memproses YouTube Play", result));
    } catch (error) {
        console.error(`[youtubePlay] Error:`, error.message, error.stack);
        return res.status(500).send(response(500, "Terjadi kesalahan server. Silakan coba lagi nanti."));
    }
}

// Fungsi YouTube MP3
async function youtubeMp3(req, res) {
    try {
        const url = req.query.url;
        const apikey = req.query.apikey;

        if (!url || !apikey) {
            return res.status(400).send(response(400, "Parameter 'url' dan 'apikey' harus diisi!"));
        }

        if (!isValidUrl(url)) {
            return res.status(400).send(response(400, "URL tidak valid. Harus berupa URL YouTube yang valid!"));
        }

        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).send(response(403, `API key '${apikey}' tidak ditemukan, silakan daftar terlebih dahulu!`));
        }

        const result = await ytMp3(url);
        return res.status(200).send(response(200, "Berhasil memproses YouTube MP3", result));
    } catch (error) {
        console.error(`[youtubeMp3] Error:`, error.message, error.stack);
        return res.status(500).send(response(500, "Terjadi kesalahan server. Silakan coba lagi nanti."));
    }
}

// Fungsi YouTube MP4
async function youtubeMp4(req, res) {
    try {
        const url = req.query.url;
        const apikey = req.query.apikey;

        if (!url || !apikey) {
            return res.status(400).send(response(400, "Parameter 'url' dan 'apikey' harus diisi!"));
        }

        if (!isValidUrl(url)) {
            return res.status(400).send(response(400, "URL tidak valid. Harus berupa URL YouTube yang valid!"));
        }

        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).send(response(403, `API key '${apikey}' tidak ditemukan, silakan daftar terlebih dahulu!`));
        }

        const result = await ytMp4(url);
        return res.status(200).send(response(200, "Berhasil memproses YouTube MP4", result));
    } catch (error) {
        console.error(`[youtubeMp4] Error:`, error.message, error.stack);
        return res.status(500).send(response(500, "Terjadi kesalahan server. Silakan coba lagi nanti."));
    }
}

module.exports = { youtubePlay, youtubeMp3, youtubeMp4 };
