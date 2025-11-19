import {SocketActions} from "./socket-actions";
import {GpsActions} from "./gps-actions";
import {AdminActions} from "./admin-actions";
import {LoginActions} from "./login-actions";
import {UserActions} from "./user-actions";
import {DataActions} from "./data-actions";

export class ApiActionList {

    /**
     * SOCKET
     */
    static readonly socket = SocketActions;

    /**
     * GPS
     */
    static readonly gps = GpsActions;

    /**
     * ADMIN
     */
    static readonly admin = AdminActions;

    /**
     * LOGIN
     */
    static readonly login = LoginActions;

    /**
     * USERS
     */
    static readonly users = UserActions;

    /**
     * DATA
     */
    static readonly data = DataActions;
}



