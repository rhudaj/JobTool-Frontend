import  useLogger  from "./hooks/logger";

export interface Request<IN, OUT=null> {
    method: "GET" | "POST",
    endpoint: string,
    body?: IN,
    handleSuccess?: (data: OUT) => void,
    handleError?: (msg: string) => void,
}

interface Response<T> {
    status: boolean;
    data?: T | null;
    msg?: string;
};


/**
 * BackendAPI class
 * @todo the user should have to construct one,
 * which will automatically test that the server is running.
 */
class BackendAPI {
    private static HOST = "http://localhost:8080";
    private static log = useLogger("BackendAPI");

    // Centralized request method
    private static async __request__<T>(
        method: "GET" | "POST",
        endpoint: string,
        body?: any,
    ): Promise<Response<T>|null> {

        const url = `${this.HOST}/${endpoint}`;
        let ReturnObj = { status: false, message: "", data: null };

        try {
            // build the request options:
            const options: RequestInit = {
                method,
                headers: { "Content-Type": "application/json" },
            };
            // add a body if any:
            if(body) options.body = JSON.stringify(body);
            const response = await fetch(url, options);
            if (response.ok) {
                ReturnObj.status = true;
                ReturnObj.message = `${endpoint} Request success!`;
                ReturnObj.data = await response.json();
            } else {
                ReturnObj.message = `${endpoint} Request failed!\n\tstatus: ${response.status}\n\tmessage: ${response.statusText}`;
            }
        } catch (err: unknown) {
            ReturnObj.message = `ERROR with request to ${endpoint}:\n\t ${JSON.stringify(err)}`;
        }
        this.log(ReturnObj.message);
        return ReturnObj; // data may be null
    }

    public static async request<IN=any, OUT=any>(req: Request<IN, OUT>) {
        const resp: Response<OUT> = await this.__request__<OUT>(req.method, req.endpoint, req.body);
        if(resp.status) req.handleSuccess?.(resp.data);
        else            req.handleError?.(resp.msg);
    };
}

export default BackendAPI;
