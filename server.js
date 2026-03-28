import express from 'express';
import cors from 'cors';
import yts from 'yt-search';
import { youtubeDl } from './downloader.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ success: false, message: "Query kosong" });
        const r = await yts(query);
        const videos = r.videos.slice(0, 10);
        res.json({ success: true, data: videos });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/play', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ success: false, message: "URL kosong" });
        const data = await youtubeDl(url);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
