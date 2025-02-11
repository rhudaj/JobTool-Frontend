import { CV, NamedCV } from "job-tool-shared-types";
import { useCallback, useReducer, useMemo } from "react";
import {produce} from "immer"
import BackendAPI from "../../backend_api";

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";
const CVS_PATH = `${SAMPLES_PATH}/CVs`;

interface CVState {
    data: NamedCV[];
    status: boolean;
    cur: number;
    trackMods: boolean[];
};

interface CVsAction {
    type: string,
    payload?: any
};

// TODO: turn this into a map; from string to callback

// Action types
const SET_DATA = "SET_DATA";
const SET_CURRENT = "SET_CURRENT";
const ADD_CV = "ADD_CV";
const DELETE_CV = "DELETE_CV";
const MODIFY_CUR = "MARK_MODIFIED";
const SET_STATUS = "SET_STATUS";

// Reducer function
const cvsReducer = (state: CVState, action: CVsAction) => {
    return produce(state, (D) => {
        switch (action.type) {
            case SET_DATA:
                D.data = action.payload;
                D.trackMods = new Array(action.payload.length).fill(false);
                D.cur = 0;
                D.status = true;
                break;

            case SET_CURRENT:
                D.cur = action.payload;
                break;

            case ADD_CV:
                D.data.unshift(action.payload);
                D.trackMods.unshift(false);
                D.cur = 0;
                break;

            case DELETE_CV:
                D.data.splice(D.cur, 1);
                D.trackMods.splice(D.cur, 1);
                D.cur = 0;
                break;

            case MODIFY_CUR:
                console.log("MODIFY_CUR", action.payload);
                if (action.payload.cv) {
                    D.data[D.cur].data = action.payload.cv;
                    D.trackMods[D.cur] = true;
                }
                break;

            case SET_STATUS:
                D.status = action.payload;
                break;

            default:
                return D;
        }
    });
};

// Fetching logic moved to a separate hook
const useFetchCVs = (dispatch) => {
    return useCallback(() => {
        if (USE_BACKEND) {
            BackendAPI.request({
                method: "GET",
                endpoint: "all_cvs",
                handleSuccess: (cvList) =>
                    dispatch({ type: SET_DATA, payload: cvList }),
                handleError: () =>
                    dispatch({ type: SET_STATUS, payload: false }),
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
                        dispatch({ type: SET_DATA, payload: cvArr });
                    } else {
                        dispatch({ type: SET_STATUS, payload: false });
                    }
                })
                .catch(() => dispatch({ type: SET_STATUS, payload: false }));
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
}

// Main hook
const useCVs = () => {

    const [state, dispatch] = useReducer(cvsReducer, {
        data: [],
        status: false,
        cur: null,
        trackMods: [],
    });

    const selectCur = (idx: number) => {
        dispatch({ type: SET_CURRENT, payload: idx });
    };

    const add = (cv: NamedCV) => {
        dispatch({ type: ADD_CV, payload: cv });
    };

    const deleteCur = () => {
        dispatch({ type: DELETE_CV });
    };

    const setCurModified = (isMod: boolean, cv: CV) => {
        dispatch({ type: MODIFY_CUR, payload: { isModified: isMod, cv } });
    };

    const isModified = (idx = state.cur) => state.trackMods[idx];

    return {
        // Getters
        status: state.status,
        curIdx: state.cur,
        mods:   state.trackMods,
        cvNames:        useMemo(() => state.data.map(cv => cv.name),    [state.data]),
        cur:            useMemo(() => state.data[state.cur] || null,    [state.data, state.cur]),
        // Other Getters
        isModified:     useCallback(isModified, [state.trackMods, state.cur]),
        fetch:          useFetchCVs(dispatch),
        // Dispatch based setters
        add:            useCallback(add, []),
        selectCur:      useCallback(selectCur, [state.data]),
        save:           useCallback(save2backend, []),
        deleteCur:      useCallback(deleteCur, []),
        setCurModified: useCallback(setCurModified, []),
        dispatch: dispatch      // in order to pass it to child components (e.g. CVEditor)
    };
};

export { useCVs, CVState, CVsAction, MODIFY_CUR };