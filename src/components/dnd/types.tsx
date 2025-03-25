import { ExperienceUI, SectionUI, SummaryUI } from "../../sections/ResumeBuilder/CVEditor/cv_components";
import TextEditDiv from "../texteditdiv";
import { StyleManager } from "../../sections/ResumeBuilder/CVEditor/styles";
import { JSX } from "react";
import { CVSection, Experience, Summary } from "job-tool-shared-types";

export const DEFAULT_ITEM_TYPE = "text";

export interface Item<T>{
    id: any,
    value: T,		// can't be a JSX element. Anything else is fine.
    type?: string,
};

export interface Bucket<T> {
    id: any;
    items: Item<T>[];		// can't be a JSX element. Anything else is fine.
};

/*
The user must always supply:
    - `obj` – the object to display
And optionally:
    - `onUpdate` – a callback, called when the component updates `obj` internally
*/
type DisplayItemProps<T> = {
    obj: T,
    onUpdate?: (newObj: T, ...otherProps: unknown[]) => void,
}

/**
 * Type of a React component which uses `DisplayItemProps` \
 * An object of type `OtherProps` may be supplied depending on the use case.
*/
export type BucketItemComponent<T,OtherProps=any> =
    (props: DisplayItemProps<T> & OtherProps) => React.ReactNode;

export interface BucketType<T> {
    layoutClass?: string,
    style?: React.CSSProperties,    // for dynamic css properties (if any)
    DisplayItem?: BucketItemComponent<T>
};

export const BucketTypes: { [key: string]: BucketType<unknown> } = {
    "text": {
        layoutClass: "border-1 border-dashed min-h-10",
        DisplayItem: (props: DisplayItemProps<string>) =>
            <div>{props.obj}</div>
    },
    "summary": {
        layoutClass: "min-h-10",
        DisplayItem: (props: DisplayItemProps<Summary>) =>
            <SummaryUI {...props} />,
    },
    "experiences": {
        layoutClass: "grid",
        style: { rowGap: StyleManager.get("experiences_gap") },
        DisplayItem: (props: DisplayItemProps<Experience>) =>
            <ExperienceUI {...props} type="experience"/>
    },
    "projects": {
        layoutClass:  "grid",
        style: { rowGap: StyleManager.get("experiences_gap") },
        DisplayItem: (props: DisplayItemProps<Experience>) =>
            <ExperienceUI {...props} type="project" />
    },
    "exp_points": {
        layoutClass: "flex flex-col",
        style: { rowGap: StyleManager.get("bullet_point_gap") },
        DisplayItem: (props: {obj: string, onUpdate: any}) => (
            <li>
                <TextEditDiv tv={props.obj} onUpdate={props.onUpdate} />
            </li>
        )
    },
    "cl_info_pad": {
        layoutClass: "flex flex-row flex-wrap gap-2",
        DisplayItem: (props: DisplayItemProps<string>) =>
            <div className="text-item">{props.obj}</div>
    },
    "sections": {
        layoutClass: "grid",
        style: { rowGap: StyleManager.get("sec_row_gap") },
        DisplayItem: (props: DisplayItemProps<CVSection>) =>
            <SectionUI {...props}/>
    },
    "cl_paragraphs": {
        DisplayItem: (props: { obj: string, onUpdate: any })=> <TextEditDiv tv={props.obj} onUpdate={props.onUpdate}/>
    }
};

export const InfoPadMap = {
    "summary":      "summary",
    "projects":     "projects",
    "experience":   "experiences",
    "education":    "experiences",
    "paragraphs":   "cl_info_pad",
}

export const getBucketType = (name: string) => {
    if(Object.keys(BucketTypes).indexOf(name) === -1) return;
    return BucketTypes[name];
}

/**
 * The DynamicComponent function dynamically
 * selects which component to render, in a **stable** way
 * No hooks are conditionally called! The component itself
 * is chosen before rendering, keeping React’s hooks order intact. */
export function DynamicComponent({ type, props }: {
    type: keyof typeof BucketTypes,
    props: DisplayItemProps<unknown>
}): JSX.Element | null {
    let Component;
    try {
        const bt = BucketTypes[type];
        Component = bt.DisplayItem;
    } catch(err) {
        alert(`ERROR! bucket type "${type}" DNE.`);
        return null;
    }
    return <Component {...props} />;
}