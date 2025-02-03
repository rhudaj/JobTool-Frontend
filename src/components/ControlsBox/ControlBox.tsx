import { joinClassNames } from "../../util/joinClassNames";
import "./ControlBox.sass"
import "@fortawesome/fontawesome-free/css/all.min.css";     // icons


interface IconControl {
    id?: string;
    icon_class?: string;
    title?: string;
    [key: string]: any; // Allows any additional props (handlers, styles, etc.)
};

export function ControlsBox(props: {
    id?: string;
    controls: IconControl[];
}) {
    return (
        <div className="controls-box" id={props.id}>
            {props.controls.map(({ id, icon_class, title, ...handlers }) => (
                <i key={id} id={id} className={joinClassNames("control-button", icon_class)} title={title} {...handlers}/>
            ))}
        </div>
    );
}
