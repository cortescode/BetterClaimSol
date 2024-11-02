import { useCallback, useState } from "react"
import { PublicKey } from '@solana/web3.js'; //  Connection, clusterApiU
import "./AccountsScanner.css"
import { TokenAccount } from '../../interfaces/TokenAccount';
import { useEffect } from 'react';
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { closeAccountBunchTransaction, getAccountsWithoutBalanceFromAddress } from "../../api/accounts";
import { Message, MessageState } from "../Message";
import { storeClaimTransaction } from "../../api/claimTransactions";
import { getCookie } from "../../utils/cookies";
import { updateAffiliatedWallet } from "../../api/affiliation";




function SimpleMode() {
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [accountKeys, setAccountKeys] = useState<PublicKey[]>([])
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);

    const [ walletBalance, setWalletBalance ] = useState<number>(0)


    const scanTokenAccounts = useCallback(async () => {
        if (!publicKey) {
            setError("Wallet not connected");
            return;
        }
        const accounts = await getAccountsWithoutBalanceFromAddress(publicKey)
        const accounts_keys = accounts.map((account: TokenAccount)  => {
            return new PublicKey(account.pubkey)
        })
        setTokenAccounts(accounts)
        setAccountKeys(accounts_keys)
    }, [publicKey]);

    useEffect(() => {
        if(publicKey){
            scanTokenAccounts()
            connection.getBalance(publicKey).then((balance) => {    
                setWalletBalance(balance / 1e9); // Convert lamports to SOL
            })
        }

    }, [publicKey, scanTokenAccounts, connection]);

    async function closeAllAccounts() {
        if (!publicKey) {
            setError("Wallet not connected");
            return;
        }

        try {
            setError(null);
            setStatusMessage("Preparing transaction...");
            
            const code = getCookie("referral_code")
            const {transaction, solReceived, solShared} = await closeAccountBunchTransaction(publicKey, accountKeys, code)


            const signature = await sendTransaction(transaction, connection, { 
                skipPreflight: true, 
                preflightCommitment: 'confirmed' 
            });

            
            const blockhash = transaction.recentBlockhash
            const lastValidBlockHeight = transaction.lastValidBlockHeight

            if(!blockhash || !lastValidBlockHeight)
                throw new Error("Block hash or Block height not provided by server")
            

            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            if (confirmation.value.err) {
                throw new Error("Transaction failed to confirm");
            }

            console.log(publicKey.toBase58(), "---", signature, "---", solReceived)

            storeClaimTransaction(publicKey.toBase58(), signature, solReceived, accountKeys.length)

            if(code && solShared)
                updateAffiliatedWallet(code, solShared)

            setStatusMessage(`Account closed successfully. Signature: ${signature}`);
            // Refresh the account list
        } catch (err) {
            console.error("Detailed error:", err);
            setStatusMessage('');
            setError('Error closing account: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            scanTokenAccounts()
            
            setTimeout(() => {
                setStatusMessage('')
                setError('')
            }, 3000) 
        }
    }
    

    return (
        <section>
            <div className="accounts-info-wrapper smooth-appear">
                <p>Accounts to close: <span className="gradient-text">{tokenAccounts.length}</span></p>
                <p>Total sol to unlock: <span className="gradient-text">
                    {tokenAccounts.reduce((sum) => sum+=(walletBalance == 0? 0.00153: 0.00173), 0)} SOL
                </span></p>
            </div>

            {/* {tokenAccounts.map((account, index) => (
                    <div
                        key={account.pubkey}
                        className="account-item"
                        style={{ animationDelay: `${index * 0.1}s` }}  // Dynamically set delay
                    >
                        <Account scanTokenAccounts={props.scanTokenAccounts} account={{
                            pubkey: account.pubkey,
                            mint: account.mint,
                            balance: account.balance
                        }} />
                    </div>
            ))} */}
            { tokenAccounts && tokenAccounts.length > 0 && 
                <div className="claim-all-wrapper">
                    <button id="claimButton" className='cta-button' onClick={closeAllAccounts}>
                        Claim All Sol
                    </button>

                </div>
            }
            

            {statusMessage ? <Message state={MessageState.SUCCESS}>
                <p>{statusMessage}</p>
            </Message> : <></>}

            {error ? <Message state={MessageState.ERROR}>
                <p>{error}</p>
            </Message> : <></>}

        </section>
    );
};

export default SimpleMode;