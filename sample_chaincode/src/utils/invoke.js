const { isCorrectType } = require('./typeCheck');
const { initObject } = require('./objectGeneration');
const { processOperations } = require('./operations');
const { queryLedger, customQuery } = require('./query');
const CRUD = require('./crud');

async function invokeQuery(stub, params, qryDefinition, bookmark, pageSize) {
    const logger = stub.newLogger('invokeQuery');
    const input = JSON.parse(params);
    const arg = initObject(stub.model, input, qryDefinition.input);
    logger.info(`Querying with ${arg}`);
    await isCorrectType(stub, arg, qryDefinition.input);

    const payload = await queryLedger(stub, qryDefinition, arg, bookmark, pageSize);
    return payload;
}
async function invokeCustomQuery(stub, param, bookmark, pageSize) {
    const qry = JSON.parse(param);
    const payload = await customQuery(stub, qry, bookmark, pageSize);
    return payload;
}

async function invokeTransaction(stub, params, transaction, mutationDefinition) {
    const input = JSON.parse(params);
    const arg = initObject(stub.model, input, mutationDefinition.input);
    await isCorrectType(stub, arg, mutationDefinition.input);
    const operations = await transaction(stub, arg);
    const payload = await processOperations(stub, operations);
    return payload;
}

async function invokeCrud(stub, params, methodName) {
    const method = CRUD[methodName];
    // special case for processOperations
    if (methodName === 'processOperations') {
        if (params.length !== 1) {
            const errorMsg = `Incorrect number of arguments. Expecting [{operation, registry, payload}], received ${params}.`;
            throw new Error(errorMsg);
            // return shim.success(Buffer.from(errorMsg));
        }
        const payload = await method(stub, JSON.parse(params[0]));
        return payload;
    }

    //* hacky quick fix => remove once API is up to date
    if (params.length !== 2) {
        if (methodName === 'readAll') {
            const payload = await method(stub, 'utxo', JSON.parse(params[0]));
            return payload;
        }
        const errorMsg = `Incorrect number of arguments. Expecting [assetType, payload], received ${params}.`;
        throw new Error(errorMsg);
        // return shim.error(Buffer.from(errorMsg));
    }
    //*/
    // TODO remove array from args...
    const payload = await method(stub, params[0], JSON.parse(params[1]));

    return payload;
}

async function invokeCrudSurcharge(stub, params, surchageMethod) {
    const operations = await surchageMethod(
        stub,
        JSON.parse(params[1]),
        params[0]
    );
    const payload = await processOperations(stub, operations, stub.model);
    return payload;
}

exports.invokeQuery = invokeQuery;
exports.invokeCustomQuery = invokeCustomQuery;
exports.invokeTransaction = invokeTransaction;
exports.invokeCrud = invokeCrud;
exports.invokeCrudSurcharge = invokeCrudSurcharge;