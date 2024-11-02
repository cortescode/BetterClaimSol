import {pool} from "./pool.js"


export default async function createTables() {

    try {
        await createClaimersTable()
        await createAffiliationTable()
    } catch (err) {
        console.log("Error creating tables: ", err)
    }
}

/* 
Creates claimers table claim_transactions if not exists
*/
async function createClaimersTable() {

    const create_table_query = `
        CREATE TABLE IF NOT EXISTS claim_transactions(
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(44) NOT NULL,
            accounts_closed INTEGER NOT NULL,
            transaction_id VARCHAR(88) NOT NULL UNIQUE,
            sol_received NUMERIC(18, 9) NOT NULL,
            claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `

    await pool.query(create_table_query)
}


/* 
Creates claimers table if affiliated_wallets not exists
*/
async function createAffiliationTable() {

    const create_table_query = `
        CREATE TABLE IF NOT EXISTS affiliated_wallets(
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(44) NOT NULL UNIQUE,
            referral_code VARCHAR(8) NOT NULL UNIQUE,
            sol_received NUMERIC(18, 9) NOT NULL DEFAULT 0,
            share INTEGER NOT NULL DEFAULT 50,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `

    await pool.query(create_table_query)
}

