const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

app.get('/video-details', async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const cookieHeader = `LOGIN_INFO=AFmmF2swRQIgRXdoYZ-kZL_UBHkmskE3ThCgxoJD5VQhFbdb7gQxJOgCIQDlJlR8ZpWLZCW6AuEpf4TBHT8lkaceS347NB77zvYjvw:QUQ3MjNmemJLUVlnSGtuMXNKeWZWN0ZFcy1OX1dHUEVlaU8zX2EzcXI2TW9kYnhiMWJlMlg5dzNGUTBtQ19kU1JtdFlaSks1M1hIUXl0c08yMlJNSEJndFU1bEpDLUhKTnFmZUhPbVd6UzY5eFRTd1lzYjJSX3laNk5zb1NJbk42bkZkaVVFSXhjcUxKSzhTcDRXRm1FbzZwRVg3QXJSU3pB;HSID=AtkmumMvMBlTlJbdy;SSID=AZe4c-cDKFFvyrcYV;APISID=2_5RBzzKXVc_RHrd/AGn5LNniSS_DEwibI;SAPISID=0h71FHqTxgQkM6Xe/AxGtXQNXRTA3X-sze;__Secure-1PAPISID=0h71FHqTxgQkM6Xe/AxGtXQNXRTA3X-sze;__Secure-3PAPISID=0h71FHqTxgQkM6Xe/AxGtXQNXRTA3X-sze;SID=g.a000vwi9zncV5tAtbIIG1lFKdUpmLiCKisf4v_3idPR3KdMJ06xsniyAee_48w66djC0CfuFOgACgYKAb0SARcSFQHGX2MiJytjW9JvOwRapFUX-ZvcqxoVAUF8yKq4CLAhjOva85OwmeAT0XdX0076;__Secure-1PSID=g.a000vwi9zncV5tAtbIIG1lFKdUpmLiCKisf4v_3idPR3KdMJ06xsjENRcBj6Q1BioZFuY7ajkAACgYKAdASARcSFQHGX2MiLgFXcBU66zMtJDJ7GxVzURoVAUF8yKoI7lGipmMo8I9seSFQvyB90076;__Secure-3PSID=g.a000vwi9zncV5tAtbIIG1lFKdUpmLiCKisf4v_3idPR3KdMJ06xsqArEgSumLVnx-Fq3GOJqtQACgYKAfgSARcSFQHGX2MiZTqm1kTJfGE8-A7M7HlWPRoVAUF8yKquOA_J3e33I6FyZbvu5bp50076;__Secure-1PSIDTS=sidts-CjIB7pHptQT79Y5lScZMwuJpmeQBvNK3FeQoiaaP5RFER8YGakeL4-Xndn4a5IBm7bgO7xAA;__Secure-3PSIDTS=sidts-CjIB7pHptQT79Y5lScZMwuJpmeQBvNK3FeQoiaaP5RFER8YGakeL4-Xndn4a5IBm7bgO7xAA;PREF=f6=40000000&tz=Asia.Calcutta&f7=100;SIDCC=AKEyXzWpAtOuuZJbCJG0SJ2FLrrxZnEb9irFv6BREuU-X4QMCr_FIUn8oHQq1LhJosAeOuFz;__Secure-1PSIDCC=AKEyXzUmNY4OTvLzXY2mXWSk_0g8PsXARK1kmT0tgiePmrwTsH1VOK4eOBORaYhxPCfF7pm_;__Secure-3PSIDCC=AKEyXzUI5m60crHu965Mxf3JknTWnwReztIHuKUj1k7aHkd0tWZdCHFOq3QijMgSzrwy5Qnl4w;CONSISTENCY=AKreu9stzXtZd7CuHv4yVUmfStZCEzjlvvuoS8u1aya0BOKPIFXlX0Ke37FVoZa1mRieOlp10NJ4PkKtG4lKq-r9zKKLDPDZ_sUBaqUq_uzexxstf6niaANSJQKNs3cXu7ne7Kl9lq-AcT5IFeOMJzp6`; // Replace this with your full cookie string

        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Cookie': cookieHeader
                }
            }
        });

        const videoDetails = info.videoDetails;
        const formats = info.formats;

        if (!formats || formats.length === 0) {
            return res.status(500).json({
                error: 'No video formats found',
                details: 'Could not extract video formats'
            });
        }

        const response = {
            success: true,
            url: videoUrl,
            source: "youtube",
            title: videoDetails.title,
            author: videoDetails.author.name,
            thumbnail: getBestThumbnail(videoDetails.thumbnails),
            duration: parseInt(videoDetails.lengthSeconds),
            medias: processFormats(formats),
            error: false
        };

        res.json(response);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to fetch video details',
            details: error.message
        });
    }
});

// Helper functions
function getBestThumbnail(thumbnails) {
    return thumbnails?.[thumbnails.length - 1]?.url || "";
}

function processFormats(formats) {
    const seenItags = new Set();

    const uniqueFormats = formats
        .filter(format => {
            if (seenItags.has(format.itag)) return false;
            seenItags.add(format.itag);
            return true;
        })
        .map(format => {
            const hasVideo = format.hasVideo;
            const hasAudio = format.hasAudio;

            let type = "unknown";
            if (hasVideo && hasAudio) type = "video+audio";
            else if (hasVideo && !hasAudio) type = "video";
            else if (!hasVideo && hasAudio) type = "audio";

            let label = '';
            if (type.includes('video') && format.qualityLabel) {
                label = `${format.container || getExtFromMimeType(format.mimeType)} (${format.qualityLabel})`;
            } else if (type === 'audio') {
                label = `${format.container || getExtFromMimeType(format.mimeType)} (${format.audioBitrate || 0}kbps)`;
            }

            return {
                formatId: format.itag,
                label: label,
                type: type,
                ext: format.container || getExtFromMimeType(format.mimeType),
                quality: format.qualityLabel || format.quality || '',
                bitrate: format.bitrate || (format.audioBitrate ? format.audioBitrate * 1000 : null),
                fps: format.fps || null,
                width: format.width || null,
                height: format.height || null,
                url: format.url,
                mimeType: format.mimeType || '',
                audioQuality: format.audioQuality || 'unknown',
                audioSampleRate: format.audioSampleRate || null
            };
        })
        .filter(format => format.type !== "unknown")
        .sort((a, b) => {
            const aScore = a.height || a.bitrate || 0;
            const bScore = b.height || b.bitrate || 0;
            return aScore - bScore;
        });

    return uniqueFormats;
}

function getExtFromMimeType(mimeType) {
    if (!mimeType) return 'mp4';
    if (mimeType.includes('audio/mp4')) return 'm4a';
    if (mimeType.includes('audio/webm')) return 'webm';
    if (mimeType.includes('video/mp4')) return 'mp4';
    if (mimeType.includes('video/webm')) return 'webm';
    return 'mp4';
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
