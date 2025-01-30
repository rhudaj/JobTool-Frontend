import { ExperienceUI, SectionUI, SummaryUI } from "../../sections/ResumeBuilder/CVEditor/cv_components";
import VersionedItemUI from "../infoPad/versionScroll";
import TextEditDiv from "../TextEditDiv/texteditdiv";
import "./types.scss";

const DEFAULT_ITEM_TYPE = "DRAG-ITEM";

interface Item<T=any>{
    id: any;
    value: T;		// can't be a JSX element. Anything else is fine.
};

interface Bucket<T=any> {
    id: any;
    items: Item<T>[];		// can't be a JSX element. Anything else is fine.
};

interface BucketType {
    item_type?: string,
    isVertical?: boolean,
    DisplayItem: (props: { obj: any, onUpdate?: any }) => JSX.Element,
    displayItemsClass?: string
};


/**
 * The DynamicComponent function dynamically
 * selects which component to render, but in a stable way
 * No hooks are conditionally called! The component itself
 * is chosen before rendering, keeping React’s hooks order intact. */
function DynamicComponent({ type, props }) {
    const Component = BucketTypes[type].DisplayItem; // THE KEY LINE!
    return <Component {...props} />;
}

const BucketTypes: { [key: string]: BucketType } = {
    "summary": {
        item_type: "summary",
        isVertical: true,
        DisplayItem: SummaryUI,
    },
    "experiences": {
        item_type: "experience",
        isVertical: true,
        displayItemsClass:"experiences",
        DisplayItem: ExperienceUI
    },
    "exp-points": {
        displayItemsClass: "exp-points",
        isVertical: true,
        DisplayItem: (props: {obj: string, onUpdate: any}) => (
            <li><TextEditDiv tv={props.obj} onUpdate={props.onUpdate} /></li>
        )
    },
    "cl-info-pad": {
        item_type: "cl-item",
        isVertical: true,
        displayItemsClass: "text-item-list",
        DisplayItem: (props: {obj: string}) => <div className="text-item">{props.obj}</div>
    },
    "sections": {
        item_type: "section",
        isVertical: true,
        displayItemsClass: "section",
        DisplayItem: SectionUI
    },
    "cl-paragraphs": {
        isVertical: true,
        displayItemsClass: "cl-editor",
        item_type: "cl-item",
        DisplayItem: (props: { obj: string, onUpdate: any })=> <TextEditDiv tv={props.obj} onUpdate={props.onUpdate}/>
    },
    "versioned_items": {
        item_type: "versioned_item",
        isVertical: true,
        DisplayItem: VersionedItemUI,
    }
};

const InfoPadMap = {
    "summary":      "summary",
    "projects":     "experiences",
    "experience":   "experiences",
    "education":    "experiences",
    "paragraphs":   "cl-info-pad",
}

export { Item, Bucket, BucketType, DynamicComponent, DEFAULT_ITEM_TYPE, BucketTypes, InfoPadMap };