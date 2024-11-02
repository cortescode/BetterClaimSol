import { useEffect, useState } from "react";
import './accounts/AccountsScanner.css'
import './ClaimedSol.css'
import { getClaimTransactions, getClaimTransactionsInfo } from "../api/claimTransactions";


interface ClaimTransaction {
    wallet_address: string;
    accounts_closed: number;
    sol_received: number;
    transaction_id: string;
    claimed_at: string;
  }


export function ClaimedSol() {
    const [claimedSOL, setClaimedSOL] = useState<ClaimTransaction[]>([]);

    const [claimedSolInfo, setClaimedSOLInfo] = useState<Record<string, string> | null>(null)

    useEffect(() => {
        obtainClaimedSolTransacations()
        obtainClaimedSolInfo()
    }, [])


    async function obtainClaimedSolTransacations() {
        const claimedSol = await getClaimTransactions()
        setClaimedSOL(claimedSol)
    }

    async function obtainClaimedSolInfo() {
        const info = await getClaimTransactionsInfo()
        setClaimedSOLInfo(info);
    }

    return (
        claimedSolInfo && <>
        <section className='record-columns-wrapper'>
            <div className='record-columns'>
                <article className='record-card'>
                    <span>Total Sol Recovered</span>
                    <p>{claimedSolInfo.total_sol_claimed} SOL</p>
                </article>

                <article className='record-card'>
                    <span>Total Sol Shared</span>
                    <p>{claimedSolInfo.total_sol_shared} SOL</p>
                </article>

                <article className='record-card'>
                    <span>Total Accounts Closed</span>
                    <p>{claimedSolInfo.total_accounts_closed} </p>
                </article>
            </div>

        </section>
        <section className='account-scanner'>
            <img src='/images/solanatoken.png'></img>
            <h2>Latest Claimed SOL</h2>

            <table className="claimed-sol-table" id="data-Table">
                <thead>
                    <tr>
                        <th>Wallet</th>
                        <th>Accts</th>
                        <th>Claimed SOL</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {claimedSOL.map((claim, index) => (
                        <tr key={index}>
                            <td>{claim.wallet_address}</td>
                            <td>{claim.accounts_closed}</td>
                            <td>{claim.sol_received.toString().substring(0, 7)} SOL</td>
                            <td>{(new Date(claim.claimed_at).toLocaleString())}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    </>)
}
