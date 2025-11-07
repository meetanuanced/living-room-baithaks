// ========================================
// LOCAL CORS PROXY SERVER
// ========================================
//
// This simple proxy server fixes CORS issues when testing locally.
// It runs on port 3001 and forwards requests to your Google Apps Script API.
//
// Usage:
//   node cors-proxy.js
//

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

// Your Google Apps Script URL
const TARGET_API = 'https://script.google.com/macros/s/AKfycbx9kZ5u4wrRng9V_l2sUsc8CnnpW-sLKfZ_etnDUCJShmtY4tL-bEOa8OQj-zBbfuHo/exec';

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`📨 ${req.method} ${req.url}`);

    // Parse the request URL to get query parameters
    const parsedUrl = url.parse(req.url, true);
    const queryString = parsedUrl.search || '';

    // Construct the target URL
    const targetUrl = TARGET_API + queryString;

    console.log(`🔄 Proxying to: ${targetUrl}`);

    // Proxy the request
    const options = {
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        // Forward status code
        res.writeHead(proxyRes.statusCode, proxyRes.headers);

        // Forward response data
        proxyRes.on('data', (chunk) => {
            res.write(chunk);
        });

        proxyRes.on('end', () => {
            res.end();
            console.log(`✅ Response sent (${proxyRes.statusCode})`);
        });
    });

    // Handle errors
    proxyReq.on('error', (error) => {
        console.error('❌ Proxy error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error: ' + error.message }));
    });

    // Forward request body for POST requests
    if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            proxyReq.write(body);
            proxyReq.end();
        });
    } else {
        proxyReq.end();
    }
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚀 CORS Proxy Server Running!');
    console.log('================================');
    console.log(`📍 Local:     http://localhost:${PORT}`);
    console.log(`🎯 Proxying:  ${TARGET_API}`);
    console.log('');
    console.log('💡 Usage in config.js:');
    console.log(`   const API_URL = 'http://localhost:${PORT}';`);
    console.log('   const USE_LOCAL_DATA = false;');
    console.log('   const USE_CORS_PROXY = false;');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('================================');
    console.log('');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down proxy server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
