import { CV } from "job-tool-shared-types";
import {Draft, produce} from "immer"
import { createContext } from 'react';

interface CVAction {
    type: string;
    payload: any;
};

const ActionTypes = {
    SET: "SET",
    SET_SECTION: "SET_SECTION",
    SET_ITEM: "SET_ITEM",
} as const;

type ActionMap = {
    [K in keyof typeof ActionTypes]: (D: Draft<CV>, payload?: any) => void;
};

const actionHandlers: ActionMap = {
    SET: (D, payload) => {
        return payload;
    },
    SET_SECTION: (D, payload: { idx: number, section: any }) => {
        D.sections[payload.idx] = payload.section;
    },
    SET_ITEM: (D, payload) => {
        D.sections[payload.sec_idx].items[payload.item_idx] = payload.item;
    },
};

// Reducer function
const cvReducer = (state: CV, action: CVAction) => {
    console.log(`cvReducer -------- ${action.type}`);
    return produce(state, (D) => actionHandlers[action.type]?.(D, action.payload));
};

const CVContext = createContext<[CV, React.Dispatch<CVAction>]>(null);

export { cvReducer, CVAction, CVContext, ActionTypes as CVActions };