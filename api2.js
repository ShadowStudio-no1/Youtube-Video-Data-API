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
        // Add a custom User-Agent header to bypass bot detection
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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

        // Build response
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
        // 🔴 Remove unknown types
        .filter(format => format.type !== "unknown")
        // 🔽 Sort by quality (lowest to highest)
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
