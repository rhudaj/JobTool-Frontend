import { ReactElement, useRef, useState } from "react";
import "./splitview.sass"
import { joinClassNames } from "../../util/joinClassNames";

function SplitView(props: {
    children: [ReactElement, ReactElement];
}) {

    const bounds_ref = useRef(null);
    const[ WRatio, SetWRatio ] = useState(50);
    const [ hidden, setHidden ] = useState([false, false])

    const onMouseDown = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWRatio = WRatio;

        const bounds = bounds_ref.current.getBoundingClientRect();

        const onMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const newWRatio = Math.min(99, Math.max(1, startWRatio + (deltaX / window.innerWidth) * 100));
            SetWRatio(newWRatio);

            if( e.clientX >= bounds.right ) {
                setHidden([false, true])
            } else if ( e.clientX <= bounds.left ) {
                setHidden([true, false])
            } else if(hidden[0] || hidden[1]) {
                setHidden([false, false])
            }
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            // make sure to re-enable text selection
            document.body.style.userSelect = "auto";
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        // disable text selection while dragging (otherwise it's annoying)
        document.body.style.userSelect = "none";
    }

    // -------------- RENDER --------------

    const L_STYLE = { width: `${WRatio}%` };
    const R_STYLE = { width: `${100 - WRatio}%` };

    return (
        <div className="split-view" ref={bounds_ref}>
            {!hidden[0] &&
            <div className="view-left" style={L_STYLE}>
                {props.children[0]}
            </div>}
            <div className="width-drag" onMouseDown={onMouseDown}>||</div>
            {!hidden[1] &&
            <div className={joinClassNames("view-right",hidden[1]?"hidden":"")} style={R_STYLE}>
            {props.children[1]}
            </div>}
        </div>
    );
};

export default SplitView;