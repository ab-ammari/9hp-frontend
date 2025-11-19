import {ActionPrototype, ApiError} from "wcore-shared";
import {Params, QueryParamsHandling} from "@angular/router";
import {ApiProjet, ApiSecteur, ApiSyncableObject, ApiSynchroFrontInterfaceEnum, ApiUs, ApiUser} from "../../shared";

export class A<T, K> extends ActionPrototype<T, K> {

  static readonly unknown = new A<unknown, unknown>('An unexpected event happened and couldn\'t be attributed');

  /**
   * System
   */
  static readonly init = new A<string, Error>('OxyCore is started.');
  static readonly initBackend = new A<string, Error>('Init remote backend');
  static readonly DBisReady = new A<string, Error | ApiError>('Database is ready');
  static readonly RequestInitProjectIndexed = new A<string, Error | ApiError>('request a new Index check');

  static readonly RequestErrorHandler = new A<Error | ApiError, Error>('Request error handler');

  /**
   * Navigation
   */
  static readonly requestNavigateTo = new A<{
    location: ApiSynchroFrontInterfaceEnum;
    queryParams?: Params;
    queryParamsHandling?: QueryParamsHandling;
  }, Error>('Navigate to event');
  static readonly requestNavigateToObject = new A<{object: ApiSyncableObject,
    newTab?: boolean}, Error>('Navigate to Object');

  /* Stats events */
  static readonly initStats = new A('Init stats dashboard data');
  static readonly updateData = new A('Stats Filter update event');




  constructor(
    description: string
  ) {
    super(description);
    this.init(this, A);
  }
}
