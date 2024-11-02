import {pool} from "./pool.js"


async function alterClaimTransactionsTable() {
    const alter_table_query = `
        ALTER TABLE claim_transactions 
        ADD COLUMN accounts_closed INTEGER NOT NULL DEFAULT 1;
    `;

    const update_existing_rows_query = `
        UPDATE claim_transactions
        SET accounts_closed = 1;
    `;

    try {
        // Run the ALTER TABLE query to add the column
        await pool.query(alter_table_query);
        
        // Update all existing rows to set accounts_closed to 1
        await pool.query(update_existing_rows_query);

        console.log('Table altered and rows updated successfully.');
    } catch (error) {
        console.error('Error altering table or updating rows:', error);
    }
}


// Call the functions to alter the tables
export default async function updateTableSchemas() {
    try {
        await alterClaimTransactionsTable();
        console.log('Claim transactions table altered successfully.');

        console.log('Affiliated wallets table altered successfully.');
    } catch (error) {
        console.error('Error updating table schemas:', error);
    }
}

