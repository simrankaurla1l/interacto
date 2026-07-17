import express from 'express';

const router = express.Router();
const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  console.warn('Missing PEXELS_API_KEY environment variable. Image search requests will fail until this is set.');
}

router.get('/search', async (req, res) => {
  const query = String(req.query.query || '').trim();
  if (!query) {
    return res.status(400).send({ error: 'A search query is required' });
  }

  if (!apiKey) {
    return res.status(500).send({
      error: 'Missing PEXELS_API_KEY. Get a free key at pexels.com/api and set it in the backend .env file.'
    });
  }

  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`, {
      headers: { Authorization: apiKey }
    });
    const json = await response.json();

    if (!response.ok) {
      return res.status(response.status).send({ error: json?.error || 'Image search failed' });
    }

    const results = (json.photos || []).map((photo) => ({
      id: photo.id,
      thumbnailUrl: photo.src?.medium,
      fullUrl: photo.src?.large2x || photo.src?.large || photo.src?.original,
      photographer: photo.photographer,
      pageUrl: photo.url
    }));

    res.send({ results });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).send({ error: 'Image search failed' });
  }
});

export default router;
