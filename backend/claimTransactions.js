// routes/transactions.js
import express from 'express';
import {pool} from './db/pool.js'; // Make sure to import your database pool


export const claim_transactions_router = express.Router();


claim_transactions_router.use(express.json());

// Endpoint to add an element to the database
claim_transactions_router.get('/', async (req, res) => {
    
    try {
        const result = await pool.query(
            'SELECT * FROM claim_transactions ORDER BY claimed_at DESC LIMIT 20',
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the item.' });
    }
});



// Endpoint to get general data including sums from claim_transactions and affiliated_wallets
claim_transactions_router.get('/info', async (req, res) => {
    try {
        // Query to get the sum of total claimed SOL (from claim_transactions)
        // the sum of shared SOL (from affiliated_wallets), and the combined total
        const query = `
            SELECT 
                (SELECT COALESCE(SUM(accounts_closed), 0) FROM claim_transactions) AS total_accounts_closed,
                (SELECT COALESCE(SUM(sol_received), 0) FROM affiliated_wallets) AS total_sol_shared,
                (
                    (SELECT COALESCE(SUM(sol_received), 0) FROM claim_transactions) +
                    (SELECT COALESCE(SUM(sol_received), 0) FROM affiliated_wallets)
                ) AS total_sol_claimed
        `;

        const result = await pool.query(query);

        // Send the result back as JSON
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving general data.' });
    }
});


// Endpoint to add an element to the database
claim_transactions_router.post('/store', async (req, res) => {
    const { 
        walletAddress, 
        transactionId, 
        solReceived, 
        accountsClosed // Optionally provided by the request
    } = req.body;

    try {
        let query, values;

        // If accountsClosed is provided, include it in the INSERT statement
        if (accountsClosed !== undefined) {
            query = `
                INSERT INTO claim_transactions (wallet_address, transaction_id, sol_received, accounts_closed)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            values = [walletAddress, transactionId, solReceived, accountsClosed];
        } else {
            // If accountsClosed is not provided, omit it (let the default value handle it)
            query = `
                INSERT INTO claim_transactions (wallet_address, transaction_id, sol_received)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            values = [walletAddress, transactionId, solReceived];
        }

        const result = await pool.query(query, values);

        // Return the stored claim transaction
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the item.' });
    }
});

