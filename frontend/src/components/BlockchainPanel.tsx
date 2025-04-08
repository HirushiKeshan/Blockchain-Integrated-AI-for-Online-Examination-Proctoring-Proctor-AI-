import React, { useEffect, useState } from "react";
import { initWeb3, getContract, getSelectedAccount } from "../blockchain/contract";


const BlockchainPanel = () => {
  const [account, setAccount] = useState("");
  const [logInput, setLogInput] = useState("");
  const [logs, setLogs] = useState([]);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { examLogInstance, account } = await initWeb3();
      setAccount(account);
      setContract(examLogInstance);
      fetchLogs(examLogInstance);
    };
    load();
  }, []);

  const fetchLogs = async (instance) => {
    const logs = await instance.methods.getLogs().call();
    setLogs(logs);
  };

  const addLog = async () => {
    await contract.methods.addLog(logInput).send({ from: account });
    fetchLogs(contract);
    setLogInput("");
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Blockchain Log Panel</h2>
      <p className="mb-2 text-sm text-gray-700">Connected Account: {account}</p>

      <input
        type="text"
        className="border p-2 w-full mb-2"
        placeholder="Enter log message"
        value={logInput}
        onChange={(e) => setLogInput(e.target.value)}
      />
      <button
        onClick={addLog}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Add Log
      </button>

      <h3 className="mt-4 font-semibold">Logs:</h3>
      <ul className="list-disc ml-5 mt-2">
        {logs.map((log, index) => (
          <li key={index} className="text-sm">{log}</li>
        ))}
      </ul>
    </div>
  );
};

export default BlockchainPanel;
