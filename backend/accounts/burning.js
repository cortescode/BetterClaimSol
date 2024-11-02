import { createBurnInstruction, getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, PublicKey, Transaction } from "@solana/web3.js";
import { connection } from "./connection.js";



export async function burnAccountBalance(userPublicKey, accountPublicKey, transaction) {
    const accountInfo = await connection.getAccountInfo(accountPublicKey);
    if (!accountInfo) {
        throw new Error("Failed to fetch account info");
    }

    const tokenAccountInfo = await getAccount(connection, accountPublicKey);

    const mintAddress = tokenAccountInfo.mint;
    const tokenBalance = tokenAccountInfo.amount;

    if (tokenBalance == BigInt(0))
        return

    /* BURN TOKEN */
     // Check if the connected wallet is the owner of the token account
    if (!tokenAccountInfo.owner.equals(userPublicKey)) {
        throw new Error("You don't have permission to burn these tokens");
    }

    const associatedTokenAddress = await getAssociatedTokenAddress(
        mintAddress,
        userPublicKey
    );

    // Check if the associated token account exists
    const associatedAccountInfo = await connection.getAccountInfo(associatedTokenAddress);
    if (!associatedAccountInfo) {
        throw new Error("Associated token account doesn't exist. Please create it first.");
    }  
    
    // Add transfer instruction
    transaction.add(
        createBurnInstruction(
            accountPublicKey,      // Source account
            mintAddress,           // Mint
            userPublicKey,         // Owner of the source account
            tokenBalance,          // Amount to burn
            [],                    // Multi-signers (if any)
            TOKEN_PROGRAM_ID       // Token program ID
        )
    );
}