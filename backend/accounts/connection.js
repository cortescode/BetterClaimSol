import { clusterApiUrl, Connection } from "@solana/web3.js";


export const connection = new Connection(
    clusterApiUrl('mainnet-beta'),   // Can be 'mainnet-beta', 'testnet', or 'devnet'
    'confirmed'                     // Commitment level: 'processed', 'confirmed', or 'finalized'
);
