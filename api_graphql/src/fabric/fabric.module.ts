import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { FabricAuthService } from './service/auth.service';
import { FabricConnectService } from './service/connection.service';
import { InvokeService } from './service/invoke.service';
import { QueryService } from './service/query.service';
import { RegisterService } from './service/register.service';
import {
  FABRIC_MODULE_OPTIONS,
  FabricModuleAsyncOptions,
  FabricModuleOptions,
  FabricOptionsFactory,
} from './type';

@Module({
  providers: [
    FabricAuthService,
    FabricConnectService,
    InvokeService,
    QueryService,
    RegisterService,
  ],
  exports: [InvokeService, QueryService, RegisterService],
})
export class FabricModule {
  static logger = new Logger(FabricModule.name);

  static register(options: FabricModuleOptions): DynamicModule {
    return {
      module: FabricModule,
      providers: FabricModule.createFabricProvider(options),
    };
  }

  static registerAsync(options: FabricModuleAsyncOptions): DynamicModule {
    return {
      module: FabricModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(
    options: FabricModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: FabricModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: FABRIC_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: FABRIC_MODULE_OPTIONS,
      useFactory: async (optionsFactory: FabricOptionsFactory) =>
        optionsFactory.createFabricOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }

  static createFabricProvider(options: FabricModuleOptions): any[] {
    return [{ provide: FABRIC_MODULE_OPTIONS, useValue: options || {} }];
  }
}
