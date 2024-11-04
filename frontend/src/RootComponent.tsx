import { useEffect, useState } from 'react';
import App from './App';
import './index.css';
import { WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { Buffer } from 'buffer';

import '@solana/wallet-adapter-react-ui/styles.css';
window.Buffer = Buffer;

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export function RootComponent() {
	const [endpoint, setEndpoint] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchApiKey = async () => {
			try {
				const response = await fetch(`http://localhost:5000/api/solana-key`);
				const data = await response.json();
				console.log("Data: ", data);
				setEndpoint(`https://solana-mainnet.api.syndica.io/api-key/${data.apiKey}`);
			} catch (error) {
				console.error('Error fetching API key:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchApiKey();
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!endpoint) {
		return <div>Error fetching API key</div>
	}
	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>
					<App />
				</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
