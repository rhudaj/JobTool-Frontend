import { useEffect, useRef, useState } from "react";
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
        <div className={joinClassNames(props.className, "controls-box")} id={props.id} style={Orientation}>
            {props.controls.map(({ id, icon_class, title, disabled, ...handlers }) => (
                disabled ? null :
                    <i
                        key={id}
                        id={id}
                        className={joinClassNames("control-button", icon_class)}
                        title={title}
                        {...handlers}
                    />
            ))}
        </div>
    );
}

/**
 * Optional hook to huge alongside the ControlsBox
 */
export function useHoverBuffer(buffer: number) {
    const ref = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [nestedHovered, setNestedHovered] = useState(false);

    // Handlers:

    const handleMouseMove = (event: MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const insideParent =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
        const nearParent =
            event.clientX >= rect.left - buffer &&
            event.clientX <= rect.right + buffer &&
            event.clientY >= rect.top - buffer &&
            event.clientY <= rect.bottom + buffer;
        setIsHovered(insideParent || nearParent);
    }

    const handleMouseEnter = () => {
        if (!ref.current) return;
        setNestedHovered(false); // reset
        ref.current.dispatchEvent(
            new CustomEvent("nested-hover", { bubbles: true,  })
        ); // Dispatch nested-hover when mouse enters
    }

    const handleNestedHover = (event: Event) => {
        // Don't show controls when nested-hover event reaches this component
        if (!ref.current || event.target === ref.current) return
        setNestedHovered(true);
    }

    useEffect(() => {
        document.addEventListener("mousemove", handleMouseMove);
        return () => document.removeEventListener("mousemove", handleMouseMove);
    }, [buffer]);

    useEffect(() => {
        ref.current?.addEventListener("mouseenter", handleMouseEnter);
        ref.current?.addEventListener("nested-hover", handleNestedHover);
        return () => {
            ref.current?.removeEventListener("mouseenter", handleMouseEnter);
            ref.current?.removeEventListener("nested-hover", handleNestedHover);
        };
    }, []);

    return { ref: ref, isHovered: isHovered && !nestedHovered };
}