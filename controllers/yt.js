const { ytPlay, ytMp3, ytMp4 } = require("../lib/youtube");
const { cekKey } = require('../database/db');
async function youtubePlay(req, res) {
    try {
        const query = req.query.query;
        const apikey = req.query.apikey;
        if (!query || !apikey) {
            return res.status(400).send({
                status: 400,
                message: "Parameter 'query' dan 'apikey' harus diisi!"
            });
        }
        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).send({
                status: 403,
                message: `API key '${apikey}' tidak ditemukan, silakan daftar terlebih dahulu!`
            });
        }
        const result = await ytPlay(query);
        return res.status(200).send({
            status: 200,
            result: result
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            message: "Terjadi kesalahan server. Silakan coba lagi nanti."
        });
    }
}
async function youtubeMp3(req, res) {
    try {
        const url = req.query.url;
        const apikey = req.query.apikey;
        if (!url || !apikey) {
            return res.status(400).send({
                status: 400,
                message: "Parameter 'url' dan 'apikey' harus diisi!"
            });
        }
        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).send({
                status: 403,
                message: `API key '${apikey}' tidak ditemukan, silakan daftar terlebih dahulu!`
            });
        }
        const result = await ytMp3(url);
        return res.status(200).send({
            status: 200,
            result: result
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            message: "Terjadi kesalahan server. Silakan coba lagi nanti."
        });
    }
}
async function youtubeMp4(req, res) {
    try {
        const url = req.query.url;
        const apikey = req.query.apikey;
        if (!url || !apikey) {
            return res.status(400).send({
                status: 400,
                message: "Parameter 'url' dan 'apikey' harus diisi!"
            });
        }
        const check = await cekKey(apikey);
        if (!check) {
            return res.status(403).send({
                status: 403,
                message: `API key '${apikey}' tidak ditemukan, silakan daftar terlebih dahulu!`
            });
        }
        const result = await ytMp4(url);
        return res.status(200).send({
            status: 200,
            result: result
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            status: 500,
            message: "Terjadi kesalahan server. Silakan coba lagi nanti."
        });
    }
}
module.exports = { youtubePlay, youtubeMp3, youtubeMp4 };
