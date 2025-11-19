// tslint:disable:no-console

export class LOG {

  constructor(private readonly type: string) {

  }

  static defaultOriginLength = 10;
  static defaultActionLength = 10;

  static debug: LOG = new LOG('debug');
  static error: LOG = new LOG('error');
  static info: LOG = new LOG('info');
  static trace: LOG = new LOG('trace');
  static warn: LOG = new LOG('warn');
  static any: LOG = new LOG('any');

  private readonly defaultOrigin: string = 'LOGGER';
  private readonly defaultMessage: string = '';

  private context: LoggerContext;

  log(context: LoggerContext | string, ...data: unknown[]) {
    if (typeof context === 'string' || context instanceof String) {
      this.context = {
        origin: this.defaultOrigin,
        action: this.type,
        message: context as string,
      };
    } else {
      if (context) {
        this.context = JSON.parse(JSON.stringify(context));
      } else {
        // todo : what if no context provided ?
      }
    }
    this.writeToConsole(this.parseContext(), data);
  }

  private parseContext(): string {
    if (!this.context.origin) {
      this.context.origin = this.defaultOrigin;
    }
    if (!this.context.action) {
      this.context.action = this.type;
    }
    if (!this.context.message) {
      this.context.message = this.defaultMessage;
    }

    let log: string;
    log = this.formatOrigin() + ' ' + this.formatAction();
    if (this.context.message) {
      log = log + ' ' + this.formatMessage();
    }
    return log;
  }

  private formatOrigin(): string {
    let origin: string = this.context.origin;
    if (origin && origin.length > 0) {
      if (origin.length >= LOG.defaultOriginLength) {
        LOG.defaultOriginLength = origin.length + 2;
      }
      if (origin.length < LOG.defaultOriginLength) {
        while (origin.length <= LOG.defaultOriginLength) {
          origin = origin + ' ';
        }
      }
    }
    this.context.origin = origin;
    return origin;
  }

  private formatAction(): string {
    let action: string = this.context.action;
    if (action && action.length > 0) {
      if (action.length >= LOG.defaultActionLength) {
        LOG.defaultActionLength = action.length + 2;
      }
      if (action.length < LOG.defaultActionLength) {
        while (action.length <= LOG.defaultActionLength) {
          action = action + ' ';
        }
      }
    }
    this.context.action = action;
    return action;
  }

  private formatMessage(): string {
    return this.context.message;
  }

  private writeToConsole(context: string, ...data: unknown[]) {
    // @ts-ignore
    const multipleData = Object.assign(...data) as unknown[];
    try {
      switch (this.type) {
        case 'debug': // blue
          if (multipleData.length > 0) {
            console.debug('%c ' + context, 'background: #222; color: #557dda', ...multipleData);
          } else {
            console.debug('%c ' + context, 'background: #222; color: #557dda');
          }
          break;
        case 'error': // red
          if (multipleData.length > 0) {
            console.error(context, ...multipleData);
          } else {
            console.error(context);
          }
          break;
        case 'info': // green
          if (multipleData.length > 0) {
            console.info('%c ' + context, 'background: #222; color: #bada55', ...multipleData);
          } else {
            console.info('%c ' + context, 'background: #222; color: #bada55');
          }
          break;
        case 'warn': // green
          if (multipleData.length > 0) {
            console.warn('%c ' + context, 'background: #222;', ...multipleData);
          } else {
            console.warn('%c ' + context, 'background: #222;');
          }
          break;
        case 'trace': // green
          if (multipleData.length > 0) {
            console.trace('%c ' + context, 'background: #222; color: #bada55', ...multipleData);
          } else {
            console.trace('%c ' + context, 'background: #222; color: #bada55');
          }
          break;
        default:  // green
          if (multipleData.length > 0) {
            console.log('%c ' + context, 'background: #222; color: #b1b5bd', ...multipleData);
          } else {
            console.log('%c ' + context, 'background: #222; color: #b1b5bd');
          }
          break;
      }
    } catch (e) {
      if (multipleData.length > 0) {
        console.log('%c ' + context, 'background: #222; color: #b1b5bd', ...multipleData);
      } else {
        console.log('%c ' + context, 'background: #222; color: #b1b5bd');
      }
    }
  }

}

export class LoggerContext {
  origin?: string;
  action?: string;
  message?: string;
}
