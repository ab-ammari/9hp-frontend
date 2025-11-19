import {ActionPrototype, ApiIQ, ApiIQError} from "wcore-shared";
import {NetworkConfig} from "./CoreNetworkingTools/Network";


export class SystemActions<T, K> extends ActionPrototype<T, K> {

  /**
   * System
   */
  static readonly unknown = new SystemActions<unknown, unknown>('An unexpected event happened and couldn\'t be attributed');
  static readonly init = new SystemActions<string, Error>('WCore is started.');
  static readonly initRemote = new SystemActions<NetworkConfig, Error>('setup a remote link via socketio to share actions with an API');
  static readonly Error = new SystemActions<unknown, Error>('an unknown error happened');


  static readonly NETWORK_ERROR = new SystemActions<ApiIQError<unknown>, Error>('an unknown error happened in the networking process');
  static readonly NETWORK_OUT = new SystemActions<ApiIQ<unknown, unknown>, Error>('an iq has been successfully added to the outgoing network queue');
  static readonly NETWORK_IN = new SystemActions<ApiIQ<unknown, unknown>, Error>('an iq has been successfully received');
  /**
   * @deprecated -> is now NetworkError
   */
  static readonly SocketError = new SystemActions<ApiIQError<unknown>, Error>('an unknown error happened');
  /**
   * @deprecated -> is now NETWORK_OUT
   */
  static readonly SocketOutgoing = new SystemActions<ApiIQ<unknown, unknown>, Error>('a socket has been successfully added to the outgoing queue');
  /**
   * @deprecated -> is now NETWORK_IN
   */
  static readonly SocketIncoming = new SystemActions<ApiIQ<unknown, unknown>, Error>('a socket has been successfully received');


  constructor(
    description: string,
    protected readonly payload: T = null,
    public readonly error: K = null
  ) {
    super(description, payload, error);
    this.init(this, SystemActions);
  }
}

