import Web3 from 'web3';
import ExamLog from '../build/contracts/ExamLog.json';

let web3;
let contract;
let accounts;

const loadBlockchain = async () => {
  try {
    // Connect to Ganache
    web3 = new Web3("http://localhost:8545");

    // Load user accounts
    accounts = await web3.eth.getAccounts();

    // Get network ID from Ganache
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ExamLog.networks[networkId];

    if (!deployedNetwork) {
      alert("Smart contract not deployed on this network");
      return;
    }

    // Create contract instance
    contract = new web3.eth.Contract(ExamLog.abi, deployedNetwork.address);

    console.log("🟢 Blockchain connected successfully");
    return { web3, contract, accounts };
  } catch (error) {
    console.error("🚨 Blockchain connection failed:", error);
    return null;
  }
};

export default loadBlockchain;
