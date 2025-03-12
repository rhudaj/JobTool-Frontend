import { ExperienceUI, SectionUI, SummaryUI } from "../../sections/ResumeBuilder/CVEditor/cv_components";
import { VersionedItemUI } from "../versionedItem";
import TextEditDiv from "../texteditdiv";
import { StyleManager } from "../../sections/ResumeBuilder/CVEditor/styles";

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
    layoutClass?: string,
    style?: React.CSSProperties,    // for dynamic css properties (if any)
    DisplayItem?: (props: { obj: any, onUpdate?: any }) => React.ReactNode,
};

/**
 * The DynamicComponent function dynamically
 * selects which component to render, but in a stable way
 * No hooks are conditionally called! The component itself
 * is chosen before rendering, keeping React’s hooks order intact. */
function DynamicComponent({ type, props }) {
    let Component;
    try {
        const bt = BucketTypes[type];
        Component = bt.DisplayItem;
    } catch(err) {
        alert(`ERROR! bucket type "${type}" DNE.`);
        return <></>;
    }
    return <Component {...props} />;
}

const BucketTypeNames = {
    SUMMARY: "summary",
    EXPERIENCES: "experiences",
    PROJECTS: "projects",
    EXP_POINTS: "exp_points",
    CL_INFO_PAD: "cl_info_pad",
    SECTIONS: "sections",
    CL_PARAGRAPHS: "cl_paragraphs",
    VERSIONED_ITEMS: "versioned_items",
};

const BucketTypes: { [key: string]: BucketType } = {
    "summary": {
        DisplayItem: SummaryUI,
    },
    "experiences": {
        layoutClass: "grid",
        style: { rowGap: StyleManager.get("experiences_gap") },
        DisplayItem: props => <ExperienceUI type="experience" {...props}/>
    },
    "projects": {
        layoutClass:  "grid",
        style: { rowGap: StyleManager.get("experiences_gap") },
        DisplayItem: props => <ExperienceUI type="project" {...props}/>
    },
    "exp_points": {
        layoutClass: "flex flex-col",
        style: { rowGap: StyleManager.get("bullet_point_gap") },
        DisplayItem: (props: {obj: string, onUpdate: any}) => (
            <li><TextEditDiv tv={props.obj} onUpdate={props.onUpdate} /></li>
        )
    },
    "cl_info_pad": {
        layoutClass: "flex flex-row flex-wrap gap-2",
        DisplayItem: (props: {obj: string}) => <div className="text-item">{props.obj}</div>
    },
    "sections": {
        layoutClass: "grid",
        style: { rowGap: StyleManager.get("sec_row_gap") },
        DisplayItem: SectionUI
    },
    "cl_paragraphs": {
        DisplayItem: (props: { obj: string, onUpdate: any })=> <TextEditDiv tv={props.obj} onUpdate={props.onUpdate}/>
    }
};

const InfoPadMap = {
    "summary":      "summary",
    "projects":     "projects",
    "experience":   "experiences",
    "education":    "experiences",
    "paragraphs":   "cl_info_pad",
}

export {
    Item,
    Bucket,
    BucketType,
    DynamicComponent,
    DEFAULT_ITEM_TYPE,
    BucketTypeNames,
    BucketTypes,
    InfoPadMap
};