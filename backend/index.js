// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import createTables from './db/createTables.js';
import {affiliation_router} from './affiliation/affiliation.view.js';
import {claim_transactions_router} from './claimTransactions.js';
import {accounts_router} from './accounts/accounts.view.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set security headers
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
    );
    next();
});

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'public')));

// Importing routers
app.use("/api/affiliation", affiliation_router);
app.use("/api/claim-transactions", claim_transactions_router);
app.use("/api/accounts", accounts_router);

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, async () => {
    await createTables();
    console.log(`Server running on port ${port}`);
});