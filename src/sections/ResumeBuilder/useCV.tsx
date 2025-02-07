import { CV } from "job-tool-shared-types";
import {produce} from "immer"

interface CVAction {
    type: string;
    payload: any;
};

const SET = "SET";
const SET_SECTION = "SET_SECTION";
const SET_ITEM = "SET_ITEM";

// Reducer function
const cvReducer = (state: CV, action: CVAction) => {
    return produce(state, (D) => {
        switch (action.type) {
            case SET:   // set the whole CV
                console.log("cvReducer -------- SET");
                return action.payload;
            case SET_SECTION:
                console.log("cvReducer -------- SET_SECTION");
                D.sections[action.payload.idx] = action.payload.section;
                break;
            case SET_ITEM:
                console.log("cvReducer -------- SET_ITEM");
                D.sections[action.payload.sec_idx].items[action.payload.item_idx] = action.payload.item;
                break;
            default:
                return D;
        }
    });
};

export { cvReducer, CVAction, SET, SET_SECTION, SET_ITEM };