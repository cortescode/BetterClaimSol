import express from "express"
import { getAffiliatedWallet, getReferralCode, updateAffiliatedWallet } from "./affiliation.js";

export const affiliation_router = express.Router();


affiliation_router.get('/wallet-info', async (req, res) => {
    const wallet_address = req.query["wallet_address"];

    // Validate input
    if (!wallet_address) 
        return res.status(400).json({ error: 'Invalid request parameters' });
    
    const {code, solReceived} = await getReferralCode(wallet_address);

    if(code) res.status(200).json({
        referral_code: code,
        sol_received: solReceived
    });


    else res.status(500).json({ error: 'An error occurred obtaining the referral code.' });
});

// Endpoint to update the SOL received for an affiliated wallet
affiliation_router.post('/affiliated-wallet/update', async (req, res) => {
    const { wallet_address, amount } = req.body;

    // Validate input
    if (!wallet_address || amount === undefined || amount < 0) {
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const updated_wallet = updateAffiliatedWallet(wallet_address, amount);

    if (updated_wallet)
        res.status(200).json({ updated_wallet: updated_wallet });
    else
        res.status(500).json({ error: 'An error occurred while updating the wallet.' });
});

// Endpoint to get the last 20 claim transactions
affiliation_router.get('/affiliated-wallet', async (req, res) => {
    const referral_code = req.query["referral_code"];

    if (!referral_code) {
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    let affiliated_wallet = await getAffiliatedWallet(referral_code);
    if(affiliated_wallet)
        res.status(200).json({ affiliated_wallet });
    else res.status(500).json({ error: "Error obtaining affiliated wallet" });
});


