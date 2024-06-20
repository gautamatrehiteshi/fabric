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
    isCorrectType, initKey, initPartialKey, splitKey, typeCheckTest
} = require('../../../src/utils/typeCheck');
const { model } = require('./model');
chai.should();
chai.use(chaiAsPromised);
chai.use(chaiExclude);
chai.use(sinonChai);

const {
    checkNaturalType, checkEnumType, checkReferenceType, checkLinkedReference, 
    checkObjectType, checkArrayType, checkMapType, checkRegularObject, 
} = typeCheckTest;
describe('[Unit Suite] Object generation', async () => {
    let stub;
    beforeEach(() => {
        stub = sinon.createStubInstance(ChaincodeStub);
        stub.model = model;
    });

    describe('[Unit test] checkRegularObject', async () => {
        it('Should not throw for a valid object', async () => {
            const asset = { ownerId: 'bob' };
            const schema = { type: 'object', properties: { ownerId: { type: TYPE.string } } };
            const linkedAssets = [];   
            try {
                await checkRegularObject(stub, asset, schema, linkedAssets);
            } catch (e) {
                expect(e).to.eql(true);
            }
        });
        it('Should not throw for a valid complexe object', async () => {
            const asset = { owner: { ownerId: 'bob' } };
            const schema = { type: 'object', properties: { 
                owner: { type: 'object', properties: { ownerId: { type: TYPE.string}} } 
            } };
            const linkedAssets = [];
            try {
                await checkRegularObject(stub, asset, schema, linkedAssets);
            } catch (e) {
                expect(e).to.eql(true);
            }
        });
        it('Should throw if an expected property is missing', async () => {
            const asset = { owner: { ownerId: 'bob' } };
            const schema = { type: 'object', properties: { 
                owner: { type: 'object', properties: { ownerId: { type: TYPE.string}} } 
            } };
            const linkedAssets = [];
            try {
                await checkRegularObject(stub, asset, schema, linkedAssets);
            } catch (e) {
                expect(e).to.eql(true);
            }
        });
    });
});
// Required property missing: amount in <undefined>