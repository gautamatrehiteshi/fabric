import { Injectable, Logger } from '@nestjs/common';
import { FabricConnectService } from './connection.service';

@Injectable()
export class InvokeService {
  readonly logger = new Logger(InvokeService.name);

  constructor(private readonly connect: FabricConnectService) {}

  async invokeChaincode(fcn: string, args: string[]) {
    const contract = await this.connect.getContract();
    try {
      const result: Buffer = await contract.submitTransaction(
        fcn,
        args[0],
        args[1],
      );
      this.logger.log(
        `Transaction '${fcn}(\n\t${args[0]},\n\t${args[1]}\n)' returned:\n${result.toString()}`,
      );
      return JSON.parse(result.toString());
    } catch (error) {
      throw new Error(`Failed to evaluate transaction: ${error}`);
    } /* finally {
      await this.auth.stopGateway(gateway);
    } */
  }
}
