import { Injectable, Logger } from '@nestjs/common';
import { createLogger, format, Logger as WinstonLogger, transports } from 'winston';
import * as morgan from 'morgan';
import * as moment from 'moment';

@Injectable()
export class FabricLogger extends Logger {
  private winstonLogger: WinstonLogger;
  private transactionLogger: WinstonLogger;

  constructor(private readonly logFilePath: string) {
    super();

    const errorStackFormat = format((info, opt) => {
      if (info.stack) {
        info.message = `${info.message} ${info.stack}`;
      }
      return info;
    });

    this.winstonLogger = createLogger({
      level: 'debug',
      format: format.combine(
        errorStackFormat(),
        format.simple(),
      ),
      transports: [
        new transports.Console({ handleExceptions: true }),
      ],
      exitOnError: false,
    });

    this.transactionLogger = createLogger({
      level: 'debug',
      format: format.combine(
        errorStackFormat(),
        format.simple(),
      ),
      transports: [
        new transports.Console({ handleExceptions: true }),
        new transports.File({ filename: this.logFilePath })
      ],
      exitOnError: false,
    });
  }

  get stream() {
    return {
      write: (message: string) => Logger.log(message),
    };
  }

  get logDate() {
    const today = new Date();
    const dd = today.getDate();
    const mm = today.getMonth();
    const yyyy = today.getFullYear();
    const currentDate = mm+'-'+dd+'-'+yyyy;

    return String(currentDate);
  }

  get morganOption(): morgan.Options {
    return {
      stream: {
        write: (message: string) => this.log(message.trim()),
      },
      skip: (req, res) => {
        return req.originalUrl.includes('ping');
      },
    };
  }

  debug(message: any, context?: string) {
    this.getLogger(context).debug(this.addContext(context, message));
  }

  error(message: string, trace: string, context?: string) {
    this.getLogger(context).error(this.addContext(context, message), trace);
  }

  log(message: any, context?: string) {
    this.getLogger(context).info(this.addContext(context, message));
  }

  warn(message: any, context?: string) {
    this.getLogger(context).warning(this.addContext(context, message));
  }

  private getLogger = (context?: string): WinstonLogger => {
    if (context && context === 'transaction') {
      return this.transactionLogger;
    }
    return this.winstonLogger;
  }
  private addContext = (scope: string | undefined, message: string): string => {
    const now = moment().format('MMM Do YYYY, h:mm:ss a');
    return scope
      ? `${now} [\x1b[33m${scope}\x1b[0m] ${message}`
      : `${now} ${message}`;
  };
}
