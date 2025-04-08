import web3 from '../../blockchain/blockchain';
import ExamLog from '../../../../build/contracts/ExamLog.json';

// ✅ Use the deployed contract address from your migration log:
const contractAddress = '0xe3b16a16087c1da3884960500AB965E325675ed3';

const instance = new web3.eth.Contract(ExamLog.abi, contractAddress);

export default instance;
