import {ActionPrototype, ApiError, ApiIQ} from "wcore-shared";
import {ApiVerbose} from "../objects/models/enums/ApiVerbose";

export class SocketActions<R, N> extends ActionPrototype<ApiIQ<R, N>, ApiError> {
    static readonly SOCKET_CONNEXION = new SocketActions<string, string>("USER JUST START CONNEXION & It's done");
    static readonly SOCKET_ONLINE = new SocketActions<string, string>("USER ONLINE ON SOCKET");
    static readonly SOCKET_OFFLINE = new SocketActions<string, string>("USER OFFLINE ON SOCKET");

    static readonly SOCKET_POPUP = new SocketActions<null, {
        icon_url: string;
        title: string;
        message: string;
        level: ApiVerbose;
    }>("Popup to show to user");

    constructor(
        description: string,
        protected readonly payload: ApiIQ<R, N> = null,
        public readonly error: ApiError = null,
    ) {
        super(description);
        this.init(this, SocketActions);
    }
}
