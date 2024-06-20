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
    queryLedger, customQuery, queryWithPartialKey, queryTest
} = require('../../../src/utils/query');
const { model } = require('./model');
chai.should();
chai.use(chaiAsPromised);
chai.use(chaiExclude);
chai.use(sinonChai);

const { iteratorToList, getQueryResultAsList } = queryTest;
describe('[Unit Suite] Query', async () => {
    let stub;
    beforeEach(() => {
        stub = sinon.createStubInstance(ChaincodeStub);
        stub.model = model;
    });

    describe('[Unit test] iteratorToList', async () => {
        const item = { id: 'thing_1', ownerId: 'bob', amount: 3, docType: 'token' };
        const iterator = [{ value: JSON.stringify(item) }][Symbol.iterator]();
            
        beforeEach(() => {
            stub.getQueryResultWithPagination.returns({ iterator, metadata: {} });
        })
        it('Should transform an iterator to a list of values', async () => {
            const expectedList = [item];
            
            const list = await iteratorToList(iterator);
            expect(list).to.eql(expectedList);
        });
    });

    describe('[Unit test] getQueryResultsAsList', async () => {
        const item = { id: 'thing_1', ownerId: 'bob', amount: 3, docType: 'token' };
        const iterator = [{ value: JSON.stringify(item) }][Symbol.iterator]();
        const query = { selector: { docType: 'transferDetails', receiverId: 'bob' }}
            
        beforeEach(() => {
            stub.getQueryResultWithPagination
                .withArgs(JSON.stringify(query), 50, undefined)
                .returns({ iterator, metadata: {} });
        })
        it('Should return a list of values', async () => {
            const expectedList = [item];
            
            const { records, metadata } = await getQueryResultAsList(stub, query);
            expect(records).to.eql(expectedList);
        });
    });

    describe('[Unit test] customQuery', async () => {
        const item = { id: 'thing_1', ownerId: 'bob', amount: 3, docType: 'token' };
        const iterator = [{ value: JSON.stringify(item) }][Symbol.iterator]();
        const query = { selector: { docType: 'transferDetails', receiverId: 'bob' }}
            
        beforeEach(() => {
            stub.getQueryResultWithPagination
                .withArgs(JSON.stringify(query), 50, undefined)
                .returns({ iterator, metadata: {} });
        })
        it('Should process a custom query', async () => {
            const expectedList = [item];
            
            const { records, metadata } = await customQuery(stub, query);
            expect(records).to.eql(expectedList);
        });
    });

    describe('[Unit test] queryWithPartialKey', async () => {
        const ownerId = 'bob';
        const item = { id: 'thing_1', ownerId, amount: 3, docType: 'token' };
            
        beforeEach(() => {
            stub.splitCompositeKey.withArgs('partialKey').returns({ objectType: 'token', attributes: [ownerId] });
            stub.getStateByPartialCompositeKey.withArgs('token', [ownerId]).returns(
                [{ value: JSON.stringify(item) }][Symbol.iterator]())
        })
        it('Should return a list of values', async () => {
            const expectedList = [item];
            const key = 'partialKey';
            
            const keyList = await queryWithPartialKey(stub, key);
            expect(keyList).to.eql(expectedList);
        });
    });

    describe('[Unit test] queryLedger', async () => {
        const item = { id: 'thing_1', ownerId: 'bob', amount: 3, docType: 'token' };
        const iterator = [{ value: JSON.stringify(item) }][Symbol.iterator]();
        const query = { selector: { docType: 'transferDetails', receiverId: 'bob' }}
            
        beforeEach(() => {
            stub.getQueryResultWithPagination
                .withArgs(JSON.stringify(query), 50, undefined)
                .returns({ iterator, metadata: {} });
        })
        it('Should return a list of values', async () => {
            const expectedList = [item];
            const queryDefinition = {
                query: { selector: { docType: 'transferDetails', receiverId: '{customId}' } },
                input: { customId: { type: 'string' } } };
            const args = { customId: 'bob' };
            
            const { records, metadata } = await queryLedger(stub, queryDefinition, args);
            expect(records).to.eql(expectedList);
        });
    });
});