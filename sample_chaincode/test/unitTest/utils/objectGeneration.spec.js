const { ChaincodeStub } = require('fabric-shim');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiExclude = require('chai-exclude');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { expect, assert } = require('chai');
const { REGISTRY } = require('../../../src/models/modelConstants');
const { ERRORS } = require('../../../src/utils/errors');
const { TYPE } = require('../../../src/utils/constants');
const {
    generateQuery
} = require('../../../src/utils/objectGeneration');
const { model } = require('./model');
chai.should();
chai.use(chaiAsPromised);
chai.use(chaiExclude);
chai.use(sinonChai);

describe('[Unit Suite] Object generation', async () => {
    const ownerId = 'bob', owner2 = 'joe', amount = 1, amount2 = 2, amount3 = 3, id = 'token1', id2 = 'token2', key = 'key1', key2 = 'key2', key3 = 'key3';

    let stub;
    beforeEach(() => {
        stub = sinon.createStubInstance(ChaincodeStub);
        stub.model = model;
    });

    describe('[Unit test] Query generation', async () => {
        it('Should generate a query without any arguments', async () => {
            const querySelector = { selector: { docType: REGISTRY.transferDetails } };
            const args = {};
            
            const query = await generateQuery(stub, querySelector, args);
            expect(query).to.eql(querySelector);
        });
        it('Should generate a query with arguments', async () => {
            const querySelector = { selector: { docType: REGISTRY.token, ownerId: '{ownerId}' } };
            args = { ownerId: 'bob' }
            const expected = { selector: { docType: REGISTRY.token, ownerId: 'bob' } };
            
            const query = await generateQuery(stub, querySelector, args);
            expect(query).to.eql(expected);
        });
        it('Should generate a query with complexe arguments', async () => {
            const querySelector = { selector: { docType: REGISTRY.token, amount: { '$eq': '{amount}' } } };
            args = { 'amount': 0 }
            const expected = { selector: { docType: REGISTRY.token, amount: { '$eq': 0 } } };
            
            const query = await generateQuery(stub, querySelector, args);
            expect(query).to.eql(expected);
        });
        it('Should generate a query with multiple complex arguments', async () => {
            const querySelector = { selector: { 
                docType: REGISTRY.token, amount: { '$eq': '{amount}' }, ownerId: '{ownerId}'
            } };
            args = { 'amount': 0, ownerId: 'bob' }
            const expected = { selector: { docType: REGISTRY.token, amount: { '$eq': 0 }, ownerId: 'bob' } };
            
            const query = await generateQuery(stub, querySelector, args);
            expect(query).to.eql(expected);
        });
    });
});