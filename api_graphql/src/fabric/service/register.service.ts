import { Inject, Injectable, Logger } from '@nestjs/common';
import FabricCAServices from 'fabric-ca-client';
import { FABRIC_MODULE_OPTIONS, FabricModuleOptions } from '../type';
import { FabricConnectService } from './connection.service';
import { FabricAuthService } from './auth.service';

@Injectable()
export class RegisterService {
  readonly logger = new Logger(RegisterService.name);

  private fabricCAServices: FabricCAServices;

  constructor(
    @Inject(FABRIC_MODULE_OPTIONS)
    private readonly options: FabricModuleOptions,
    private readonly connect: FabricConnectService,
    private readonly auth: FabricAuthService,
  ) {
    this.fabricCAServices = this.initFabricCAServices();
  }

  async registerApi(): Promise<void> {
    await this.enrollAdmin(this.options.adminName);
    await this.registerUser(this.options.apiUserName, this.options.adminName);
  }

  private async enrollAdmin(adminName: string): Promise<void> {
    const adminExists = await this.auth.checkIdentity(this.options.adminName);
    if (adminExists) {
      this.logger.warn(
        `The admin ${this.options.adminName} is already registered`,
      );
      return;
    }
    this.logger.log(`Enrolling admin`);
    const enrollment = await this.fabricCAServices.enroll({
      enrollmentID: adminName,
      enrollmentSecret: this.options.adminPassword,
    });
    this.logger.log(`Adding admin to wallet`);
    await this.auth.addIdentity(adminName, enrollment);
    this.logger.log(
      `Successfully enrolled admin user ${adminName} and imported it into the wallet`,
    );
  }

  private async registerUser(userName: string, adminName = 'admin') {
    this.logger.log(`Registering api user: ${userName} (admin: ${adminName})`);
    const userExists = await this.auth.checkIdentity(userName);
    if (userExists) {
      this.logger.warn(`The ${userName} is already registered`);
      return;
    }
    const adminExists = await this.auth.checkIdentity(adminName);
    this.logger.log(`No api user, admin found: ${adminExists}`);
    if (!adminExists) {
      this.logger.error(`The admin ${adminName} isn't registered`);
      return;
    }

    const adminUser = await this.connect.getAdmin();
    this.logger.log(`Retrieved admin user\n${adminUser}`);
    const secret = await this.fabricCAServices.register(
      {
        enrollmentID: userName,
        affiliation: this.options.affiliation || '',
        role: 'client',
      },
      adminUser,
    );
    this.logger.log(`Registered ${userName}, with admin ${adminName}`);
    const enrollment = await this.fabricCAServices.enroll({
      enrollmentID: userName,
      enrollmentSecret: secret,
    });
    this.logger.log(`Enrolled ${userName}, storing it to wallet`);
    await this.auth.addIdentity(userName, enrollment);
    this.logger.log(
      `Successfully enrolled user ${userName} and imported it into the wallet`,
    );
  }

  private get certificateAuthorityUrl() {
    const { certificateAuthority, adminName, adminPassword } = this.options;
    return certificateAuthority.uri.replace(
      '://',
      `://${adminName}:${adminPassword}@`,
    );
  }

  private initFabricCAServices(): FabricCAServices {
    try {
      const caTLSCACerts = Buffer.from([]);
      // Buffer.from(
      //   this.options.certificateAuthority.TLSPath,
      // );
      return new FabricCAServices(
        this.certificateAuthorityUrl,
        {
          trustedRoots: caTLSCACerts,
          verify: false,
        },
        this.options.certificateAuthority.name,
      );
    } catch (error) {
      throw new Error(`Failed to get fabricObject: ${error}`);
    }
  }
}
