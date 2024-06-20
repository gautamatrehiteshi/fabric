/* eslint-disable */

'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require('chai');
const chaiExclude = require('chai-exclude');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { REGISTRY } = require('../../src/models/modelConstants');

chai.should();
chai.use(chaiHttp);
chai.use(chaiExclude);
chai.use(chaiAsPromised);
chai.use(sinonChai);

function rdmInt(max = 999999999) {
    return Math.floor(Math.random() * max);
}
function bufferToObject(buffer) {
    return JSON.parse(buffer)
}
function submitTransaction(endpoint, payload) {
    return chai.request('api0:4000').post(endpoint).send(payload);
}

const BlockchainErrorMessage = `Error querying chaincode: \nFailed to evaluate transaction: ` +
    `Error: No valid responses from any peers. ` +
    `Errors:\n    ` +
    `peer=peer0.org1.chaincode:7051, status=500, message=transaction returned with failure: `;

const runtime = rdmInt()
describe('Functional test: token lifecycle', () => {
    const receiverId = 'receiver_' + runtime, senderId = 'sender_' + runtime,
        amount = 35, creationDate = 'today_' + runtime,
        depositId = 'deposit_' + runtime, transferId = 'transfer_' + runtime;

    describe('createTokens', async () => {
        const endpoint = '/fabric/tokens/createTokens/invoke';

        it('Should not issue tokens if there are missing properties', async () => {
            const input = { ownerId: receiverId, depositId };
            const response = await submitTransaction(endpoint, input);
            expect(response.status).to.eql(500);
            expect(response.body.message).to.eql(BlockchainErrorMessage +
                `Required property missing: amount`);
        });

        it('Should not issue tokens if properties are the wrong types', async () => {
            const input = { ownerId: amount, amount, depositId, creationDate };
            const response = await submitTransaction(endpoint, input);
            expect(response.status).to.eql(500);
            expect(response.body.message).to.eql(BlockchainErrorMessage +
                `Expecting ${amount} to be of type string`);
        });

        it('Should create tokens', async () => {
            const input = { ownerId: senderId, amount, depositId, creationDate };
            const token = {
                id: depositId,
                docType: REGISTRY.token,
                ownerId: senderId,
                amount
            };
            const transferDetails = {
                id: depositId,
                docType: REGISTRY.transferDetails,
                senderId,
                receiverId: senderId,
                amount,
                creationDate,
                utxos: [depositId]
            }

            const response = await submitTransaction(endpoint, input);
            expect(response.status).to.eql(201);
            expect(response.body.length).to.eql(2);
            expect(response.body).to.eql([token, transferDetails]);
        });
    });

    describe('transferTokens', async () => {
        const endpoint = '/fabric/tokens/transferTokens/invoke';

        it('Should not issue tokens if there are missing properties', async () => {
            const input = { senderId, receiverId, transferId, creationDate };
            const response = await submitTransaction(endpoint, input);
            expect(response.status).to.eql(500);
            expect(response.body.message).to.eql(BlockchainErrorMessage +
                `Required property missing: amount`);
        });

        it('Should not issue tokens if there is a negative amount', async () => {
            const input = { senderId, receiverId, transferId, amount: -12, creationDate };
            const response = await submitTransaction(endpoint, input);
            expect(response.status).to.eql(500);
            expect(response.body.message).to.eql(BlockchainErrorMessage +
                'Amount of tokens transfered should be strictly positive.');
        });

        it('Should not issue tokens if there aren\'t enough tokens', async () => {
            const amountAsked = 50;
            const input = { senderId, receiverId, transferId, amount: amountAsked, creationDate };
            const response = await submitTransaction(endpoint, input);
            expect(response.status).to.eql(500);
            expect(response.body.message).to.eql(BlockchainErrorMessage +
                `Cannot send ${amountAsked}. ${senderId} only has ${amount} tokens available.`);
        });

        it('Should transfer tokens', async () => {
            const input = { senderId, receiverId, transferId, amount, creationDate };
            const res = await submitTransaction(endpoint, input);
            expect(res.status).to.eql(201);

            const transferDetailQuery = await submitTransaction('/fabric/transferDetails/readAsset/query', { id: transferId });
            const td = transferDetailQuery.body;
            expect(td).to.own.include({
                docType: REGISTRY.transferDetails,
                id: transferId,
                senderId,
                receiverId,
                amount,
                creationDate,
            });
            expect(td.stxos).to.eql([depositId]);
            expect(td.utxos.length).to.eql(1);
        });
    });

    describe('queryTokens', async () => {
        it('Should query tokens with readAll or custom query', async () => {
            const queryEndpoint = '/fabric/tokens/queryWalletContent/query';
            const readAllEndpoint = '/fabric/utxo/readAll/query';
            const queryInput = { ownerId: receiverId };
            const res = await submitTransaction(queryEndpoint, queryInput);
            const readAll = await submitTransaction(readAllEndpoint, queryInput);
            expect(res.body.records).to.eql(readAll.body);
        });

        it('Should query correct token amount for receiver with custom query', async () => {
            const queryEndpoint = '/fabric/tokens/queryWalletContent/query';
            const queryInput = { ownerId: receiverId };
            const res = await submitTransaction(queryEndpoint, queryInput);
            expect(
                res.body.records.reduce((acc, record) => (record.amount + acc), 0)
            ).to.eql(amount);
        });

        it('Should query correct token amount for receiver with custom query', async () => {
            const readAllEndpoint = '/fabric/utxo/readAll/query';
            const queryInput = { ownerId: receiverId };
            const res = await submitTransaction(readAllEndpoint, queryInput);
            expect(
                res.body.reduce((acc, record) => (record.amount + acc), 0)
            ).to.eql(amount);
        });

        it('Should query correct token amount for sender with custom query', async () => {
            const queryEndpoint = '/fabric/tokens/queryWalletContent/query';
            const queryInput = { ownerId: senderId };
            const res = await submitTransaction(queryEndpoint, queryInput);
            expect(
                res.body.records.reduce((acc, record) => (record.amount + acc), 0)
            ).to.eql(0);
        });

        it('Should query correct token amount for sender with custom query', async () => {
            const readAllEndpoint = '/fabric/utxo/readAll/query';
            const queryInput = { ownerId: senderId };
            const res = await submitTransaction(readAllEndpoint, queryInput);
            const td = await submitTransaction('/fabric/transferDetails/readAsset/query', { id: transferId });
            // console.log(td.body)
            expect(
                res.body.reduce((acc, record) => (record.amount + acc), 0)
            ).to.eql(0);
        });
    });
});
