import {ActionPrototype, ApiError, ApiIQ} from "wcore-shared";
import {ApiProjetUserRequest, ApiProjetUserResponse, ApiUser} from "../objects/models/DbInterfaces";


export class UserActions<R, N> extends ActionPrototype<ApiIQ<R, N>, ApiError> {

    static readonly RETRIEVE_USER
        = new UserActions<{
        user_uuid: string
    }, ApiUser>("Retrieve one profil from one user");

    static readonly SEARCH_USER
        = new UserActions<{
        search: string
    }, Array<ApiUser>>("Retrieve all users order by last connexion");

    static readonly UPDATE_USER
        = new UserActions<ApiUser, ApiUser>("Update profil of  one user");

    static readonly PROJET_USER
        = new UserActions<ApiProjetUserRequest, ApiProjetUserResponse>("Modify Access of a USER");

    constructor(
        description: string,
        protected readonly payload: ApiIQ<R, N> = null,
        public readonly error: ApiError = null,
    ) {
        super(description, payload, error);
        this.init(this, UserActions);
    }
}

