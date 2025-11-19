import {ApiUser} from "../DbInterfaces";

export interface ApiLoginReply {
    status: {
        id: LOGIN_STATUS;
        label: string;
    };
    user: ApiUser;
    token: {
        expire_at_ms: number;
        refresh_token_required: boolean;
        signature_verified: boolean;
    };
}

export enum LOGIN_STATUS {
    SUCCESS = 1,
    REFRESH_TOKEN_REQUIRE = 2,
    ERROR = 3
}
