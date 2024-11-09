import { createCloseAccountInstruction, getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction, Keypair } from "@solana/web3.js";
import { getAffiliatedWallet } from "../affiliation/affiliation.js";
import { connection } from "./connection.js";
import { burnAccountBalance } from "./burning.js";
import { addCharityTransfer } from "./charityTranfer.js";

const USER_SHARE = 0.85;

// Load the keypair from the file
const secretKeyString = process.env.SOLANA_KEYPAIR;
const secretKeyArray = JSON.parse(secretKeyString);
const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

export async function closeAccountTransaction(userPublicKey, accountPublicKey, referral_code) {

    let user_share_percentage = USER_SHARE
    if (!userPublicKey || !accountPublicKey) {
        throw new Error("Params not provided")
    }

    const transaction = createBaseTransaction()

    const balance = await connection.getBalance(userPublicKey);
    let charity_balance = null

    let signTransaction = false

    // Check if balance is zero
    if (balance === 0) {
        charity_balance= await addCharityTransfer(userPublicKey, transaction)

        user_share_percentage = 0.75
        signTransaction = true
    }

    const { rentAmount, closeInstruction } = await closeAccountInstruction(userPublicKey, accountPublicKey)
    transaction.add(closeInstruction)

    // Calculate shares
    let userShare = Math.floor(rentAmount * user_share_percentage);
    let destinationShare = rentAmount - userShare;

    if(charity_balance) {
        userShare = userShare - charity_balance
        destinationShare = destinationShare + charity_balance
    }

    const affiliatedWallet = await obtainAffiliatedWallet(referral_code)
    let referralShare = null
    if (affiliatedWallet) {
        referralShare = await addTransferToReferral(userPublicKey, destinationShare, affiliatedWallet, transaction)
        destinationShare = destinationShare - referralShare
    }

    // Create the transfer instruction for the destination wallet
    const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: keypair.publicKey,
        lamports: destinationShare,
    });

    transaction.add(transferInstruction)

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight
    
    if(signTransaction) {
        transaction.feePayer = keypair.publicKey;
        transaction.partialSign(keypair)
    } else
        transaction.feePayer = userPublicKey;


    // Divide by 1000000000 to convert lamports into solana
    return { 
        transaction, 
        solReceived: userShare / 1000000000, 
        referralShare: referralShare/1000000000
    }
}

export async function closeAccountWithBalanceTransaction(userPublicKey, accountPublicKey, referral_code) {
    let user_share_percentage = USER_SHARE
    
    if (!userPublicKey || !accountPublicKey) 
        throw new Error("Params not provided")
    
    // As closeBurningAccount require special settings, it doesn't use the base transaction
    // and assign custom unit limit and unit price for the transaction
    const transaction = new Transaction()
    transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 20000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 })
    )

    const balance = await connection.getBalance(userPublicKey);
    let charity_balance = null

    let signTransaction = false

    // Check if balance is zero
    if (balance === 0) {
        charity_balance = await addCharityTransfer(userPublicKey, transaction)

        user_share_percentage = 0.75
        signTransaction = true
    }
    await burnAccountBalance(userPublicKey, accountPublicKey, transaction)
    const {closeInstruction, rentAmount} = await closeAccountInstruction(
        userPublicKey,
        accountPublicKey
    )

    transaction.add(closeInstruction)

    // Calculate shares
    let userShare = Math.floor(rentAmount * user_share_percentage);
    let destinationShare = rentAmount - userShare;

    if(charity_balance) {
        userShare = userShare - charity_balance
        destinationShare = destinationShare + charity_balance
    }

    const affiliatedWallet = await obtainAffiliatedWallet(referral_code)
    let referralShare = null
    if (affiliatedWallet) {
        referralShare = await addTransferToReferral(userPublicKey, destinationShare, affiliatedWallet, transaction)
        destinationShare = destinationShare - referralShare
    }

    // Create the transfer instruction for the destination wallet
    const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: keypair.publicKey,
        lamports: destinationShare,
    });

    transaction.add(transferInstruction)

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    if(signTransaction) {
        transaction.feePayer = keypair.publicKey;
        transaction.partialSign(keypair)
    } else
        transaction.feePayer = userPublicKey;

    // Divide by 1000000000 to convert lamports into solana
    return { 
        transaction, 
        solReceived: userShare / 1000000000, 
        solShared: referralShare/1000000000 
    }
}


export async function closeAccountBunchTransaction(userPublicKey, accountPublicKeys, referral_code) {
    let user_share_percentage = USER_SHARE
    
    if (!userPublicKey || !accountPublicKeys || accountPublicKeys.length == 0) {
        throw new Error("Params not provided")
    }

    const transaction = createBaseTransaction()
    
    const balance = await connection.getBalance(userPublicKey);
    let charity_balance = null

    let signTransaction = false

    // Check if balance is zero
    if (balance === 0) {
        charity_balance = await addCharityTransfer(userPublicKey, transaction)

        user_share_percentage = 0.75
        signTransaction = true
    }
    let totalRentAmount = 0;

    for (const accountPublicKey of accountPublicKeys) {
        const { rentAmount, closeInstruction } = await closeAccountInstruction(userPublicKey, accountPublicKey)
        totalRentAmount += rentAmount
        transaction.add(closeInstruction)
    }

    // Calculate shares
    let userShare = Math.floor(totalRentAmount * user_share_percentage);
    let destinationShare = totalRentAmount - userShare;

    if(charity_balance) {
        userShare = userShare - charity_balance
        destinationShare = destinationShare + charity_balance
    }

    const affiliatedWallet = await obtainAffiliatedWallet(referral_code)
    let referralShare = null
    if (affiliatedWallet) {
        referralShare = await addTransferToReferral(userPublicKey, destinationShare, affiliatedWallet, transaction)
        destinationShare = destinationShare - referralShare
    }
    // Create the transfer instruction for the destination wallet
    const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: keypair.publicKey,
        lamports: destinationShare,
    });

    transaction.add(transferInstruction)


    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight
    
    if(signTransaction) {
        transaction.feePayer = keypair.publicKey;
        transaction.partialSign(keypair)
    } else
        transaction.feePayer = userPublicKey;


    // Divide by 1000000000 to convert lamports into solana
    return { 
        transaction, 
        solReceived: userShare / 1000000000, 
        solShared: referralShare / 1000000000 
    }
}

async function closeAccountInstruction(userPublicKey, accountPublicKeys) {
    const accountInfo = await connection.getAccountInfo(accountPublicKeys);
    if (!accountInfo) {
        throw new Error("Failed to fetch account info");
    }

    // Get the actual rent amount from the account
    const rentAmount = accountInfo.lamports;

    // Create the close account instruction
    const closeInstruction = createCloseAccountInstruction(
        accountPublicKeys,
        userPublicKey,
        userPublicKey,
        [],
        TOKEN_PROGRAM_ID
    );

    return {
        rentAmount,
        closeInstruction
    }
}

async function obtainAffiliatedWallet(code = null) {
    if (!code) return null
    return await getAffiliatedWallet(code)
}

async function addTransferToReferral(userPublicKey, destinationShare, affiliatedWallet, transaction) {
    const referralShare = Math.round(destinationShare * (affiliatedWallet.share / 100));

    const referralPubKey = new PublicKey(affiliatedWallet.wallet_address)
    const recipientAccountInfo = await connection.getAccountInfo(referralPubKey);

    if (recipientAccountInfo) {
        const referralPubKey = new PublicKey(affiliatedWallet.wallet_address)
        // Create the transfer instruction for the destination wallet
        const transferInstruction2 = SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: referralPubKey,
            lamports: referralShare,
        });

        transaction.add(transferInstruction2)

        return referralShare
    }
    return 0
}

function createBaseTransaction() {
    const ComputedUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 10000, // Adjust this value as needed
    });
    const ComputedUnitPrice = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 150000,
    })
    const transaction = new Transaction().add(
        ComputedUnits,
        ComputedUnitPrice,
    );

    return transaction
}