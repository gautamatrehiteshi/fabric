import { HttpException, Logger } from '@nestjs/common';
import { IResolvers } from 'graphql-tools';
import { QueryService } from '../fabric/service/query.service';
import { InvokeService } from '../fabric/service/invoke.service';

type OperationMeta = {
  name: string;
  function: string;
  registry: string;
};

export class ResolverFactory {
  private logger = new Logger(ResolverFactory.name);

  constructor(
    private readonly queryService: QueryService,
    private readonly invokeService: InvokeService,
  ) {}

  generate(
    queriesMeta: OperationMeta[],
    mutationsMeta: OperationMeta[],
  ): IResolvers {
    // required the graphql file generated

    const resolvers = {
      Query: {},
      Mutation: {},
    };

    // fieldName: (parent, args, context, info)
    queriesMeta.forEach((queryMeta) => {
      resolvers.Query[queryMeta.name] = async (parent, args, context, info) => {
        const fabricArgs: [string, string] = [
          queryMeta.registry,
          JSON.stringify(args),
        ];
        this.logger.log(
          `Request ledger with fabricArgs: ${JSON.stringify(fabricArgs)}`,
        );
        try {
          return this.queryService.queryChaincode(queryMeta.function, fabricArgs);
          // return JSON.parse(this.decoder.write(result));
        } catch (err) {
          const msg = `Error querying chaincode: \n${err.message}`;
          this.logger.error(msg);
          throw new HttpException(msg, 500);
        }
      };
    });

    mutationsMeta.forEach((mutationMeta) => {
      resolvers.Mutation[mutationMeta.name] = async (
        parent,
        args,
        context,
        info,
      ) => {
        const fabricArgs: [string, string] = [
          mutationMeta.registry,
          JSON.stringify(args),
        ];
        this.logger.log(
          `Mutate ledger with args: ${JSON.stringify(fabricArgs)}`,
        );
        try {
          const transaction = mutationMeta.function;
          this.logger.log(`Resolving ${transaction}`);
          return this.invokeService.invokeChaincode(transaction, fabricArgs);
        } catch (err) {
          const msg = `Error invoking chaincode: \n${err.message}`;
          this.logger.error(msg);
          throw new HttpException(msg, 500);
        }
      };
    });

    return resolvers;
  }
}
