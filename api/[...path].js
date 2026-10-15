// Vercel serverless function: proxies /api/* to the HouseCall Pro API.
// The API key comes from the HCP_API_KEY environment variable (set in the
// Vercel dashboard under Project Settings -> Environment Variables).
const https = require('https');

const HCP_BASE = 'api.housecallpro.com';

module.exports = function handler(req, res) {
  const key = process.env.HCP_API_KEY || '';
  const hcpPath = (req.url || '/').replace(/^\/api/, '') || '/';

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const proxyReq = https.request(
    {
      hostname: HCP_BASE,
      port: 443,
      path: hcpPath,
      method: req.method,
      headers: {
        Authorization: `Token ${key}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 502);
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: 'Proxy error', detail: err.message });
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Vercel parses JSON request bodies automatically into req.body.
    proxyReq.write(JSON.stringify(req.body ?? {}));
  }
  proxyReq.end();
};
