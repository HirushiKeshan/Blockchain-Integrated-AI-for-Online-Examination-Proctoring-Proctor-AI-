import Web3 from "web3";
import ExamLog from "../contracts/ExamLog.json";

let web3;
let contract;
let selectedAccount;

export const initWeb3 = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ExamLog.networks[networkId];

    contract = new web3.eth.Contract(ExamLog.abi, deployedNetwork.address);
    const accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];

    console.log("Web3 Initialized");
  } else {
    alert("Please install MetaMask!");
  }
};

export const getContract = () => contract;
export const getSelectedAccount = () => selectedAccount;
