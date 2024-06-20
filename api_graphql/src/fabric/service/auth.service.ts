import { Inject, Injectable, Logger } from '@nestjs/common';
import { FileSystemWallet, Identity, X509WalletMixin } from 'fabric-network';
import * as FabricCAServices from 'fabric-ca-client';
import { FABRIC_MODULE_OPTIONS, FabricModuleOptions } from '../type';

@Injectable()
export class FabricAuthService {
  readonly logger = new Logger(FabricAuthService.name);

  private _wallet: FileSystemWallet;

  constructor(
    @Inject(FABRIC_MODULE_OPTIONS)
    private readonly options: FabricModuleOptions,
  ) {}

  // Create a wallet backed by the provided file system directory
  // A Wallet stores identity information for use when connecting a Gateway.
  // The wallet is backed by a store that handles persistence of identity information
  async getWallet(): Promise<FileSystemWallet> {
    if (this._wallet) {
      return this._wallet;
    }
    this.logger.log(`Creating wallet ${this.options.walletStorePath}`);
    this._wallet = await new FileSystemWallet(this.options.walletStorePath);
    return this._wallet;
  }

  async checkIdentity(name: string): Promise<boolean> {
    const wallet = await this.getWallet();
    const exists = await wallet.exists(name);
    if (exists) {
      return true;
    }
    this.logger.log(`No identity found for user "${name}".`);
    return false;
  }

  async getUser(userName: string) {
    const wallet = await this.getWallet();
    const identity: Identity = await wallet.export(userName);
    // const provider = wallet.getProviderRegistry().getProvider(identity.type);
    // return provider.getUserContext(identity, userName);
    return identity;
  }

  async addIdentity(
    userName: string,
    enrollment: FabricCAServices.IEnrollResponse,
  ) {
    const wallet = await this.getWallet();
    this.logger.log(`Creating ${userName} for ${this.options.mspID}`);
    const x509Identity = this.createX509Identity(enrollment);
    await wallet.import(userName, x509Identity);
  }

  private createX509Identity(
    enrollment: FabricCAServices.IEnrollResponse,
  ): Identity {
    const userIdentity = X509WalletMixin.createIdentity(
      this.options.mspID,
      enrollment.certificate,
      enrollment.key.toBytes(),
    );
    return userIdentity;
  }
}
