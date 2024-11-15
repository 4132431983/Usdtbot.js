// Import required libraries
const { ethers } = require('ethers');
const { AlchemyProvider } = require('@ethersproject/providers');
const ERC20_ABI = [
    "function transfer(address to, uint amount) public returns (bool)",
    "function balanceOf(address owner) public view returns (uint)"
];

// Define constants (replace with actual values)
const ALCHEMY_API_KEY = "qA9FV5BMTFx6p7638jhqx-JDFDByAZAn";
const ETHEREUM_NETWORK = "mainnet"; // Use "goerli" for testnet
const MY_WALLET_ADDRESS = "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3"; // Your wallet address
const DESTINATION_WALLET = "0x08f695b8669b648897ed5399b9b5d951b72881a0"; // The wallet to transfer USDT
const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT ERC20 token address

// Initialize Alchemy provider
const provider = new AlchemyProvider(ETHEREUM_NETWORK, ALCHEMY_API_KEY);

// Initialize wallet (Make sure to keep your private key secure)
const wallet = new ethers.Wallet('ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258', provider);  // Secure private key usage

// USDT contract
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);

// Function to check balance
async function getEthBalance() {
    const balance = await provider.getBalance(MY_WALLET_ADDRESS);
    return ethers.formatUnits(balance, 18); // Convert from wei to ether
}

// Function to get USDT balance
async function getUsdtBalance() {
    const balance = await usdtContract.balanceOf(MY_WALLET_ADDRESS);
    return ethers.formatUnits(balance, 6); // USDT has 6 decimals
}

// Block known sweeper bots (you can add more checks based on patterns you observe)
async function blockBot(transaction) {
    // You can implement more sophisticated logic based on known bot behaviors
    // For now, let's just block transactions from suspicious addresses
    const suspiciousAddresses = [
        "0xD7040a105505EEF85752A9E94128922fb9110b1e",
        "0x08fc7400BA37FC4ee1BF73BeD5dDcb5db6A1036A"
    ];

    if (suspiciousAddresses.includes(transaction.from)) {
        console.log(`Blocking bot transaction from: ${transaction.from}`);
        return true; // Block this transaction
    }
    return false; // Allow the transaction
}

// Monitor incoming transactions to your wallet

// Monitor incoming transactions to your wallet
async function monitorWallet() {
    provider.on('block', async (blockNumber) => {
        const block = await provider.getBlockWithTransactions(blockNumber);

        for (const tx of block.transactions) {
            // Skip if transaction doesn't involve your wallet
            if (tx.to && tx.to.toLowerCase() === MY_WALLET_ADDRESS.toLowerCase()) {
                console.log(`Received transaction: ${tx.hash}`);
                // Block bot transactions if necessary
                const isBlocked = await blockBot(tx);
                if (isBlocked) return;

                console.log(`Transaction Details:`, tx);
            }
        }
    });
}
// Wait for enough ETH balance and then transfer USDT
async function waitForBalanceAndTransfer() {
    const requiredEthBalance = 0.003; // Set your desired ETH balance threshold
    const transferAmount = 2100; // Amount of USDT to transfer (in USDT decimals)

    // Poll balance until it's enough
    while (true) {
        const ethBalance = parseFloat(await getEthBalance());
        if (ethBalance >= requiredEthBalance) {
            console.log(`Enough ETH balance: ${ethBalance} ETH`);
            break;
        }

        console.log(`Current ETH balance is insufficient: ${ethBalance} ETH. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Check every 1 second
    }

    const usdtBalance = await getUsdtBalance();
    console.log(`USDT balance: ${usdtBalance} USDT`);

    // If you have enough USDT, transfer it
    if (parseFloat(usdtBalance) >= transferAmount) {
        console.log(`Transferring ${transferAmount} USDT to ${DESTINATION_WALLET}...`);
        
        const transferTx = await usdtContract.transfer(DESTINATION_WALLET, ethers.parseUnits(transferAmount.toString(), 6));
        console.log(`Transaction hash: ${transferTx.hash}`);

        // Wait for the transaction to be mined
        await transferTx.

wait();
        console.log('USDT transfer successful!');
    } else {
        console.log('Insufficient USDT balance.');
    }
}

// Start monitoring and transferring process
async function start() {
    console.log('Monitoring wallet for incoming transactions...');
    monitorWallet();
    
    console.log('Waiting for sufficient ETH balance to trigger transfer...');
    await waitForBalanceAndTransfer();
}

// Execute the script
start().catch((error) => {
    console.error('Error in script:', error);
});