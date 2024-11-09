// routes/transactions.js
import * as crypto from 'crypto';
import {pool} from '../db/pool.js'; // Make sure to import your database pool




// Endpoint to get the last 20 claim transactions
export async function getReferralCode(wallet_address) {
    let code;
    let solReceived;

    let affiliated_wallets = await pool.query(
        'SELECT * FROM affiliated_wallets WHERE wallet_address = $1',
        [ wallet_address ]
    );

    if(affiliated_wallets.rowCount > 0){
        code = affiliated_wallets.rows[0]["referral_code"]
        solReceived = affiliated_wallets.rows[0]["sol_received"] || 0
    } else {
        code = generateReferralCode()
        await createAffiliatedWallet(wallet_address, code)
        solReceived = 0
    }

    return {code, solReceived}
}



// Endpoint to update the SOL received for an affiliated wallet
export async function updateAffiliatedWallet(wallet_address, amount) {
    // Update the sol_received in the database
    const query = 'UPDATE affiliated_wallets SET sol_received = sol_received + $1 WHERE wallet_address = $2 RETURNING *';
    const params = [amount, wallet_address];
    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
        throw new Error('Affiliated wallet not found');
    }

    return result.rows[0]
}


export async function getAffiliatedWallet(referral_code) {
    let affiliated_wallet;

    let affiliated_wallets = await pool.query(
        'SELECT * FROM affiliated_wallets WHERE referral_code = $1',
        [ referral_code ]
    );
    if(affiliated_wallets.rowCount > 0)
        affiliated_wallet = affiliated_wallets.rows[0]
    else 
        affiliated_wallet = null

    return affiliated_wallet
}




function generateReferralCode() {
    const randomBytes = crypto.randomBytes(6);
    // Convert to Base64 and replace characters to make it URL-safe
    return randomBytes.toString('base64').replace(/\+/g, '0').replace(/\//g, '1').substring(0, 8);
}


async function createAffiliatedWallet(walletAddress, code) {
    const query = `INSERT INTO affiliated_wallets(wallet_address, referral_code, sol_received) VALUES($1, $2, $3) RETURNING *`
    const params = [walletAddress, code, 0]
    const result = await pool.query(query, params)

    if(result.rowCount == 0)
        return null

    return result.rows[0]
}


