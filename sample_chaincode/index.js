const shim = require('fabric-shim');
const { Chaincode } = require('./src/chaincode');

// My Chaincode is moved to seperate file for testing

shim.start(new Chaincode());
