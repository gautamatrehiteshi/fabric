/*
* This file contains functions for the use of your test file.
* It doesn't require any changes for immediate use.
*/
/* eslint-disable */
'use strict';

const fs = require('fs-extra');
const yaml = require('js-yaml');
const URL = require('url');
const connectionProfile = require('./Org1.json');

class SmartContractUtil {
    static async getConnectionProfile() {
        return connectionProfile;
    }

    static async submitTransaction(contractName, functionName, args, gateway) {
        // Submit transaction
        const network = await gateway.getNetwork('mychannel');
        let contract;
        if (contractName !== '') {
            contract = await network.getContract('chaincode', contractName);
        } else {
            contract = await network.getContract('chaincode');
        }
        const responseBuffer = await contract.submitTransaction(functionName, ...args);
        return responseBuffer;
    }

    // Checks if URL is localhost
    static isLocalhostURL(url) {
        const parsedURL = URL.parse(url);
        const localhosts = [
            'localhost',
            '127.0.0.1'
        ];
        return localhosts.indexOf(parsedURL.hostname) !== -1;
    }

    // Used for determining whether to use discovery
    static hasLocalhostURLs(connectionProfile) {
        const urls = [];
        for (const nodeType of ['orderers', 'peers', 'certificateAuthorities']) {
            if (!connectionProfile[nodeType]) {
                continue;
            }
            const nodes = connectionProfile[nodeType];
            for (const nodeName in nodes) {
                if (!nodes[nodeName].url) {
                    continue;
                }
                urls.push(nodes[nodeName].url);
            }
        }
        return urls.some((url) => this.isLocalhostURL(url));
    }
}

module.exports = SmartContractUtil;
