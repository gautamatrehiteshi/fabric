import { ModuleMetadata, Type } from '@nestjs/common';

export const FABRIC_MODULE_OPTIONS = 'FABRIC_MODULE_OPTIONS';

export interface FabricModuleOptions {
  adminName: string;
  adminPassword: string;
  certificateAuthority: {
    TLSPath: string;
    name: string;
    uri: string; // should contain port
  };
  apiUserName: string;
  channel: {
    name: string;
    profilePath: string;
  };
  chainCodeId: string;
  walletStorePath: string;
  mspID: string;
  affiliation?: string;
}

export interface FabricOptionsFactory {
  createFabricOptions(): Promise<FabricModuleOptions> | FabricModuleOptions;
}

export interface FabricModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<FabricOptionsFactory>;
  useClass?: Type<FabricOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<FabricModuleOptions> | FabricModuleOptions;
  inject?: any[];
}
