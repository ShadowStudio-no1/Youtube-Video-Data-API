# Video Downloader API

A simple API to fetch video details and download links from YouTube videos.

## Features

- Get video details including title, author, and thumbnail
- Get available download formats (video+audio, video-only, audio-only)
- Sorted by quality

## API Endpoints

### GET /video-details

Fetches information about a YouTube video.

**Parameters:**
- `url` (required): The YouTube video URL

**Example:**
```
/video-details?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## Deployment to Vercel

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy:
   ```
   vercel
   ```

### Option 2: Deploy with GitHub

1. Push your project to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Create a new project
4. Import your GitHub repository
5. Deploy

## Development

1. Install dependencies:
   ```
   npm install
   ```

2. Run development server:
   ```
   npm run dev
   ```

3. Production start:
   ```
   npm start
   ``` 