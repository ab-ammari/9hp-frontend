import {io, ManagerOptions, Socket, SocketOptions} from 'socket.io-client';
import {SocketBuffer} from "./socket-buffer";
import {Observable, Subject, throwError} from "rxjs";
import {LOG, LoggerContext} from "../utils/logger";
import {ActionIQ, ActionPrototype, ApiIQ} from "wcore-shared";
import {catchError, finalize, share, tap, timeout} from "rxjs/operators";
import {RestApi} from "./rest-api";

const CONTEXT: LoggerContext = {
  origin: 'SOCKETIO',
};

const defaultTimeOut = 60000;

export class WCoreNetwork {

  private configuration: NetworkConfig = {
    mode: new Set<networkMode>(['rest', 'socket']),
    url: null,
    apikey: null,
    preferredMode: 'socket'
  };

  private socket: Socket;
  private rest: RestApi;

  private socketOptions: Partial<ManagerOptions & SocketOptions> = defaultSocketOptions;

  private buffer: SocketBuffer = new SocketBuffer();

  private networkSubject: Subject<unknown> = new Subject<unknown>();
  private activity: Array<ActionIQ> = [];

  get networkActivity(): Array<ActionIQ> {
    return this.activity;
  }

  get socketOnline(): boolean {
    return this.configuration.mode.has('socket') ? (this.socket && this.socket.connected) : (this.hasToken && this.restOnline);
  }

  get restOnline(): boolean {
    return this.rest?.isOnline();
  }

  get hasToken(): boolean {
    return !!this.configuration.apikey;
  }


  get config(): NetworkConfig {
    return this.configuration;
  }

  constructor() {
  }

  incoming(): Observable<unknown> {
    return this.networkSubject.asObservable()
      .pipe(
        share(),
        // tap((next) => LOG.info.log({...CONTEXT, action: 'INCOMING'}, next))
      );
  }


  sendOnNetwork<T, K>(payload: ApiIQ<T, K>, preferredMode?: networkMode): Observable<ApiIQ<T, K>> {
    const mode: networkMode = preferredMode ?? this.configuration.preferredMode;
    const response: Subject<ApiIQ<T, K>> = new Subject<ApiIQ<T, K>>();
    if (!mode || !this.configuration.mode.has(mode)) {
      response.error('No compatible mode detected. HARD ABORT. \n Check SystemActions.initRemote before using the network');
      return response.asObservable();
    }
    this.activity.push(payload.event);
    if (mode === 'socket') {
      this.sendOnSocket(payload).pipe(
        tap((value) => {
          response.next(value);
          response.complete();
        })
      ).subscribe({error: err => response.error(err)});
    } else if (mode === 'rest') {
      this.postOnRest(payload).pipe(
        tap((value) => {
          response.next(value);
          response.complete();
        })
      ).subscribe({error: err => response.error(err)});
    } else {
      LOG.debug.log({...CONTEXT, message: 'unable to decide network mode'}, mode, this.configuration);
    }
    response.pipe(timeout(defaultTimeOut),
      //  tap((next) => LOG.info.log({...CONTEXT, action: 'SEND', message: 'IQ sent successfully'}, payload)),
      catchError((err) => this.handleNetworkError(err, payload)),
      finalize(() => {
        if (this.activity.indexOf(payload.event) !== -1) {
          this.activity.splice(this.activity.indexOf(payload.event), 1);
        } else {
          LOG.error.log({
            ...CONTEXT,
            message: 'Activity Array should contain the event but doesnt !!!'
          }, payload.event, this.activity);
        }
      })).subscribe();
    return response;
  }

  private handleNetworkError(err: Error, payload: ApiIQ<unknown, unknown>) {
    if (err?.name === 'TimeoutError') {
      LOG.warn.log({...CONTEXT, action: 'SEND', message: 'IQ timed out'}, payload);
    } else {
      LOG.warn.log({...CONTEXT, action: 'SEND', message: 'IQ ran into a problem'}, err, payload);
    }
    return throwError(err);
  }

  private postOnRest<T, K>(payload: ApiIQ<T, K>): Observable<ApiIQ<T, K>> {
    const response: Subject<ApiIQ<T, K>> = new Subject<ApiIQ<T, K>>();
    if (!this.restOnline || !payload || !this.rest) {
      this.buffer.push(payload, response);
      LOG.warn.log({
        ...CONTEXT,
        action: 'postOnRest',
        message: 'missing config for postOnRest'
      }, this.configuration.apikey, this.configuration.url, payload);
      return response.asObservable().pipe(timeout(1), share());
    }
    this.rest.post(payload).subscribe({
      next: (value) => {
        this.networkSubject.next(value);
        response.next(value as ApiIQ<T, K>);
        response.complete();
      },
      error: (error) => {
        this.buffer.push(payload, response);
        LOG.warn.log({
          ...CONTEXT,
          action: 'postOnRest',
          message: 'postOnRest failed for unhandled reasons; maybe a network issue'
        }, error);
        response.error(error);
      }
    });
    return response.asObservable().pipe(timeout(defaultTimeOut), share());
  }

  /**
   * @param payload : ApiIQ
   * @private
   */
  private sendOnSocket<T, K>(payload: ApiIQ<T, K>): Observable<ApiIQ<T, K>> {
    const response: Subject<ApiIQ<T, K>> = new Subject<ApiIQ<T, K>>();

    if (this.socketOnline && (this.configuration.mode.has('socket'))) {
      // LOG.info.log({...CONTEXT, action: 'SEND - SOCKET', message: 'socket is online. attempting send()'}, payload);
      const id: string = payload.id;
      this.incoming().pipe(timeout(defaultTimeOut), tap((value: ApiIQ<T, K>) => {
        if (value?.id === id) {
          response.next(value);
          response.complete();
        }
      })).subscribe({error: err => response.error(err)});
      this.socket.emit('action', payload);
    } else if (this.configuration.mode.has('rest') && this.restOnline) {
      // LOG.info.log({...CONTEXT, action: 'SEND - REST', message: 'Rest is available. attempting post()'}, payload);
      this.postOnRest(payload).pipe(
        tap((value) => {
          response.next(value);
          response.complete();
        })
      ).subscribe({error: err => response.error(err)});
    } else {
      this.buffer.push(payload, response);
      LOG.warn.log({...CONTEXT, action: 'SEND', message: 'Network is offline !!!'});
    }
    return response.asObservable().pipe(timeout(defaultTimeOut), share());
  }

  private logoutSocket() {
    if (this.socketOnline) {
      this.socket.disconnect();
    }
    this.socket = null;
  }

  private resetSocket() {
    this.socket = io(this.configuration.url, this.socketOptions);
    this.subscribeListeners();
    this.socket.connect();
  }

  setConfig(config: NetworkConfig) {
    this.configuration.url = config.url ?? this.configuration.url;
    this.configuration.apikey = config.apikey ?? this.configuration.apikey;
    this.configuration.mode = config.mode ?? this.configuration.mode;
    this.configuration.preferredMode = config.preferredMode ?? this.configuration.preferredMode;

    if (this.configuration.mode.has('socket')) {
      this.setupSocket();
    }
    if (this.configuration.mode.has('rest')) {
      this.setupRest();
    }
  }

  private setupRest() {
    this.rest = new RestApi(this.configuration.url, this.configuration.apikey);
  }

  private setupSocket(url: string = this.configuration.url, login: string = this.configuration.apikey) {
    this.configuration.url = url;
    this.configuration.apikey = login;

    LOG.info.log({...CONTEXT, action: 'INIT', message: 'setupSocket'});
    if (!this.socketOnline) {
      this.setApiKey(login);
      LOG.info.log({...CONTEXT, action: 'INIT', message: 'new socket :'}, this.configuration.url, this.socketOptions);
      this.socket = io(this.configuration.url, this.socketOptions);
      this.subscribeListeners();
      this.socket.connect();
    } else if (this.socketOnline && !login) {
      console.log('SOCKETIO :::: INIT           :::: setupSocket :::  issue with apikey detected. terminate session.');
      this.logoutSocket();
    } else if (!this.socketOnline && !login) {
      console.log('SOCKETIO :::: INIT           :::: setupSocket :::  no available apikey found. abort.');
    } else {
      LOG.info.log({
        ...CONTEXT,
        action: 'INIT',
        message: 'setupSocket :::  already online. close socket before trying again.'
      });
      this.logoutSocket();
      this.setupSocket();
    }
  }

  private purgeBuffer() {
    if (this.buffer.count()) { // any items waiting in buffer ??
      this.buffer.forEach((obj) => {
        LOG.info.log({...CONTEXT, action: 'PURGEBUFFER', message: 'socket is online. attempting send() : '}, obj);
        this.sendOnNetwork(obj);
      });
    } else {
      // LOG.info.log({...CONTEXT, action: 'PURGEBUFFER', message: 'Buffer is empty'}, this.buffer.count());
    }
  }

  private getSocketOptions(): Partial<ManagerOptions & SocketOptions> {
    this.socketOptions.query['authorization'] = this.configuration.apikey;
    this.socketOptions.transportOptions['websocket'].query.authorization = this.configuration.apikey;
    this.socketOptions.transportOptions['polling'].extraHeaders.authorization = this.configuration.apikey;
    return this.socketOptions;
  }

  private subscribeListeners() {
    this.socket.onAny((name: string, next: ActionPrototype<unknown, unknown>) => {
      // LOG.info.log({...CONTEXT, action: 'INCOMING SOCKET', message: name}, next);
      if (name === 'SOCKET_CONNEXION') {
        this.purgeBuffer();
      }
      // handle incoming message
      this.networkSubject.next(next);
    });


    this.socket.on('newListener', (next) => {
      // console.log('SOCKETIO :::: newListener    :::: ', next);
      LOG.info.log({...CONTEXT, action: 'newListener'}, next);
    });
    this.socket.on('removeListener', (next) => {
      LOG.info.log({...CONTEXT, action: 'removeListener'}, next);
    });
    this.socket.on('connect', () => {
      LOG.info.log({...CONTEXT, action: 'connect'});
      // timeout to give socket time to settle
      setTimeout(() => {
        this.purgeBuffer();
      }, 100);
    });
    this.socket.on('connect_error', (next) => {
      LOG.info.log({...CONTEXT, action: 'connect_error'}, next);
      // LOG.info.log({...CONTEXT, action: 'this.socket.connected'}, this.socket.connected);
    });
    this.socket.on('disconnect', (next) => {
      LOG.info.log({...CONTEXT, action: 'disconnect'}, next);
    });
    this.socket.on('disconnecting', (next) => {
      LOG.info.log({...CONTEXT, action: 'disconnecting'}, next);
    });
  }


  private setApiKey(key: string) {
    this.socketOptions.query.authorization = key;
    (this.socketOptions.transportOptions as { websocket: { query: { authorization: string } } })
      .websocket.query.authorization = key;
    (this.socketOptions.transportOptions as { polling: { extraHeaders: { authorization: string } } })
      .polling.extraHeaders.authorization = key;
  }


}


const defaultSocketOptions: Partial<ManagerOptions & SocketOptions> = {
  query: {
    authorization: null
  },
  forceNew: true,
  // transports: ["polling", "websocket"],
  transports: ['websocket'],
  reconnection: true,
  autoConnect: false,
  upgrade: true,
  transportOptions: {
    websocket: {
      withCredentials: false,
      query: {
        authorization: null
      },
    },
    polling: {
      extraHeaders: {
        authorization: null
      },
      withCredentials: false,
    }
  }
};

export enum NetworkStatus {
  offline,
  configured,
  online
}


export type networkMode = 'socket' | 'rest';

export interface NetworkConfig {
  url: string;
  apikey?: string;
  mode?: Set<networkMode>;
  preferredMode?: networkMode;
}
