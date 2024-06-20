import { json } from 'express';
import { JsonToGql } from './jsonToGql';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sample = require('../../assets/config_utxo.json');

const scalarStr = `scalar JSON`;
const enumsStr = `enum tokenStatus {
\tOK
\tFORWARDED
}`;
const registriesStr = `type utxo {
\tid: String!
\townerId: String!
\tamount: Float!
}
type stxo {
\tid: String!
\townerId: String!
\tamount: Float!
}
type transferDetails {
\tid: String!
\tsenderId: String
\treceiverId: String!
\tamount: Float!
\tcreationDate: String!
\tstxos: [String]
\tutxos: [String]
}`;
const queriesStr = `type QueryOutput {
\trecords: [JSON]
\tfetched_records_count: Float
\tbookmark: String
}
type Query {
\treadAsset_utxo(id: String!, ownerId: String!): utxo
\treadAsset_stxo(id: String!, ownerId: String!): stxo
\treadAsset_transferDetails(id: String!): transferDetails
\tqueryWalletContent(ownerId: String!): QueryOutput
\tqueryInboundTransactions(receiverId: String!): QueryOutput
\tqueryOutboundTransactions(senderId: String!): QueryOutput
}`;
const transactionsStr = `type Mutation {
\tcreateAsset_utxo(id: String!, ownerId: String!, amount: Float!): utxo
\tupdateAsset_utxo(id: String!, ownerId: String!, amount: Float!): utxo
\tdeleteAsset_utxo(id: String!, ownerId: String!): utxo
\tcreateAsset_stxo(id: String!, ownerId: String!, amount: Float!): stxo
\tupdateAsset_stxo(id: String!, ownerId: String!, amount: Float!): stxo
\tdeleteAsset_stxo(id: String!, ownerId: String!): stxo
\tcreateAsset_transferDetails(id: String!, senderId: String, receiverId: String!, amount: Float!, creationDate: String!, stxos: [String], utxos: [String]): transferDetails
\tupdateAsset_transferDetails(id: String!, senderId: String, receiverId: String!, amount: Float!, creationDate: String!, stxos: [String], utxos: [String]): transferDetails
\tdeleteAsset_transferDetails(id: String!): transferDetails
\tcreateTokens(ownerId: String!, amount: Float!, depositId: String!, creationDate: String): [JSON]
\ttransferTokens(senderId: String!, receiverId: String!, amount: Float!, transferId: String!, creationDate: String): [JSON]
}`;

describe('jsonToGql', () => {
  test.only('query with input type', () => {
    const expected = `${scalarStr}
${enumsStr}
${registriesStr}
${queriesStr}
${transactionsStr}`;
    const parser = new JsonToGql(sample as any);
    const result = parser.parse();
    expect(result).toEqual(expected);
  });
});
