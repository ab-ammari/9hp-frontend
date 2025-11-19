import {ApiGpsPoint} from "../objects/models/apiGpsPoint";
import {ActionPrototype, ApiError, ApiIQ} from "wcore-shared";

export class GpsActions<R, N> extends ActionPrototype<ApiIQ<R, N>, ApiError> {
    static readonly GPS_AUTOCOMPLETE = new GpsActions<{
        cust_uuid: string; address: string; country: string; sessionToken: string; lat: number; lng: number, is_departure_address: boolean
    },
        Array<ApiGpsPoint>>("GPS AUTOCOMPLETE IS MADE FOR REPLACE GOOGLE AUTO COMPLETE AND REPLY WITH EXTRA GPS POINTS");

    constructor(
    description: string,
    protected readonly payload: ApiIQ<R, N> = null,
    public readonly error: ApiError = null,
  ) {
        super(description );
        this.init(this, GpsActions);
    }


}
