import React from "react";
import "./texteditdiv.scss";
import { joinClassNames } from "../../hooks/joinClassNames";
import { TrackVal } from "../../hooks/trackable";

/**
 * @param tv standard text || html string
 * @note any style update (bold, italics, underline supported to the browser will update the string value).
 */
// function TextEditDiv(props: {
//     tv: string,
//     id?: string,
//     className?: string,
//     onUpdate?: (newVal: string) => void
// }) {

//     // ----------------- STATE -----------------

//     /**
//      * Whether the div is currently being edited.
//      * Enabled <= onDoubleClick
//      * Disabled <= onBlur */
//     const [isEditing, setIsEditing] = React.useState(false);

//     // prevent default paste behavior (which copies styles)
//     const onPaste = (e: React.ClipboardEvent) => {
//         e.preventDefault();
//         // 1 - Get text representation of clipboard:
//         const txt = e.clipboardData.getData("text/plain");
//         // 2- insert text manually:
//             // get selection and delete it:
//             const selection = window.getSelection();
//             if (!selection?.rangeCount) return;
//             selection.deleteFromDocument();
//             // insert text at selection point (cursor):
//             selection.getRangeAt(0).insertNode(document.createTextNode(txt));
//     };

//     // When done editing
//     const onBlur = (e: React.FocusEvent) => {
//         setIsEditing(false);
//         const html_str = e.target.innerHTML;
//         // use the inner html, in order to copy along styles
//         if (props.onUpdate) {
//             props.onUpdate(html_str)
//         }
// 	};

//     // ----------------- RENDER -----------------

//     const classNames = joinClassNames("text-edit-div", props.className, isEditing ? "editing" : "");

//     return (
//         <div
//             className={classNames}
//             id={props.id}
//             contentEditable={isEditing}
//             onPaste={onPaste}
//             onBlur={onBlur}
//             onDoubleClick={()=>setIsEditing(true)}
//             dangerouslySetInnerHTML={{__html: props.tv}}
//         />
//     );
// }

export function TextEditDiv(props: {
    tv: TrackVal<any>,
    destruct?: (obj: any) => string,
    construct?: (html: string) => any,
    id?: string,
    className?: string
}) {

    // ----------------- STATE -----------------

    /**
     * Whether the div is currently being edited.
     * Enabled <= onDoubleClick
     * Disabled <= onBlur */
    const [isEditing, setIsEditing] = React.useState(false);

    const onPaste = (e: React.ClipboardEvent) => {
        // prevent default paste behavior (which copies styles)
        e.preventDefault();
        // 1 - Get text representation of clipboard:
        const txt = e.clipboardData.getData("text/plain");
        // 2- insert text manually:
            // get selection and delete it:
            const selection = window.getSelection();
            if (!selection?.rangeCount) return;
            selection.deleteFromDocument();
            // insert text at selection point (cursor):
            selection.getRangeAt(0).insertNode(document.createTextNode(txt));
    };

    const onBlur = (e: React.FocusEvent) => {
        // fires when an element has lost focus after editing
        setIsEditing(false);

        // call the setter (new object)
		props.tv.value = e.target.textContent;
	};

    // ----------------- RENDER -----------------

    const classNames = joinClassNames("text-edit-div", props.className, isEditing ? "editing" : "");

    return (
        <div
            className={classNames}
            id={props.id}
            contentEditable={isEditing}
            onPaste={onPaste}
            onBlur={onBlur}
            onDoubleClick={()=>setIsEditing(true)}
            dangerouslySetInnerHTML={{__html: typeof props.tv === "string" ? props.tv : props.tv.value }}
        />
    );
}

export default TextEditDiv;
