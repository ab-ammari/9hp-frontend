export class OxyError extends Error {
    public error = {
        code: "ERR-OxyError-Undefined",
        message: "",
    };

    public type: string = "OxyError";
    public severity: string;
    // @ts-ignore
    public origin: string;
    // @ts-ignore
    public redirection: string;
    // @ts-ignore
    public node_server: string;
    public http: number = 500;
    public err_message: string;

    constructor(err: any, nodeErrorCode: string = "ERR-X", severity: number = 3, httpErrorCode: number = 422) {
        super(err?.message || err);
        this.err_message = " " + err?.message || err || this.message;

        if (!err) {
            throw new Error("OxyError constructor: No error received!");
        }

        if (!(err instanceof OxyError)) {
            this.type = "OxyError";
            this.severity = OxyError.severity(severity) || OxyError.severity(3);
            // @ts-ignore
            this.http = httpErrorCode;
            this.error.message = this.message || this.err_message || err || err?.message;
            this.error.code = nodeErrorCode;
        } else {
            this.error = {
                code: err.error.code,
                message: this.message || err.error.message || err?.message || err as unknown as string,
            };
            this.type = err.type;
            this.severity = err.severity;
            this.origin = err.origin;
            this.redirection = err.redirection;
            this.http = err.http;
        }

        Object.setPrototypeOf(this, OxyError.prototype);
    }

    public static severity(id: number): string {
        if (id === 1) {
            return "1:ALERT";
        } else if (id === 2) {
            return "2:CRITICAL";
        } else if (id === 3) {
            return "3:ERROR";
        } else if (id === 4) {
            return "4:WARNING";
        } else if (id === 5) {
            return "5:NOTICE";
        } else if (id === 0) {
            return "0:EMERGENCY";
        }
        return "3:ERROR";
    }
}
