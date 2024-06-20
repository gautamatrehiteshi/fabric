import { JsonToGql } from './jsonToGql';
import { JsonInput, Registry, Concepts, Enums, Registries } from './type';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sample = require('../../assets/config_old.json');

describe('jsonToGql', () => {
  describe('registry', () => {
    test('primitive type', () => {
      const schema = {
        wallet: {
          schema: {
            title: 'Wallet',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              test: {
                type: 'number',
              },
            },
          },
        },
      } as Record<string, Registry>;
      const expected = `type wallet {
\tid: String!
\tname: String!
\ttest: Float!
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('nested object type', () => {
      const schema = {
        wallet: {
          schema: {
            title: 'Wallet',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              deposit: {
                type: 'object',
                properties: {
                  depositId: {
                    type: 'string',
                    subtype: 'ref',
                    resource: 'deposit',
                  },
                  issuerId: {
                    type: 'string',
                    subtype: 'ref',
                    resource: 'member',
                  },
                },
              },
            },
          },
        },
      } as Record<string, Registry>;
      const expected = `type wallet {
\tid: String!
\tdeposit: JSON!
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('optional properties', () => {
      const schema = {
        wallet: {
          description: 'TODO',
          destination: 'state',
          schema: {
            title: 'Wallet',
            type: 'object',
            properties: {
              id: {
                optional: true,
                type: 'string',
              },
            },
          },
        },
      } as Record<string, Registry>;
      const expected = `type wallet {
\tid: String
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('ref to enum', () => {
      const schema = {
        wallet: {
          schema: {
            title: 'Wallet',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              status: {
                type: 'string',
                subtype: 'enum',
                default: 'UTXO_PENDING_STATUS',
                resource: 'TOKEN_STATUS_ENUM',
              },
            },
          },
        },
      } as Record<string, Registry>;
      const expected = `type wallet {
\tid: String!
\tstatus: TOKEN_STATUS_ENUM!
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('ref to type', () => {
      const schema = {
        wallet: {
          schema: {
            title: 'Wallet',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              originId: {
                optional: true,
                type: 'string',
                subtype: 'ref',
                resource: 'token',
              },
            },
          },
        },
      } as Record<string, Registry>;
      const expected = `type wallet {
\tid: String!
\toriginId: String
\toriginId_resolved: token
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('simple array type', () => {
      const schema = {
        member: sample.registries.member,
      } as Record<string, Registry>;

      const expected = `type member {
\tid: String!
\tmemberType: String!
\twalletId: String!
\twalletId_resolved: wallet!
\tcategories: [String]
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('array object type', () => {
      const schema = {
        member: sample.registries.member2
      } as Record<string, Registry>;
      schema.member.schema.properties.categories.item = {
        type: 'object',
        properties: { str: { type: 'string' } },
      };

      const expected = `type member {
\tid: String!
\tmemberType: String!
\twalletId: String!
\twalletId_resolved: wallet!
\tcategories: [JSON]
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);
      expect(result).toEqual(expected);
    });

    test('many types', () => {
      const schema = {
        wallet: sample.registries.wallet,
        transferDetails: sample.registries.transferDetails,
      } as Record<string, Registry>;
      const expected = `type wallet {
\tid: String!
}
type transferDetails {
\tid: String!
\tsenderId: String!
\tsenderId_resolved: member!
\treceiverId: String!
\treceiverId_resolved: member!
\tamount: Float!
\ttransferType: String!
\tcashbackTransactionId: String
\tcashbackTransactionId_resolved: cashback
\tcashbackStatus: String
\tcreationDate: String!
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateRegistries(schema);

      expect(result).toEqual(expected);
    });
  });

  describe('enums', () => {
    test('multiple enums', () => {
      const schema = {
        CASHBACK_STATUS_ENUM: [
          'PENDING_CASHBACK_STATUS',
          'VALID_CASHBACK_STATUS',
          'CANCELED_CASHBACK_STATUS',
        ],
        TRANSFER_TYPE_ENUM: ['CASHBACK', 'DONATION'],
      } as Record<string, string[]>;
      const expected = `enum CASHBACK_STATUS_ENUM {
\tPENDING_CASHBACK_STATUS
\tVALID_CASHBACK_STATUS
\tCANCELED_CASHBACK_STATUS
}
enum TRANSFER_TYPE_ENUM {
\tCASHBACK
\tDONATION
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateEnums(schema);
      expect(result).toEqual(expected);
    });
  });

  describe('concepts', () => {
    test('one concept', () => {
      const schema = {
        milestoneContractItem: {
          type: 'object',
          properties: {
            memberId: {
              type: 'string',
              subtype: 'ref',
              resource: 'member',
            },
            amount: {
              type: 'number',
            },
          },
        },
      } as Concepts;

      const expected = `type milestoneContractItem {
\tmemberId: String!
\tmemberId_resolved: member!
\tamount: Float!
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateConcepts(schema);
      expect(result).toEqual(expected);
    });
  });

  describe('mutation', () => {
    const transactions = {
      issueToken: sample.transactions.issueToken,
      allocateTokens: sample.transactions.allocateTokens,
    };
    const registries = { wallet: sample.registries.wallet, member: sample.registries.member };

    test('mutation with simple input type', () => {
      const expected = `type Mutation {
\tissueToken(patronId: String!, amount: Float!, depositId: String!, creationDate: String!): [JSON]
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateMutations(
        { issueToken: transactions.issueToken },
        {}
      );
      expect(result).toEqual(expected);
    });

    test('mutation with complex input type', () => {
      const expected = `type Mutation {
\tallocateTokens(patronId: String!, allocationId: String!, beneficiaries: [JSON!]): [JSON]
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateMutations(
        { allocateTokens: transactions.allocateTokens },
        {}
      );
      expect(result).toEqual(expected);
    });

    test('mutation with multiple input type', () => {
      const expected = `type Mutation {
\tcreateAsset_wallet(id: String!): wallet
\tupdateAsset_wallet(id: String!): wallet
\tdeleteAsset_wallet(id: String!): wallet
\tcreateAsset_member(id: String!, memberType: String!, walletId: String!, categories: [String]): member
\tupdateAsset_member(id: String!, memberType: String!, walletId: String!, categories: [String]): member
\tdeleteAsset_member(id: String!): member
\tissueToken(patronId: String!, amount: Float!, depositId: String!, creationDate: String!): [JSON]
\tallocateTokens(patronId: String!, allocationId: String!, beneficiaries: [JSON!]): [JSON]
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateMutations(transactions, registries);
      expect(result).toEqual(expected);
    });
  });

  describe('query', () => {
    const queries = {
      queryWalletContent: sample.queries.queryWalletContent,
      queryCashbackTokens: sample.queries.queryCashbackTokens,
    };
    const registries = { wallet: sample.registries.wallet, member: sample.registries.member };

    test('query with input type', () => {
      const expected = `type QueryOutput {
\trecords: [JSON]
\tfetched_records_count: Float
\tbookmark: String
}
type Query {
\treadAsset_wallet(id: String!): wallet
\treadAsset_member(id: String!): member
\tqueryWalletContent(walletId: String!): QueryOutput
\tqueryCashbackTokens(cashback.cashbackTransactionId: String!): QueryOutput
}`;
      const parser = new JsonToGql({} as any);
      const result = parser.generateQueries(queries, registries);
      expect(result).toEqual(expected);
    });
  });
});
