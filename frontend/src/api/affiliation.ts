import { AffiliatedWallet } from "../interfaces/AffiliatedWallet";



const API_URL = "http://localhost:5000"



/* 
    Fetch server to obtain the referral code assigned to a certain wallet_address
*/
export async function getReferralInfo(wallet_address:string): Promise<{
    referral_code: string,
    sol_received: string
}>{

    const url = `${API_URL}/api/affiliation/wallet-info?wallet_address=${wallet_address}`
    const request = await fetch(url);

    console.log("Request: ", request)

    if(!request.ok)
        throw new Error("Error obtaining referral code")

    const request_json = await request.json()

    console.log("Obtained code entries: ", Object.entries(request_json["referral_code"]))

    return {
        referral_code: request_json["referral_code"],
        sol_received: request_json["sol_received"]
    }

}

/* 
    Fetch server to obtain the affiliated wallet information 
    associated to the referral code given as parameter
*/
export async function getAffiliatedWallet(referral_code: string): Promise<AffiliatedWallet>{

    const url = `${API_URL}/api/affiliation/affiliated-wallet?referral_code=${referral_code}`
    const request = await fetch(url);

    if(!request.ok)
        throw new Error("Error obtaining referral code")

    const request_json = await request.json()
    

    console.log("Wallet obtained fromm code: ", request_json)
    const affiliated_wallet: AffiliatedWallet = request_json["affiliated_wallet"]

    return affiliated_wallet
}


/*  
    Fetch server with the sol amount to sum to the affiliated wallet
*/
export async function updateAffiliatedWallet(referral_code: string, sol_amount: number): Promise<void> {
    const data = { 
        sol_amount,
        referral_code
    }

    const url = `${API_URL}/api/affiliation/affiliated-wallet/update`
    const request = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if(!request.ok)
        throw new Error("Error obtaining referral code")

}