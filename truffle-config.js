module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Same as Ganache
      port: 7545,        // Must match Ganache port
      network_id: "*",   // Accept any network
    },
  },
  compilers: {
    solc: {
      version: "0.8.0", // Match pragma
    }
  }
};
