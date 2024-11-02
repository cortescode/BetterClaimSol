import { createBurnInstruction, createCloseAccountInstruction, getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { getCookie } from "../utils/cookies";
import { getAffiliatedWallet } from "../api/affiliation";


const DESTINATION_WALLET = new PublicKey('Bamy1f5x5fPZMfkbehtZ2Nohh3sRWhBi5GFxsGTLfu3P');
const USER_SHARE = 0.85;

export async function closeAccountTransaction(
    connection: Connection,
    userPubKey: PublicKey, 
    accountPubKey: PublicKey
): Promise<{
    transaction: Transaction,
    solReceived: number
}> {
    if (!userPubKey || !accountPubKey) {
        throw new Error("Params not provided")
    }


    const transaction =  createBaseTransaction()

    const { rentAmount, closeInstruction } = await closeAccountInstruction(connection, userPubKey, accountPubKey)

    
    transaction.add(closeInstruction)

    // Calculate shares
    const userShare = Math.floor(rentAmount * USER_SHARE);
    let destinationShare = rentAmount - userShare;


    const affiliatedWallet = await obtainAffiliatedWallet()
    if (affiliatedWallet) {
        
        const referralShare = Math.round(destinationShare * (affiliatedWallet.share/100));

        const referralPubKey = new PublicKey(affiliatedWallet.wallet_address)
        const recipientAccountInfo = await connection.getAccountInfo(referralPubKey);

        if (recipientAccountInfo) {
            // Create the transfer instruction for the destination wallet
            const transferInstruction2 = SystemProgram.transfer({
                fromPubkey: userPubKey,
                toPubkey: referralPubKey,
                lamports: referralShare,
            });

            destinationShare = destinationShare - referralShare

            transaction.add(transferInstruction2)
        }
        
    }


    // Create the transfer instruction for the destination wallet
    const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPubKey,
        toPubkey: DESTINATION_WALLET,
        lamports: destinationShare,
    });


    transaction.add(transferInstruction)


    // Divide by 1000000000 to convert lamports into solana
    return { transaction, solReceived: userShare/1000000000 }
};



export async function closeAccountWithBalanceTransaction(
    connection: Connection, 
    userPubKey: PublicKey, 
    accountPubKey: PublicKey
): Promise<{
    transaction: Transaction,
    solReceived: number
}> {

    if (!userPubKey || !accountPubKey) {
        throw new Error("Params not provided")
    }


    const transaction = createBaseTransaction()

    const accountInfo = await connection.getAccountInfo(accountPubKey);
    if (!accountInfo) {
        throw new Error("Failed to fetch account info");
    }

    const tokenAccountInfo = await getAccount(connection, accountPubKey);

    const mintAddress = tokenAccountInfo.mint;
    const rentAmount = accountInfo.lamports;
    const tokenBalance = tokenAccountInfo.amount;

    console.log("Token Balance: ", tokenBalance)


    if (tokenBalance == BigInt(0)) 
        throw new Error("Account with 0 balance")

    /* BURN TOKEN */
    // Check if the connected wallet is the owner of the token account
    if (!tokenAccountInfo.owner.equals(userPubKey)) {
        throw new Error("You don't have permission to burn these tokens");
    }

    const associatedTokenAddress = await getAssociatedTokenAddress(
        mintAddress,
        userPubKey
    );

    // Check if the associated token account exists
    const associatedAccountInfo = await connection.getAccountInfo(associatedTokenAddress);
    if (!associatedAccountInfo) {
        throw new Error("Associated token account doesn't exist. Please create it first.");
    }
    transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 200000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 })
    );
    // Add transfer instruction
    transaction.add(
        createBurnInstruction(
            accountPubKey,         // Source account
            mintAddress,           // Mint
            userPubKey,             // Owner of the source account
            tokenBalance,          // Amount to burn
            [],                    // Multi-signers (if any)
            TOKEN_PROGRAM_ID       // Token program ID
        )
    );


    const closeInstruction = createCloseAccountInstruction(
        accountPubKey,
        userPubKey,
        userPubKey,
        [],
        TOKEN_PROGRAM_ID
    )

    transaction.add(closeInstruction)

    // Calculate shares
    const userShare = Math.floor(rentAmount * USER_SHARE);
    let destinationShare = rentAmount - userShare;


    const affiliatedWallet = await obtainAffiliatedWallet()
    if (affiliatedWallet) {
        const referralShare = Math.round(destinationShare * (affiliatedWallet.share/1000));

        const referralPubKey = new PublicKey(affiliatedWallet.wallet_address)
        const recipientAccountInfo = await connection.getAccountInfo(referralPubKey);

        if (recipientAccountInfo) {
            const referralPubKey = new PublicKey(affiliatedWallet.wallet_address)
            // Create the transfer instruction for the destination wallet
            const transferInstruction2 = SystemProgram.transfer({
                fromPubkey: userPubKey,
                toPubkey: referralPubKey,
                lamports: referralShare,
            });

            destinationShare = destinationShare - referralShare

            transaction.add(transferInstruction2)
        }
    }


    // Create the transfer instruction for the destination wallet
    const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPubKey,
        toPubkey: DESTINATION_WALLET,
        lamports: destinationShare,
    });

    transaction.add(transferInstruction)

    console.log(userShare)

    // Divide by 1000000000 to convert lamports into solana
    return { transaction, solReceived: userShare/1000000000 }
};


export async function closeAccountBunchTransaction(
    connection: Connection, 
    userPubKey: PublicKey, 
    accountPubKeys: PublicKey[]
): Promise<{
    transaction: Transaction,
    solReceived: number
}> {
    if (!userPubKey || !accountPubKeys || accountPubKeys.length == 0) {
        throw new Error("Params not provided")
    }

    const transaction = createBaseTransaction()

    let totalRentAmount = 0;

    for (const accountPubKey of accountPubKeys) {
        const { rentAmount, closeInstruction } = await closeAccountInstruction(connection, userPubKey, accountPubKey)
        totalRentAmount += rentAmount
        transaction.add(closeInstruction)
    }

    // Calculate shares
    const userShare = Math.floor(totalRentAmount * USER_SHARE);
    let destinationShare = totalRentAmount - userShare;


    const affiliatedWallet = await obtainAffiliatedWallet()
    if (affiliatedWallet) {
        const referralShare = Math.round(destinationShare * (affiliatedWallet.share/100));

        const referralPubKey = new PublicKey(affiliatedWallet.wallet_address)
        const recipientAccountInfo = await connection.getAccountInfo(referralPubKey);

        if (recipientAccountInfo) {
            // Create the transfer instruction for the destination wallet
            const transferInstruction2 = SystemProgram.transfer({
                fromPubkey: userPubKey,
                toPubkey: referralPubKey,
                lamports: referralShare,
            });

            destinationShare = destinationShare - referralShare

            transaction.add(transferInstruction2)
        }
    }


    // Create the transfer instruction for the destination wallet
    const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPubKey,
        toPubkey: DESTINATION_WALLET,
        lamports: destinationShare,
    });

    transaction.add(transferInstruction)


    // Divide by 1000000000 to convert lamports into solana
    return { transaction, solReceived: userShare/1000000000 }
};



async function closeAccountInstruction(connection: Connection, userPubKey: PublicKey, accountPubKey: PublicKey) {

    const accountInfo = await connection.getAccountInfo(accountPubKey);
    if (!accountInfo) {
        throw new Error("Failed to fetch account info");
    }

    // Get the actual rent amount from the account
    const rentAmount = accountInfo.lamports;

    // Create the close account instruction
    const closeInstruction = createCloseAccountInstruction(
        accountPubKey,
        userPubKey,
        userPubKey,
        [],
        TOKEN_PROGRAM_ID
    );

    return {
        rentAmount,
        closeInstruction
    }

}


async function obtainAffiliatedWallet() {
    const code = getCookie("referral_code")

    console.log("Code: ", code)

    if (code) {
        const affiliatedWallet = await getAffiliatedWallet(code)

        return affiliatedWallet
    } else return null

}



function createBaseTransaction(): Transaction {
    const ComputedUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 3725, // Adjust this value as needed
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