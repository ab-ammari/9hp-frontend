import {ActionPrototype, ApiError, ApiIQ} from "wcore-shared";
import {CronTaskEnum} from "../objects/models/enums/CronTaskEnum";
import {ApiSynchroFrontInterfaceEnum} from "../objects/models/enums/ApiSynchroFrontInterfaceEnum";


export class AdminActions<R, N> extends ActionPrototype<ApiIQ<R, N>, ApiError> {

  static readonly SYNCHRO_FRONT_INTERFACE
    = new AdminActions<ApiRequestSynchroInterface, ApiResponseSynchroInterface>("Open a front interface from backend");

  static readonly CRON
    = new AdminActions<{
    cron: CronTaskEnum;
  }, boolean>("CRON action");

  static readonly PING
    = new AdminActions<null, PingResponse>("PING");


  constructor(
    description: string,
    protected readonly payload: ApiIQ<R, N> = null,
    public readonly error: ApiError = null,
  ) {
    super(description);
    this.init(this, AdminActions);
  }

}

export interface ApiResponseSynchroInterface {
  interface: ApiSynchroFrontInterfaceEnum;
  query_params?: {
    user_uuid?: string;
  };
  query_param_handling?: "merge" | "preserve" | "";
}

export interface ApiRequestSynchroInterface {
  user_uuid?: string;
}


export interface PingResponse {
  running: boolean;
  version: string;
  NODE_SERVEUR: string;
  NODE_REDIS: boolean;
  NODE_WORKER: string;
  NODE_MODE: string;
  NODE_CRON: string;
  NODE_FILE: string;
  serveur: string;
}
