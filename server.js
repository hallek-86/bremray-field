const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const HCP_API_KEY = process.env.HCP_API_KEY || '0590149299a44bf6b0eaceb43acdea48';
const HCP_BASE = 'api.housecallpro.com';
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function serveStatic(req, res) {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

function proxyToHCP(req, res) {
  const hcpPath = req.url.replace(/^\/api/, '') || '/';
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }
  const options = {
    hostname: HCP_BASE, port: 443,
    path: hcpPath, method: req.method,
    headers: {
      'Authorization': `Token ${HCP_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...CORS,
      'Content-Type': proxyRes.headers['content-type'] || 'application/json',
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (err) => {
    res.writeHead(502, CORS);
    res.end(JSON.stringify({ error: 'Proxy error', detail: err.message }));
  });
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    proxyToHCP(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bremray Field server running on port ${PORT}`);
});
