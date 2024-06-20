import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { FabricModuleOptions } from '../fabric/type';
import Dict = NodeJS.Dict;

type EnvKey =
  | 'NODE_ENV'
  | 'JWT_SECRET'
  | 'LOG_LEVEL'
  | 'PORT'
  | 'FABRIC_ADMIN_NAME'
  | 'FABRIC_AFFILIATION'
  | 'FABRIC_MSPID'
  | 'FABRIC_CHANNEL_PROFILE_PATH'
  | 'FABRIC_WALLET_STORE_PATH'
  | 'FABRIC_CHANNEL_NAME'
  | 'FABRIC_CHAINCODE_ID'
  | 'FABRIC_ADMIN_PASSWORD'
  | 'FABRIC_API_USER'
  | 'FABRIC_CA_TLS_PATH'
  | 'FABRIC_CA_URI'
  | 'FABRIC_CA_NAME'
  | 'BLOCKCHAIN_JSON_PATH';

export type EnvConfig = Record<EnvKey, any>;

export type LoggerLevel = 'debug' | 'info' | 'error' | 'warn';

@Injectable()
export class ConfigurationService {
  private readonly envConfig: EnvConfig;

  constructor() {
    const baseSchema: Record<EnvKey, Joi.AnySchema> = {
      NODE_ENV: Joi.string()
        .valid(...['development', 'production', 'test', 'preproduction'])
        .default('development'),
      LOG_LEVEL: Joi.string()
        .valid(...['debug', 'info', 'error', 'warn'])
        .default('info'),
      PORT: Joi.number().default(4000),
      JWT_SECRET: Joi.string().required(),
      FABRIC_ADMIN_NAME: Joi.string().default('admin'),
      FABRIC_AFFILIATION: Joi.string(),
      FABRIC_MSPID: Joi.string().required(),
      FABRIC_CHANNEL_PROFILE_PATH: Joi.string().default('./'),
      FABRIC_WALLET_STORE_PATH: Joi.string().default('./'),
      FABRIC_CHANNEL_NAME: Joi.string().required(),
      FABRIC_CHAINCODE_ID: Joi.string().required(),
      FABRIC_ADMIN_PASSWORD: Joi.string().required(),
      FABRIC_API_USER: Joi.string().required(),
      FABRIC_CA_TLS_PATH: Joi.string().required(),
      FABRIC_CA_URI: Joi.string().required(),
      FABRIC_CA_NAME: Joi.string().required(),
      BLOCKCHAIN_JSON_PATH: Joi.string().default('./assets/config.json'),
    };

    // merge both schema
    if (!ConfigurationService.isProduction()) {
      const result = dotenv.config({ path: '.env.dev' });
      if (result.error) {
        throw result.error;
      }
    }
    this.envConfig = this.validateInput(baseSchema, process.env);
  }

  get fabricConfiguration(): FabricModuleOptions {
    return {
      adminName: this.get('FABRIC_ADMIN_NAME'),
      affiliation: this.get('FABRIC_AFFILIATION'),
      mspID: this.get('FABRIC_MSPID'),
      adminPassword: this.get('FABRIC_ADMIN_PASSWORD'),
      apiUserName: this.get('FABRIC_API_USER'),
      chainCodeId: this.get('FABRIC_CHAINCODE_ID'),
      channel: {
        name: this.get('FABRIC_CHANNEL_NAME'),
        profilePath: this.get('FABRIC_CHANNEL_PROFILE_PATH'),
      },
      walletStorePath: this.get('FABRIC_WALLET_STORE_PATH'),
      certificateAuthority: {
        TLSPath: this.get('FABRIC_CA_TLS_PATH'),
        uri: this.get('FABRIC_CA_URI'),
        name: this.get('FABRIC_CA_NAME'),
      },
    };
  }

  get env() {
    return this.get('NODE_ENV');
  }

  get webPort(): number {
    return Number(this.get('PORT'));
  }

  get jwtSecret() {
    return this.get('JWT_SECRET');
  }

  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  static isTest() {
    return process.env.NODE_ENV === 'test';
  }

  get logLevel(): LoggerLevel {
    return this.get('LOG_LEVEL') as LoggerLevel;
  }

  get(key: EnvKey): string {
    return this.envConfig[key];
  }

  get blockchainConfigFilePath(): string {
    return this.get('BLOCKCHAIN_JSON_PATH');
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(
    schema: Record<EnvKey, Joi.AnySchema>,
    envConfig: Dict<string>,
  ): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object(schema).options({
      stripUnknown: true,
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig,
    );
    if (error) {
      console.error(`Config validation error: ${error.message}`);
      // throw is catch on service creation
      process.exit(1);
    }
    return validatedEnvConfig as EnvConfig;
  }
}
