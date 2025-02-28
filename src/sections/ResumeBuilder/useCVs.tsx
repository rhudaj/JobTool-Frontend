import { CV, NamedCV } from "job-tool-shared-types";
import BackendAPI from "../../backend_api";
import { create } from 'zustand'
import { produce } from 'immer' // simplify changing nested state
import { createContext } from 'react'
import { isEqual } from "lodash";

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";
const CVS_PATH = `${SAMPLES_PATH}/CVs`;

interface State {
    ncvs: NamedCV[]
    status: boolean
    curIdx: number
    trackMods: boolean[]
}

interface Actions {
    fetch: () => Promise<void>
    update: (cv: CV) => void
    add: (cv: NamedCV) => void
    setCur: (idx: number) => void
    delCur: () => void
}

const log = (msg: string) => console.log(`[cvs state] ${msg}`)

// A store for CVState
const useCvsStore = create<State & Actions>((set, get) => ({
    ncvs: [],
    status: false,
    curIdx: null,
    trackMods: [],
    // SETTERS ------------------------------------------------------
    fetch: async () => {
        if (USE_BACKEND) {
            BackendAPI.request({
                method: "GET",
                endpoint: "cvs",
                handleSuccess: (cvList) => {
                    set({ ncvs: cvList, status: true, curIdx: 0 });
                },
                handleError: () => {
                    set({ status: false });
                }
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
                        set({ ncvs: cvArr, status: true, curIdx: 0 });
                    } else {
                        set({ status: false });
                    }
                })
                .catch(() =>
                    set({ status: false })
                );
        }
    },
    update: (cv: CV) => {
        const idx = get().curIdx;
        set(produce((state) => {
            const cur = state.ncvs?.[idx]?.data;
            if (isEqual(cv, cur)) return; // Avoid redundant updates
            log(`update(cv: ${cv.header_info.name})`);
            state.ncvs[idx].data = cv;
            state.trackMods[idx] = true;
        }));
    },
    add: (cv) => {
        log(`add(cv: ${cv.name})`)
        set(produce(state => {
            state.ncvs.unshift(cv)
            state.trackMods.unshift(false)
            state.curIdx = 0
        }))
    },
    setCur: (idx) => {
        log(`setCur(idx: ${idx})`)
        set({ curIdx: idx })
    },
    delCur: () => {
        log(`delCur()`)
        set(produce(state => {
            state.ncvs.splice(state.curIdx, 1)
            state.trackMods.splice(state.curIdx, 1)
            state.curIdx = 0
        }))
    },
}))

const save2backend = (ncv: NamedCV, overwrite: boolean) => {
    BackendAPI.request({
        method: overwrite ? "PUT" : "POST",
        endpoint: `cvs${overwrite ?? `/${ncv.name}`}`,
        body: ncv,
        handleSuccess: () => alert("Saved CV!"),
        handleError: alert,
    });
};

// stores a CV object
const cvContext = createContext<CV>(null);

export { useCvsStore, cvContext };
