import { Item } from "./types";
import { produce } from "immer";    // the 'immer' libraris version of 'useReducer'

export interface BucketAction {
    type: string;
    payload: any;
};

interface BucketState {
    items: Item[];
};

/* Empty all values in an object (recursively) */
const emptyObject = (obj: any): any => {
    // 3 CASES
    if (Array.isArray(obj)) {
        // 1: ARRAY (RECURSIVE)
        return obj.map(emptyObject);
    } else if (typeof obj === "object" && obj !== null) {
        // 2: OBJECT (RECURSIVE)
        return Object.fromEntries(
            Object.entries(obj).map(([key, val]) => [key, emptyObject(val)])
        );
    } else if (typeof obj == "number") {
        return 0;
    } else if (typeof obj == "string") {
        return "None";
    }
};

export const ADD = "ADD";              // atIndex: number, item?: Item
export const ADD_BLANK = "ADD_BLANK";  // id: any, below: boolean
export const MOVE = "MOVE"             // indexBefore: number, indexAfter: number
export const REMOVE = "REMOVE";        // id: any
export const CHANGE = "CHANGE";        // id: any, newValue: any

// Reducer function
export const bucketReducer = (state: BucketState, action: BucketAction) => {

    const getIdx = (id: any) => state.items.findIndex((I) => I.id === id);

    return produce(state, (D) => {
        let args;
        switch (action.type) {
            case ADD:   // set the whole CV
                console.log("bucketReducer -------- SET");
                args = action.payload as { atIndex: number, item?: Item };
                D.items.splice(args.atIndex, 0, args.item);
                break;
            case ADD_BLANK:
                console.log("bucketReducer -------- ADD_BLANK");
                args = action.payload as { id: any, below: boolean };
                const index2add = getIdx(args.id) + (args.below ? 1 : 0);
                D.items.splice(index2add, 0, emptyObject(D.items[0]));    // deep copy
                break;
            case MOVE:
                console.log("bucketReducer -------- MOVE");
                args = action.payload as { indexBefore: number, indexAfter: number };
                const [movedItem] = D.items.splice(args.indexBefore, 1);
                D.items.splice(args.indexAfter, 0, movedItem);
                break;
            case REMOVE:
                console.log("bucketReducer -------- REMOVE");
                args = action.payload as { id: any };
                D.items.splice(getIdx(args.id), 1);
                break;
            case CHANGE:
                console.log("bucketReducer -------- CHANGE");
                args = action.payload as { id: any, newValue: any };
                D.items[getIdx(args.id)].value = args.newValue;
                break;
            default:
                return D;
        }
    });
};