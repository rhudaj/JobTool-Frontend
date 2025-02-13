import { CV, NamedCV } from "job-tool-shared-types";
import { useCallback, useReducer, useMemo } from "react";
import { Draft, produce } from "immer";
import BackendAPI from "../../backend_api";

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";
const CVS_PATH = `${SAMPLES_PATH}/CVs`;

interface CVState {
    data: NamedCV[];
    status: boolean;
    cur: number;
    trackMods: boolean[];
}

interface CVsAction {
    type: string;
    payload?: any;
}

// TODO: turn this into a map; from string to callback

const ActionTypes = {
    SET_DATA: "SET_DATA",
    SET_CURRENT: "SET_CURRENT",
    ADD_CV: "ADD_CV",
    DELETE_CV: "DELETE_CV",
    MODIFY_CUR: "MARK_MODIFIED",
    SET_STATUS: "SET_STATUS",
} as const;

type ActionMap = {
    [K in keyof typeof ActionTypes]: (D: Draft<CVState>, payload?: any) => void;
};

const actionHandlers: ActionMap = {
    SET_DATA: (D, payload) => {
        D.data = payload;
        D.trackMods = new Array(payload.length).fill(false);
        D.cur = 0;
        D.status = true;
    },
    SET_CURRENT: (D, payload) => {
        D.cur = payload;
    },
    ADD_CV: (D, payload) => {
        D.data.unshift(payload);
        D.trackMods.unshift(false);
        D.cur = 0;
    },
    DELETE_CV: (D) => {
        D.data.splice(D.cur, 1);
        D.trackMods.splice(D.cur, 1);
        D.cur = 0;
    },
    MODIFY_CUR: (D, payload) => {
        if (payload.cv) {
            D.data[D.cur].data = payload.cv;
            D.trackMods[D.cur] = true;
        }
    },
    SET_STATUS: (D, payload) => {
        D.status = payload;
    },
};

// Reducer function
const cvsReducer = (state: CVState, action: CVsAction) => {
    console.log(`cvsReducer -------- ${action.type}`);
    return produce(state, (D) => {
        actionHandlers[action.type]?.(D, action.payload);
    });
};

// Main Hook
const useCVs = () => {

    const [state, dispatch] = useReducer(cvsReducer, {
        data: [],
        status: false,
        cur: null,
        trackMods: [],
    });

    return {
        // GETTERS ------------------------------------------------------
        status: state.status,
        curIdx: state.cur,
        mods: state.trackMods,
        cvNames: useMemo(
            () => state.data.map((cv) => cv.name),
            [state.data]
        ),
        cur: useMemo(
            () => state.data[state.cur] || null,
            [state.data, state.cur]
        ),
        isModified: useCallback(
            (idx = state.cur) => state.trackMods[idx],
            [state.trackMods, state.cur]
        ),
        // SETTERS ------------------------------------------------------
        dispatch,
        save: save2backend,
        fetch: useFetchCVs(dispatch),
        add: (cv: NamedCV) => dispatch({ type: ActionTypes.ADD_CV, payload: cv }),
        selectCur: (idx: number) => dispatch({ type: ActionTypes.SET_CURRENT, payload: idx }),
        deleteCur: () => dispatch({ type: ActionTypes.DELETE_CV }),
        setCurModified: (isMod: boolean, cv: CV) => dispatch({
            type: ActionTypes.MODIFY_CUR,
            payload: { isModified: isMod, cv },
        }),
    };
};

// Fetching logic moved to a separate hook
const useFetchCVs = (dispatch: React.Dispatch<CVsAction>) => {
    return useCallback(() => {
        if (USE_BACKEND) {
            BackendAPI.request({
                method: "GET",
                endpoint: "all_cvs",
                handleSuccess: (cvList) =>
                    dispatch({ type: ActionTypes.SET_DATA, payload: cvList }),
                handleError: () =>
                    dispatch({ type: ActionTypes.SET_STATUS, payload: false }),
            });
        } else {
            const sampleFiles = [
                "sample_resume1.json",
                "sample_resume2.json",
                "sample_resume3.json",
            ];
            Promise.all(
                sampleFiles.map((file) =>
                    fetch(`${CVS_PATH}/${file}`).then((r) => r.json())
                )
            )
                .then((cvArr) => {
                    if (cvArr.length) {
                        dispatch({
                            type: ActionTypes.SET_DATA,
                            payload: cvArr,
                        });
                    } else {
                        dispatch({
                            type: ActionTypes.SET_STATUS,
                            payload: false,
                        });
                    }
                })
                .catch(() =>
                    dispatch({ type: ActionTypes.SET_STATUS, payload: false })
                );
        }
    }, [dispatch]);
};

// Save to backend
const save2backend = (ncv: NamedCV) => {
    BackendAPI.request({
        method: "POST",
        endpoint: "saveCV",
        body: ncv,
        handleSuccess: () => alert("Saved CV!"),
        handleError: alert,
    });
};

export { useCVs, CVState, CVsAction, ActionTypes as CVsActionTypes };
