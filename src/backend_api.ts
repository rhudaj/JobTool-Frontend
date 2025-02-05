import  useLogger  from "./hooks/logger";

/**
 * BackendAPI class
 * @todo the user should have to construct one,
 * which will automatically test that the server is running.
 */
class BackendAPI {
    private static HOST = "http://localhost:8080";
    private static log = useLogger("BackendAPI");

    // Centralized request method
    private static async request<T>(
        method: "GET" | "POST",
        endpoint: string,
        body?: any,
    ): Promise<T|null> {

        const url = `${this.HOST}/${endpoint}`;

        try {
            // build the request options:
            const options: RequestInit = {
                method,
                headers: { "Content-Type": "application/json" },
            };

            // add a body if any:
            if(body) options.body = JSON.stringify(body);

            const response = await fetch(url, options);

            if (!response.ok) {
                this.log(`${endpoint} Request failed!\n\tstatus: ${response.status}\n\tmessage: ${response.statusText}`);
                return null;
            } else {
                this.log(`${endpoint} Request success!\n\tstatus: ${response.status}\n\tmessage: ${response.statusText}`)
            }

            const data: T = await response.json();
            return data;
        } catch (err: unknown) {
            this.log(`ERROR with request to ${endpoint}:\n\t`, err);
            return null;
        }
    }

    // Generic POST method
    static async post<IN, OUT>(endpoint: string, body: IN): Promise<OUT | null> {
        console.log("post body: ", body);
        return await this.request<OUT>("POST", endpoint, body);
    }

    // Generic GET method
    static async get<OUT>(endpoint: string): Promise<OUT | null> {
        return await this.request<OUT>("GET", endpoint, undefined);
    }
}

export default BackendAPI;
