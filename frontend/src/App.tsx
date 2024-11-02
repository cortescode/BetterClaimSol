import { useState, useEffect } from 'react';
import './App.css';
import { CustomConnectButton } from './components/CustomConnectButton';
import { useWallet } from '@solana/wallet-adapter-react';
import AccountsScanner from './components/accounts/AccountsScanner';
import { Buffer } from 'buffer';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ClaimedSol } from './components/ClaimedSol';
import HowItWorks from './components/HowItWorks';

function App() {

	const [darkMode, setDarkMode] = useState(true);
	const { publicKey } = useWallet();
	const [walletAddress, setWalletAddress] = useState<string | null>(null);


	useEffect(() => {
		// Apply dark mode to body when component mounts and when darkMode changes
		document.body.classList.toggle('dark-mode', darkMode);
	}, [darkMode]);

	useEffect(() => {
		if (publicKey) {
			setWalletAddress(publicKey.toBase58());
		} else {
			setWalletAddress('');
		}
	}, [publicKey]);

	function toggleDarkMode () {
		setDarkMode(prevMode => !prevMode);
	};

	return (
		<div className={`app ${darkMode ? 'dark-mode' : ''}`}>
			{/* HEADER */}
			<Header
				toggle={toggleDarkMode}
				darkMode={darkMode}
				walletAddress={walletAddress}
				setWalletAddress={setWalletAddress}
			></Header>

			{/* MAIN */}
			<main>
				<section id="intro" className='hero'>

					<div className="top-middle">
						<img src="/images/logo.png" alt="Company Logo" style={{
							width: "320px"
						}}/>
					</div>
					<div className='content'>
						<h1><span className='gradient-text'>You Lose SOL On Every Trade  </span> 
							   </h1>
						<p>
							You Can Still claim it back <br/>
							NO SOL? NO PROBLEMS, IN THAT CASE WE COVER THE FEES <br/>

							<a href="#how-it-works" className='small-link gradient-text'>How It Works</a>
						</p>
						{!walletAddress &&
							<div className='button-container'>
								<CustomConnectButton setWalletAddress={setWalletAddress} />
							</div>
						}
					</div>
					
				</section>
				


				{walletAddress && <AccountsScanner walletAddress={walletAddress} setWalletAddress={setWalletAddress}/>}

				<ClaimedSol></ClaimedSol>

				
				<HowItWorks></HowItWorks>		
				
			</main>

			<Footer></Footer>
		</div>
	);
}


window.Buffer = Buffer
export default App;