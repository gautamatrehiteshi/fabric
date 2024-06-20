import { Injectable, Logger } from '@nestjs/common';
import {
  createLogger,
  format,
  Logger as WinstonLogger,
  transports,
} from 'winston';
import morgan from 'morgan';
import { Request, Response } from 'express';
import { ConfigurationService } from '../configuration.service';

@Injectable()
export class AppLogger extends Logger {
  private winstonLogger: WinstonLogger;

  constructor(private readonly confService: ConfigurationService) {
    super();
    const errorStackFormat = format((info) => {
      if (info.stack) {
        // eslint-disable-next-line no-param-reassign
        info.message = `${info.message} ${info.stack}`;
      }
      return info;
    });

    this.winstonLogger = createLogger({
      level: this.confService.logLevel,
      format: format.combine(
        errorStackFormat(),
        format.colorize(),
        format.simple(),
      ),
      transports: [new transports.Console({ handleExceptions: true })],
      exitOnError: false,
    });
  }

  get morganOption(): morgan.Options<Request, Response> {
    return {
      stream: {
        write: (message: string) => this.log(message.trim()),
      },
      skip: (req: Request, res: Response) => {
        return req.originalUrl.includes('ping') || res.statusCode < 400;
      },
    };
  }

  error(message: string, trace: string, context?: string) {
    this.winstonLogger.error(this.addContext(context, message), trace);
  }

  log(message: any, context?: string) {
    this.winstonLogger.info(this.addContext(context, message));
  }

  warn(message: any, context?: string) {
    this.winstonLogger.warn(this.addContext(context, message));
  }

  debug(message: string, context?: string) {
    this.winstonLogger.debug(this.addContext(context, message));
  }

  verbose(message: string, context?: string) {
    this.winstonLogger.verbose(this.addContext(context, message));
  }

  private addContext = (scope: string | undefined, message: string): string => {
    const now = new Date().toISOString();
    return scope
      ? `${now} [\x1b[33m${scope}\x1b[0m] ${message}`
      : `${now} ${message}`;
  };
}
