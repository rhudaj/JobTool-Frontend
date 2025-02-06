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

// Action types
const SET_DATA = "SET_DATA";
const SET_CURRENT = "SET_CURRENT";
const ADD_CV = "ADD_CV";
const DELETE_CV = "DELETE_CV";
const MARK_MODIFIED = "MARK_MODIFIED";
const SET_STATUS = "SET_STATUS";

// Reducer function
const cvReducer = (state: CVState, action) => {
    return produce(state, (draft) => {
        switch (action.type) {
            case SET_DATA:
                draft.data = action.payload;
                draft.trackMods = new Array(action.payload.length).fill(false);
                draft.cur = 0;
                draft.status = true;
                break;

            case SET_CURRENT:
                draft.cur = action.payload;
                break;

            case ADD_CV:
                draft.data.unshift(action.payload);
                draft.trackMods.unshift(false);
                draft.cur = 0;
                break;

            case DELETE_CV:
                draft.data.splice(draft.cur, 1);
                draft.trackMods.splice(draft.cur, 1);
                draft.cur = 0;
                break;

            case MARK_MODIFIED:
                draft.trackMods[draft.cur] = action.payload.isModified;
                if (action.payload.cv) {
                    draft.data[draft.cur].data = action.payload.cv;
                }
                break;

            case SET_STATUS:
                draft.status = action.payload;
                break;

            default:
                return draft;
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

    const [state, dispatch] = useReducer(cvReducer, {
        data: [],
        status: false,
        cur: null,
        trackMods: [],
    });

    const setCur = (name: string) => {
        const index = state.data.findIndex((cv) => cv.name === name);
        if (index !== -1) dispatch({ type: SET_CURRENT, payload: index });
    };

    const add = (cv: NamedCV) => {
        dispatch({ type: ADD_CV, payload: cv });
    };

    const deleteCur = () => {
        dispatch({ type: DELETE_CV });
    };

    const setCurModified = (isMod: boolean, cv: CV) => {
        dispatch({ type: MARK_MODIFIED, payload: { isModified: isMod, cv } });
    };

    const isModified = (idx = state.cur) => state.trackMods[idx];

    return {
        status: state.status,
        curIdx:         useMemo(() => state.cur,                        [state.cur]),
        cvNames:        useMemo(() => state.data.map(cv => cv.name),    [state.data]),
        cur:            useMemo(() => state.data[state.cur] || null,    [state.data, state.cur]),
        mods:           useMemo(()=>state.trackMods,                    [state.trackMods]),
        isModified:     useCallback(isModified,                         [state.trackMods, state.cur]),
        fetch:          useFetchCVs(dispatch),
        add:            useCallback(add, []),
        setCur:         useCallback(setCur, [state.data]),
        save:           useCallback(save2backend, []),
        deleteCur:      useCallback(deleteCur, []),
        setCurModified: useCallback(setCurModified, [])
    };
};

export { useCVs };