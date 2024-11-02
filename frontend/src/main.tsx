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


/* 
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={clusterApiUrl('devnet', true)}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);
*/


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConnectionProvider endpoint="https://solana-mainnet.api.syndica.io/api-key/4eW91Uf1tytzBvzvPuR9jWG3Tpy6AdA2bADJS6vrB4W8EN2y8Ch6k6JiQKgoArNX8zrz7HFeJmGrfHFRzhVZk8Dd41fEJFcPgid">
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
);





// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//   <React.StrictMode>
//     <ConnectionProvider endpoint={clusterApiUrl('devnet', true)}>
//       <WalletProvider wallets={wallets} autoConnect>
//         <WalletModalProvider>
//           <App />
//         </WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   </React.StrictMode>
// );