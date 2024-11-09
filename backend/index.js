// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import createTables from './db/createTables.js';
import { affiliation_router } from './affiliation/affiliation.view.js';
import { claim_transactions_router } from './claimTransactions.js';
import { accounts_router } from './accounts/accounts.view.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from "http-proxy-middleware";


dotenv.config();

// Your API key
const SOLANA_API_KEY = process.env.SOLANA_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


/* app.use('/api/solana-endpoint', (req, res, next) => {
    console.log('Solana endpoint API called');
    next();
}, createProxyMiddleware({
    target: 'https://solana-mainnet.api.syndica.io',
    changeOrigin: true,
    pathRewrite: {
        '^/api/solana-endpoint': '', // remove base path
    },
    onProxyReq: (proxyReq) => {
        console.log('Proxy request:', proxyReq.method, proxyReq.path);
        console.log('Proxy request headers:', proxyReq.getHeaders());
        // Add API key to the request headers
        proxyReq.setHeader('X-Syndica-Api-Key', SOLANA_API_KEY);
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`Proxy response status: ${proxyRes.statusCode}`);
    }
})); */


// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'public')));


// Importing routers
app.use("/api/affiliation", affiliation_router);
app.use("/api/claim-transactions", claim_transactions_router);
app.use("/api/accounts", accounts_router);





// Redirect all requests to the Solana endpoint
/* app.use('/api/solana-endpoint', (req, res) => {
    // https://solana-mainnet.api.syndica.io/api-key/4eW91Uf1tytzBvzvPuR9jWG3Tpy6AdA2bADJS6vrB4W8EN2y8Ch6k6JiQKgoArNX8zrz7HFeJmGrfHFRzhVZk8Dd41fEJFcPgid
    // const solanaUrl = `https://solana-mainnet.g.alchemy.com/v2/WaqVWK-Tn7Jcx6MQu3a4viaE8EyVl2cq`;
    const solanaUrl= 'https://solana-mainnet.api.syndica.io/api-key/4eW91Uf1tytzBvzvPuR9jWG3Tpy6AdA2bADJS6vrB4W8EN2y8Ch6k6JiQKgoArNX8zrz7HFeJmGrfHFRzhVZk8Dd41fEJFcPgid';
    res.redirect(solanaUrl);
});  */




// Handle React routing, return all requests to React app except for images
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/images/')) {
        res.sendFile(path.join(__dirname, 'public', req.path));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Start the server
app.listen(port, async () => {
    await createTables();
    console.log(`Server running on port ${port}`);
});