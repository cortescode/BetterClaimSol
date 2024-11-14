// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import createTables from './db/createTables.js';
import http from 'http';
import { affiliation_router } from './affiliation/affiliation.view.js';
import { claim_transactions_router } from './claimTransactions.js';
import { accounts_router } from './accounts/accounts.view.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from "http-proxy-middleware";
import bodyParser from 'body-parser';

dotenv.config();

// Your API key
const SOLANA_API_KEY = process.env.SOLANA_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
// app.use(express.json()); let the proxy middleware frozen when call
console.log('SOLANA_API_KEY:', SOLANA_API_KEY);

const solanaProxy = createProxyMiddleware({
    target: `https://solana-mainnet.api.syndica.io/`,
    changeOrigin: true,
    pathRewrite: {
        '^/api/solana-endpoint': `/api-key/${SOLANA_API_KEY}`,
    },
    secure: false,
    ws: true,
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        if (res.writeHead) {
            res.status(500).json({ error: 'Proxy error', details: err.message });
        }
    }
});


app.use(
    '/api/solana-endpoint',
    (req, res, next) => {
        // Set headers early
        req.headers['X-Syndica-Api-Key'] = SOLANA_API_KEY;
        next();
    }, 
    solanaProxy
);


const server = http.createServer(app);
// Handle WebSocket upgrade
server.on('upgrade', function (req, socket, head) {
    if (req.url.startsWith('/api/solana-endpoint')) {
        solanaProxy.upgrade(req, socket, head);
    }
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'public')));


// Importing routers
app.use("/api/affiliation", affiliation_router);
app.use("/api/claim-transactions", claim_transactions_router);
app.use("/api/accounts", accounts_router);



// Handle React routing, return all requests to React app except for images and privacy-policy
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

app.get('*', (req, res, next) => {
    if (req.path.startsWith('/images/')) {
        res.sendFile(path.join(__dirname, 'public', req.path));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start the server
server.listen(port, async () => {
    await createTables();
    console.log(`Server running on port ${port}`);
});