import { Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { join } from 'path';
import { ApolloServer } from 'apollo-server-express';
import {
  addResolversToSchema,
  loadSchemaSync,
  GraphQLFileLoader,
  IResolvers,
} from 'graphql-tools';
import { GraphQLError } from 'graphql';
import { first } from 'lodash';
import { QueryService } from '../fabric/service/query.service';
import { InvokeService } from '../fabric/service/invoke.service';
import { FabricModule } from '../fabric/fabric.module';
import { ConfigurationService } from '../core/configuration.service';
import { JsonToGql } from '../jsonToGql/jsonToGql';
import { getFileContent, saveFileContent } from '../utils/file.utils';
import { ResolverFactory } from './resolver-factory';
import { RegisterService } from '../fabric/service/register.service';

@Module({
  imports: [
    FabricModule.registerAsync({
      inject: [ConfigurationService],
      useFactory: (configuration: ConfigurationService) =>
        configuration.fabricConfiguration,
    }),
  ],
})
export class GraphqlModule implements OnModuleInit, OnModuleDestroy {
  private _apolloServer: ApolloServer;

  private logger = new Logger(GraphqlModule.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly queryService: QueryService,
    private readonly invokeService: InvokeService,
    private readonly register: RegisterService,
    private readonly configurationService: ConfigurationService,
  ) {}

  async onModuleInit() {
    if (!this.httpAdapterHost) {
      return;
    }
    const { httpAdapter } = this.httpAdapterHost;
    if (!httpAdapter) {
      return;
    }

    // register the api to talk with the blockchain
    await this.register.registerApi();

    // transform fabric json into graphql schema
    const jsonContent = JSON.parse(
      await getFileContent(this.configurationService.blockchainConfigFilePath),
    );
    const generatedFilePath = join(process.cwd(), 'generated.gql');
    const parser = new JsonToGql(jsonContent);
    await saveFileContent(generatedFilePath, parser.parse());
    this.logger.log(`Blockchain model saved.`);

    const builder = new ResolverFactory(this.queryService, this.invokeService);
    const resolvers = builder.generate(
      parser.queriesMeta,
      parser.mutationsMeta,
    );
    this.logger.log(`Resolvers generated.`);

    await this.registerGqlServer({
      path: generatedFilePath,
      resolvers,
    });
  }

  async onModuleDestroy() {
    await this._apolloServer?.stop();
  }

  private async registerGqlServer(option: {
    path: string;
    resolvers: IResolvers;
  }) {
    const app = this.httpAdapterHost.httpAdapter.getInstance();
    const schema = loadSchemaSync(option.path, {
      loaders: [new GraphQLFileLoader()],
    });
    const schemaWithResolvers = addResolversToSchema({
      schema,
      resolvers: option.resolvers,
    });
    const apolloServer = new ApolloServer({
      schema: schemaWithResolvers,
      debug: !ConfigurationService.isProduction(),
      context: ({ req }: any) => {
        return {
          req,
          user: req.user,
        };
      },
      formatError: (error: GraphQLError) => {
        if (error instanceof GraphQLError) {
          const errorToLog = error.originalError || (error as Error);
          const graphqlQueryPath = first(error.path);
          this.logger.error(graphqlQueryPath, errorToLog as any);
        }
        return error;
      },
    });

    apolloServer.applyMiddleware({
      app,
      path: '/graphql',
      // disableHealthCheck,
      // onHealthCheck,
      // cors,
      // bodyParserConfig,
    });

    this._apolloServer = apolloServer;
  }
}
