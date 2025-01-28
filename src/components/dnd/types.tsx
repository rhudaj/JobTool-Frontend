import { ExperienceUI, SectionUI, SummaryUI } from "../../sections/ResumeBuilder/CVEditor/cv_components";
import TextEditDiv from "../TextEditDiv/texteditdiv";
import "./types.scss";

const DEFAULT_ITEM_TYPE = "DRAG-ITEM";

interface Item {
    id: any;
    value: any;		// can't be a JSX element. Anything else is fine.
};


interface Bucket {
    id: any;
    items: Item[];		// can't be a JSX element. Anything else is fine.
};

interface BucketType {
    item_type?: string,
    isVertical?: boolean,
    DisplayItem: (props: { obj: any, onUpdate?: any }) => JSX.Element,
    displayItemsClass?: string
};

const BucketTypes: { [key: string]: BucketType } = {
    "info-pad-text-list": {
        item_type: "text",
        isVertical: false,
        displayItemsClass: "text-item-list",
        DisplayItem: (props: {obj: string}) => <div className="text-item">{props.obj}</div>
    },
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
    }
};

const InfoPadMap = {
    "languages":    "info-pad-text-list",
    "technologies": "info-pad-text-list",
    "courses":      "info-pad-text-list",
    "summaries":    "info-pad-text-list",
    "projects":     "experiences",
    "experience":   "experiences",
    "education":    "experiences",
    "paragraphs":   "cl-info-pad",
}

export { Item, Bucket, BucketType, DEFAULT_ITEM_TYPE, BucketTypes, InfoPadMap };