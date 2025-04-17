const express = require('express');
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Helper function to get video info
async function getVideoData(url) {
  try {
    const startTime = Date.now();
    const info = await ytdl.getInfo(url);
    
    // Extract the formats we want to return
    const formats = info.formats.map(format => {
      const isVideo = format.hasVideo && format.hasAudio;
      const isAudio = !format.hasVideo && format.hasAudio;
      
      let type = "unknown";
      if (isVideo) type = "video";
      if (isAudio) type = "audio";
      
      let label = "";
      if (isVideo && format.qualityLabel) {
        label = `${format.container} (${format.qualityLabel})`;
      } else if (isAudio) {
        const audioBitrate = format.audioBitrate || 0;
        label = `${format.container || 'opus'} (${audioBitrate}kb/s)`;
      }
      
      // For compatibility with the example format
      return {
        formatId: parseInt(format.itag),
        label: label,
        type: type,
        ext: format.container || format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4',
        quality: label,
        width: format.width || null,
        height: format.height || null,
        url: format.url,
        bitrate: format.bitrate || format.audioBitrate * 1000 || 0,
        fps: format.fps || null,
        audioQuality: format.audioQuality || null,
        audioSampleRate: format.audioSampleRate || null,
        mimeType: format.mimeType || "",
        duration: 12, // Placeholder, real duration is in videoDetails
        is_audio: isAudio,
        extension: format.container || format.mimeType?.split('/')[1]?.split(';')[0] || 'mp4'
      };
    });
    
    // Filter to just keep a few formats for simplicity (one video, one audio)
    const videoFormat = formats.find(f => f.type === "video" && f.height <= 360);
    const audioFormat = formats.find(f => f.type === "audio");
    
    const selectedFormats = [];
    if (videoFormat) selectedFormats.push(videoFormat);
    if (audioFormat) selectedFormats.push(audioFormat);
    
    // Construct the response object
    const response = {
      success: true,
      url: url,
      source: "youtube",
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url || "",
      duration: parseInt(info.videoDetails.lengthSeconds),
      medias: selectedFormats,
      type: "multiple",
      error: false,
      time_end: Date.now() - startTime
    };
    
    return response;
  } catch (error) {
    return {
      success: false,
      url: url,
      error: true,
      message: error.message
    };
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('YouTube Data API is running. Use /api/video?url=YOUR_YOUTUBE_URL to get video data.');
});

// Get video info endpoint
app.get('/api/video', async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'URL parameter is required'
    });
  }
  
  if (!ytdl.validateURL(url)) {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'Invalid YouTube URL'
    });
  }
  
  try {
    const data = await getVideoData(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: true,
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}/api/video?url=YOUR_YOUTUBE_URL`);
}); 