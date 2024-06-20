import { Injectable, Logger } from '@nestjs/common';
import { FabricConnectService } from './connection.service';
import { StringDecoder } from 'string_decoder';

@Injectable()
export class QueryService {
  readonly logger = new Logger(QueryService.name);

  constructor(private readonly connect: FabricConnectService) {}

  async queryChaincode(functionName: string, args: [string, any]) {
    const contract = await this.connect.getContract();
    try {
      const result: Buffer = await contract.evaluateTransaction(
        functionName,
        args[0],
        args[1],
      );
      this.logger.log(
        `Query '${functionName}(\n\t${args[0]},\n\t${args[1]}\n)' succesfully returned ${result.toString()}`,
      );
      return JSON.parse(result.toString());
    } catch (error) {
      throw new Error(`Failed to evaluate query: ${error}`);
    }
  }
}
