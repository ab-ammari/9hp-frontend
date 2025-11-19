import {ActionPrototype, ApiError, ApiIQ} from "wcore-shared";
import {
    ApiBatchExchangeReplyIndex,
    ApiBatchExchangeReplySync,
    ApiBatchExchangeRequest,
    ApiBatchProjetIndexReply,
    ApiBatchProjetIndexRequest,
    ApiConfig,
    ApiDbExchange,
    ApiProjet,
    ApiSyncable,
    ApiSyncableObject,
    ApiSyncableObjectIndex,
} from "../objects/models/DbInterfaces";

export class DataActions<R, N> extends ActionPrototype<ApiIQ<R, N>, ApiError> {
    static readonly RETRIEVE_PROJETS = new DataActions<null, Array<ApiDbExchange<ApiProjet>>>("Retrieve projects list");

    static readonly RETRIEVE_PROJET_INDEX = new DataActions<ApiBatchProjetIndexRequest, ApiBatchProjetIndexReply>(
        "Retrieve all data from a project, or since last synchro"
    );

    static readonly RETRIEVE_OBJECTS = new DataActions<
        {
            list: Array<ApiSyncableObjectIndex>;
            mode_version?: boolean; // only for backend
        },
        ApiBatchExchangeReplyIndex<ApiSyncable>
    >("Retrieve a list of objects");

    static readonly RETRIEVE_OBJECT_VERSIONS = new DataActions<
        {
            obj: ApiSyncableObject;
        },
        ApiBatchExchangeReplyIndex<ApiSyncable>
    >("retrieve all version from a objects");

    static readonly SYNC_OBJECT = new DataActions<
        ApiBatchExchangeRequest<ApiSyncable>,
        ApiBatchExchangeReplySync<ApiSyncable>
    >("Create/update a list of object");

    static readonly JOIN_PROJET = new DataActions<{projet_uuid: string}, {status: boolean}>("JOIN ROOM of projet");

    static readonly PROJET_UPDATE_CONFIG = new DataActions<
        {
            projet_uuid: string;
            config: ApiConfig;
        },
        ApiProjet
    >("Update config from a projet");

    static readonly PROJET_DUPLICATE = new DataActions<
        {
            projet_uuid: string;
        },
        ApiProjet
    >("Duplicate a projet");

    constructor(
        description: string,
        protected readonly payload: ApiIQ<R, N> = null,
        public readonly error: ApiError = null
    ) {
        super(description);
        this.init(this, DataActions);
    }
}
