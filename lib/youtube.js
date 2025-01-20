const ytdl = require('ytdl-core');
const yts = require('yt-search');
const axios = require('axios');

// Konversi byte ke ukuran yang lebih mudah dibaca
function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return 'n/a';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`;
}

// Download video YouTube dalam format MP4
async function ytMp4(url) {
    try {
        const getUrl = await ytdl.getInfo(url);
        const result = [];

        for (const item of getUrl.formats) {
            if (item.container === 'mp4' && item.hasVideo && item.hasAudio) {
                const bytes = bytesToSize(item.contentLength || 0);
                result.push({
                    video: item.url,
                    quality: item.qualityLabel,
                    size: bytes,
                });
            }
        }

        const resultFix = result.filter(x => x.video && x.size && x.quality);
        if (!resultFix.length) throw new Error("No MP4 formats available");

        const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${resultFix[0].video}`);
        const tinyUrl = tiny.data;

        const { title, description, viewCount, ownerChannelName, uploadDate } = getUrl.videoDetails;
        const thumb = getUrl.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url;

        return {
            title,
            result: tinyUrl,
            quality: resultFix[0].quality,
            size: resultFix[0].size,
            thumb,
            views: viewCount,
            channel: ownerChannelName,
            uploadDate,
            desc: description,
        };
    } catch (error) {
        throw new Error(`Error fetching MP4: ${error.message}`);
    }
}

// Download audio YouTube dalam format MP3
async function ytMp3(url) {
    try {
        const getUrl = await ytdl.getInfo(url);
        const result = [];

        for (const item of getUrl.formats) {
            if (item.mimeType && item.mimeType.includes('audio/webm')) {
                const bytes = bytesToSize(item.contentLength || 0);
                result.push({
                    audio: item.url,
                    size: bytes,
                });
            }
        }

        const resultFix = result.filter(x => x.audio && x.size);
        if (!resultFix.length) throw new Error("No MP3 formats available");

        const tiny = await axios.get(`https://tinyurl.com/api-create.php?url=${resultFix[0].audio}`);
        const tinyUrl = tiny.data;

        const { title, description, viewCount, ownerChannelName, uploadDate } = getUrl.videoDetails;
        const thumb = getUrl.player_response.microformat.playerMicroformatRenderer.thumbnail.thumbnails[0].url;

        return {
            title,
            result: tinyUrl,
            size: resultFix[0].size,
            thumb,
            views: viewCount,
            channel: ownerChannelName,
            uploadDate,
            desc: description,
        };
    } catch (error) {
        throw new Error(`Error fetching MP3: ${error.message}`);
    }
}

// Pencarian dan pemutaran audio YouTube
async function ytPlay(query) {
    try {
        const getData = await yts(query);
        const result = getData.videos.slice(0, 5);
        if (!result.length) throw new Error("No videos found");

        const random = result[Math.floor(Math.random() * result.length)].url;
        const getAudio = await ytMp3(random);
        return getAudio;
    } catch (error) {
        throw new Error(`Error fetching YouTube Play: ${error.message}`);
    }
}
module.exports = { ytMp4, ytMp3, ytPlay };
