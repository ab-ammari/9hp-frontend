import {ActionPrototype, ApiError, ApiIQ} from "wcore-shared";
import {ApiLoginRequest} from "../objects/models/enums/ApiLoginRequest";
import {ApiLoginReply} from "../objects/models/enums/ApiLoginReply";


export class LoginActions<R, N> extends ActionPrototype<ApiIQ<R, N>, ApiError> {
    static readonly LOGIN_START = new LoginActions<ApiLoginRequest, ApiLoginReply>("Login start for verify APIKEY. If there is no account, auto REGISTER!");

    constructor(
    description: string,
    protected readonly payload: ApiIQ<R, N> = null,
    public readonly error: ApiError = null,
  ) {
        super(description );
        this.init(this, LoginActions);
    }
}




