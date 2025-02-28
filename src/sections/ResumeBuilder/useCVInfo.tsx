import BackendAPI from "../../backend_api";
import { CVInfo } from "../../components/infoPad/infoPad";
import { create } from "zustand";

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";


interface State {
    cv_info: CVInfo
    status: boolean
}

interface Actions {
    fetch: () => Promise<void>
    set: (newData: CVInfo) => void
}

const log = (msg: string) => console.log(`[cv_info state] ${msg}`)

// A store for CVState
const useCvInfoStore = create<State & Actions>((set, get) => ({
    cv_info: undefined,
    status: false,
    // SETTERS ------------------------------------------------------
    fetch: async () => {
        log("fetch");
        if (USE_BACKEND) {
            BackendAPI.request<undefined, CVInfo>({
                method: "GET",
                endpoint: "cv_info",
                handleSuccess: (cv_info) => {
                    set({ cv_info: cv_info, status: true })
                },
                handleError: (msg: string) => {
                    set({ status: false })
                    alert(msg)
                },
            });
        } else {
            // from the /public folder
            fetch(SAMPLES_PATH + "cv_info.json")
                .then(r => r.json())
                .then(cv_info => {
                    if (cv_info) {
                        set({ cv_info: cv_info, status: true });
                    } else {
                        set({ status: false });
                    }
                })
        }
    },
    set: (newData: CVInfo) => {
        log("set");
        set({ cv_info: newData });
    }
}))


const save2backend = (newData: CVInfo) => {
    BackendAPI.request<CVInfo>({
        method: "PUT",
        endpoint: "cv_info",
        body: newData,
        handleSuccess: () => alert("Success! Saved cv info"),
        handleError: alert,
    });
};


export { useCvInfoStore };