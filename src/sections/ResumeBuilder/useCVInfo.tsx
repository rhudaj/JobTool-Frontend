import { useCallback, useMemo, useReducer } from "react";
import BackendAPI from "../../backend_api";
import { CVInfo } from "../../components/infoPad/infoPad";
import produce, { Draft } from "immer";


const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";


interface CVInfoAction {
    type: string;
    payload?: any;
};

const ActionTypes = {
    SET: "SET",
    SET_STATUS: "SET_STATUS",
} as const;

type ActionMap = {
    [K in keyof typeof ActionTypes]: (D: Draft<CVInfo>, payload?: any) => void;
};

const actionHandlers: ActionMap = {
    SET: (D, payload) => {
        return payload;
    },
    SET_STATUS: (D, payload) => {
        D.status = payload;
    }
};

// Reducer function
const cvInfoReducer = (state: CVInfo, action: CVInfoAction) => {
    console.log(`cvInfoReducer -------- ${action.type}`);
    return produce(state, (D) => actionHandlers[action.type]?.(D, action.payload));
};

function useCVInfo() {

    const [state, dispatch] = useReducer(cvInfoReducer, null);

    return {
        get: state,
        status: useMemo(()=> state !== null, [state]),
        fetch: useFetchCVInfo(dispatch),
        save: save2backend,
        setData: (newData: CVInfo) => dispatch({ type: ActionTypes.SET, payload: newData }),
    };
}

const save2backend = (newData: CVInfo) => {
    BackendAPI.request<CVInfo>({
        method: "POST",
        endpoint: "saveCVInfo",
        body: newData,
        handleSuccess: () => alert("Success! Saved cv info"),
        handleError: alert,
    });
};

// Fetching logic moved to a separate hook
const useFetchCVInfo = (dispatch: React.Dispatch<CVInfoAction>) => {
    return useCallback(() => {
        if (USE_BACKEND) {
            BackendAPI.request<undefined, CVInfo>({
                method: "GET",
                endpoint: "cv_info",
                handleSuccess: (cv_info) => {
                    dispatch({ type: ActionTypes.SET, payload: cv_info });
                    dispatch({ type: ActionTypes.SET_STATUS, payload: true });
                },
                handleError: (msg: string) => {
                    dispatch({ type: ActionTypes.SET_STATUS, payload: false });
                    alert(msg);
                },
            });
        } else {
            // from the /public folder
            fetch(SAMPLES_PATH + "cv_info.json")
                .then((r) => r.json())
                .then((cv_info) => {
                    if (cv_info) {
                        dispatch({ type: ActionTypes.SET, payload: cv_info });
                        dispatch({ type: ActionTypes.SET_STATUS, payload: true });
                    } else {
                        dispatch({ type: ActionTypes.SET_STATUS, payload: false });
                    }
                });
        }
    }, [dispatch]);
};

export { useCVInfo };