import { joinClassNames } from "../../util/joinClassNames";
import "./ControlBox.sass"
import "@fortawesome/fontawesome-free/css/all.min.css";     // icons


interface IconControl {
    id?: string;
    icon_class?: string;
    title?: string;
    disabled?: boolean
    [key: string]: any; // Allows any additional props (handlers, styles, etc.)
};

export function ControlsBox(props: {
    id?: string;
    className?: string;
    controls: IconControl[];
    isVertical?: boolean;
}) {
    console.log("Controls: ", props.controls);

    const Orientation: React.CSSProperties = {
        flexDirection: props.isVertical ? "column" : "row"
    };

    return (
        <div className={joinClassNames("controls-box", props.className)} id={props.id} style={Orientation}>
            {props.controls.map(({ id, icon_class, title, disabled, ...handlers }) => (
                disabled ? null : <i key={id} id={id} className={joinClassNames("control-button", icon_class)} title={title} {...handlers}/>
            ))}
        </div>
    );
}
