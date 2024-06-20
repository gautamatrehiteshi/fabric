const { ChaincodeStub } = require('fabric-shim');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiExclude = require('chai-exclude');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect, assert } = require('chai');
const { ERRORS } = require('../../../src/utils/errors');
const { TYPE } = require('../../../src/utils/constants');
const {
    invokeCrud, invokeCrudSurcharge, invokeTransaction, invokeQuery, invokeCustomQuery
} = require('../../../src/utils/invoke');
const transactions = require('../../../src/lib/_transactions');
const { model } = require('./model');
chai.should();
chai.use(chaiAsPromised);
chai.use(chaiExclude);
chai.use(sinonChai);


describe('[Unit Suite] Invoke functions', async () => {
    const id = 'thing_1', ownerId = 'bob', amount = 3, docType = 'utxo', key = 'key', key2 = 'key2';
    const item = { id, ownerId, amount, docType };
    const query = { selector: { docType: 'transferDetails', receiverId: 'bob' } };
    
    let stub;
    let iterator;
    
    beforeEach(() => {
        iterator = [{ value: JSON.stringify(item) }][Symbol.iterator]();
        stub = sinon.createStubInstance(ChaincodeStub);
        stub.model = model;
    });

    describe('[Unit test] invokeQuery', async () => {
        beforeEach(() => {
            stub.getQueryResultWithPagination
                .withArgs(JSON.stringify(query), 50, undefined)
                .returns({ iterator, metadata: {} });
        })
        it('Should process a query', async () => {
            const expectedList = [item];
            const queryDef = model.queries.queryInboundTransactions;
            const params = JSON.stringify({ receiverId: 'bob' });

            const { records, metadata } = await invokeQuery(stub, params, queryDef);
            expect(records).to.eql(expectedList);
        });
    });
    
    describe('[Unit test] invokeCustomQuery', async () => {
        beforeEach(() => {
            stub.getQueryResultWithPagination
                .withArgs(JSON.stringify(query), 50, undefined)
                .returns({ iterator, metadata: {} });
        })
        it('Should process a custom query', async () => {
            const expectedList = [item];
            const queryDef = JSON.stringify(query);
            const { records, metadata } = await invokeCustomQuery(stub, queryDef);
            expect(records).to.eql(expectedList);
        });
    });
    
    describe('[Unit test] invokeTransaction', async () => {
        beforeEach(() => {
            stub.createCompositeKey.withArgs(docType, [ownerId, id]).returns(key);
            stub.splitCompositeKey.withArgs(key).returns({ objectType: docType, attributes: [ownerId, id] });    
            
            stub.createCompositeKey.withArgs('transferDetails', [id]).returns(key2);
            stub.splitCompositeKey.withArgs(key2).returns({ objectType: 'transferDetails', attributes: [id] });    
            
            stub.getTxTimestamp.returns({ seconds: { low: '1585591067' } });
        })
        it('Should process a transaction', async () => {
            const expectedList = [
                item, 
                { id, receiverId: ownerId, senderId: ownerId, amount, utxos: [id], stxos: [],
                    creationDate: '1585591067', docType: 'transferDetails'}
            ];
            const params = JSON.stringify({ ownerId, amount, depositId: id });
            const transaction = transactions['createTokens'];
            const transactionDef = model.transactions.createTokens;

            const payload = await invokeTransaction(stub, params, transaction, transactionDef);
            expect(payload).to.eql(expectedList);
        });
    });
});