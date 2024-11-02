// routes/transactions.js
import express from "express";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { closeAccountBunchTransaction, closeAccountTransaction, closeAccountWithBalanceTransaction } from "./accounts.js";
import { connection } from "./connection.js";
import { Metaplex } from "@metaplex-foundation/js";


export const accounts_router = express.Router();

// Endpoint to close a single account
accounts_router.post('/close-account', async (req, res) => {
    try {
        const userPublicKey = req.body["user_public_key"];
        const accountPublicKey = req.body["account_public_key"];
        const referralCode = req.body["referral_code"];

        const transactionDetails = await closeAccountTransaction(
            new PublicKey(userPublicKey),
            new PublicKey(accountPublicKey),
            referralCode
        );

        res.status(200).json({
            transaction: transactionDetails.transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false
              }).toString('base64'),
            solReceived: transactionDetails.solReceived,
            solShared: transactionDetails.solShared,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create the transaction' });
    }
});

// Endpoint to close multiple accounts in a batch
accounts_router.post('/close-accounts-bunch', async (req, res) => {
    try {
        const userPublicKey = req.body["user_public_key"];
        const accountPublicKeys = req.body["account_public_keys"];
        const referralCode = req.body["referral_code"];

        const transactionDetails = await closeAccountBunchTransaction(
            new PublicKey(userPublicKey),
            accountPublicKeys.map((key) => new PublicKey(key)),
            referralCode
        );
        
        res.status(200).json({
            transaction: transactionDetails.transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false
              }).toString('base64'),
            solReceived: transactionDetails.solReceived,
            solShared: transactionDetails.solShared
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to close accounts' });
    }
});

// Endpoint to close a single account with a balance
accounts_router.post('/close-account-with-balance', async (req, res) => {
    try {
        const userPublicKey = req.body["user_public_key"];
        const accountPublicKey = req.body["account_public_key"];
        const referralCode = req.body["referral_code"];

        const transactionDetails = await closeAccountWithBalanceTransaction(
            new PublicKey(userPublicKey),
            new PublicKey(accountPublicKey),
            referralCode
        );

        res.status(200).json({
            transaction: Buffer.from(transactionDetails.transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false
              })).toString("base64"),
            solReceived: transactionDetails.solReceived,
            solShared: transactionDetails.solShared
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create the transaction' });
    }
});





accounts_router.get('/get-accounts-without-balance-list', async (req, res) => {
    const address = req.query['wallet_address'] ? new PublicKey( req.query['wallet_address']) : null

    if(!address)
        res.status(400).json({error:'No address provided'})

    const accounts = await connection.getParsedTokenAccountsByOwner(address, {
        programId: TOKEN_PROGRAM_ID
    });

    if(!accounts)
        res.status(200).json({"accounts": []})

    const processedAccounts = []

    for (let account of accounts.value) {
        const parsedInfo = account.account.data.parsed.info;

        if (parsedInfo.tokenAmount.uiAmount == 0) {
            processedAccounts.push({
                pubkey: account.pubkey.toBase58(),
                mint: parsedInfo.mint,
                balance: parsedInfo.tokenAmount.uiAmount,
            });
        }
    }


    res.status(200).json({"accounts": processedAccounts})
})




accounts_router.get('/get-accounts-with-balance-list', async (req, res) => {
    const address = req.query['wallet_address'] ? new PublicKey( req.query['wallet_address']) : null

    console.log("Executed")

    if(!address)
        res.status(400).json({error:'No address provided'})

    const accounts = await connection.getParsedTokenAccountsByOwner(address, {
        programId: TOKEN_PROGRAM_ID
    });

    if(!accounts)
        res.status(200).json({"accounts": []})

    const metaplex = Metaplex.make(connection)

    const processedAccounts = []

    for (let account of accounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        const mintAddress = new PublicKey(parsedInfo.mint);

        let tokenName;
        let tokenSymbol;
        let tokenLogo;

        try {
            // Fetch the NFT metadata using the mint address
            const nft = (await metaplex.nfts().findByMint({ mintAddress })).json;

            // Extract the data from the NFT metadata
            tokenName = nft.name;
            tokenSymbol = nft.symbol;
            tokenLogo = nft.image; // URL for the token image/logo

        } catch (error) {
            console.error('Error fetching NFT metadata:', error);
            // Handle the error appropriately, possibly continue processing other accounts
            continue;
        }

        if (parsedInfo.tokenAmount.uiAmount > 0) {
            processedAccounts.push({
                pubkey: account.pubkey.toBase58(),
                mint: parsedInfo.mint,
                balance: parsedInfo.tokenAmount.uiAmount,
                name: tokenName,
                symbol: tokenSymbol,
                logo: tokenLogo,
            });
        }
    }

    console.log("Processed accounts: ", processedAccounts)

    res.status(200).json({"accounts": processedAccounts})
})


