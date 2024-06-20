import { readFileSync } from 'fs';
import { Contract, Gateway, FileSystemWallet } from 'fabric-network';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { FABRIC_MODULE_OPTIONS, FabricModuleOptions } from '../type';
import { FabricAuthService } from './auth.service';

@Injectable()
export class FabricConnectService {
  readonly logger = new Logger(FabricConnectService.name);

  private readonly connectionProfile: Record<string, unknown>;

  private gateway: Gateway;

  private contract: Contract;

  constructor(
    @Inject(FABRIC_MODULE_OPTIONS)
    private readonly options: FabricModuleOptions,
    private readonly authService: FabricAuthService,
  ) {
    // network.json
    this.connectionProfile = JSON.parse(
      readFileSync(this.options.channel.profilePath, 'utf8'),
    );
  }

  async getContract() {
    if (this.contract) {
      return this.contract;
    }
    const gateway = await this.getGateway();
    const network = await gateway.getNetwork(this.options.channel.name);
    this.contract = await network.getContract(this.options.chainCodeId);
    return this.contract;
  }

  private async getGateway(): Promise<Gateway> {
    if (this.gateway) {
      return this.gateway;
    }
    const isValid = await this.authService.checkIdentity(
      this.options.apiUserName,
    );
    if (!isValid) {
      this.logger.log(`No api user found, using admin`);
      const wallet = await this.authService.getWallet();
      const gateway = await this.connectGateway(wallet, this.options.adminName);
      return gateway;
    }
    const wallet = await this.authService.getWallet();

    this.gateway = await this.connectGateway(wallet, this.options.apiUserName);
    return this.gateway;
  }

  private async connectGateway(
    wallet: FileSystemWallet,
    user: string,
  ): Promise<Gateway> {
    try {
      // The gateway peer provides the connection point for an application to access the Fabric network
      const gateway = new Gateway();
      await gateway.connect(this.connectionProfile, {
        wallet,
        identity: user,
        discovery: { enabled: true, asLocalhost: false },
      });
      return gateway;
    } catch (error) {
      throw new Error(`Failed connect to the gateway: ${error}`);
    }
  }

  public async disconnectGateway() {
    await this.gateway?.disconnect();
  }

  public async getAdmin() {
    this.logger.log(`Retrieving gateway`);
    const gateway = await this.getGateway();
    this.logger.log(`Retrieving admin`);
    const adminIdentity = gateway.getCurrentIdentity();
    return adminIdentity;
  }
}
