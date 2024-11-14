import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter,SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
// import { clusterApiUrl } from '@solana/web3.js';
import { Buffer } from 'buffer';

import '@solana/wallet-adapter-react-ui/styles.css';
// import { clusterApiUrl } from '@solana/web3.js';
window.Buffer = Buffer

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={"http://localhost:5000/api/solana-endpoint"} config={{
        wsEndpoint: "ws://localhost:5000/api/solana-endpoint"
      }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);

