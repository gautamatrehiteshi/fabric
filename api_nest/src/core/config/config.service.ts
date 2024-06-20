import { Injectable } from '@nestjs/common';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { FabricModuleOptions } from '@flexper/nest-fabric';
import { FabricLogger } from '../logger/fabric-logger.service';
export interface EnvConfig {
  [key: string]: string;
}
export type LoggerLevel = 'debug' | 'info' | 'error' | 'warn';
@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };
  constructor() {
    if (!this.isProduction) {
      const result = dotenv.config({ path: '.env.dev' });
      if (result.error) {
        throw result.error;
      }
    }
    this.envConfig = this.validateInput(process.env);
    this.envConfig = this.validateInput(process.env);
  }
  get expressPort(): number {
    return Number(this.envConfig.PORT);
  }
  get logLevel(): LoggerLevel {
    return 'debug';
  }
  get(key: string): string {
    return this.envConfig[key];
  }

  get fabricConfiguration(): FabricModuleOptions {
    return {
      loggerFactory: (context: string) => {
        const logger = new FabricLogger(this.envConfig['LOG_PATH'])
        logger.setContext(context);
        return logger;
      },
      adminName: this.envConfig["ADMIN_NAME"],
      adminPassword: this.envConfig["ADMIN_PWD"],
      certificateAuthority: {
        TLSPath: this.envConfig["CA_TLS_PATH"],
        name: this.envConfig["CA_NAME"],
        address: this.envConfig["CA_ADDRESS"], // should contain port
        protocol: this.envConfig["PROTOCOL"] as any as 'http', // this is is a hack
      },
      affiliation: this.envConfig["AFFILIATION"],
      apiUserName: this.envConfig["API_USER"],
      chainCodeChannelName: this.envConfig["CHAINCODE_CHANNEL"],
      chainCodeChannelProfilePath: this.envConfig["CHAINCODE_CHANNEL_PROFILE_PATH"].toString(),
      chainCodeId: this.envConfig["CHAINCODE_ID"],
      storePath: this.envConfig["STORE_PATH"],
      ORG_MSPID: this.envConfig["ORG_MSPID"]
    };
  }

  get isProduction() {
    return process.env.NODE_ENV === 'production';
  }
  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid(['development', 'production', 'test', 'provision'])
        .default('development'),
      ADMIN_NAME: Joi.string().required(),
      ADMIN_PWD: Joi.string().required(),
      CA_TLS_PATH: Joi.string().default(""),
      CA_NAME: Joi.string().required(),
      CA_ADDRESS: Joi.string().required(),
      PROTOCOL: Joi.string().required(),
      API_USER: Joi.string().required(),
      CHAINCODE_CHANNEL: Joi.string().required(),
      CHAINCODE_CHANNEL_PROFILE_PATH: Joi.string().required(),
      CHAINCODE_ID: Joi.string().required(),
      STORE_PATH: Joi.string().required(),
      ORG_MSPID: Joi.string().required(),
      LOG_PATH: Joi.string().required()
    }).options({ stripUnknown: true });
    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }
}
