import useToggle from '../../hooks/toggle';
import './ItemControls.sass';
import React from "react";

/**
 * A button that will hover over some reference element and
 * notify the parent to delete it when clicked.
 */
const ItemControlsContainer = React.forwardRef<HTMLElement, any>((
    props: { children: React.ReactElement },
    ref: React.RefObject<HTMLElement> // ref to the parent container
) => {

    // TODO: positions are all off when zooming in/out on the browser

    const [refHovered, setRefHovered] = useToggle();
    const [isHovered, setIsHovered] = useToggle();
    const [position, setPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const pad_left = 5;
    const pad_top = 29;

    // Setup state when ref is passed
    React.useEffect(() => {

        const parent_el = ref.current; // !!! required, else breaks.
        if (!parent_el) return;

        // Attach mouse-event listeners to the parent.

        const handleMouseEnter = (ev: MouseEvent) => {
            const Bounds = parent_el.getBoundingClientRect(); // is this necessary again?
            // setPosition({
            //     top: Bounds.top + window.scrollY,
            //     left: Bounds.left + window.scrollX,
            // });
            setRefHovered(true);
            document.addEventListener("mousemove", handleMouseMove);
            // Only want the most nested item's controls to be active
            ref.current.dispatchEvent(
                new CustomEvent("nested-hover", { bubbles: true }) // bubbles up to the parent elements
            );
        };

        // We can't just wait for mouse leave because the controls are beyond the parents bounds.
        const handleMouseMove = (event: MouseEvent) => {
            // Check if the mouse has left the parent/ref:
            const Bounds = parent_el.getBoundingClientRect();
            const isInsideBounds = (
                event.clientX >= Bounds.left - pad_left &&
                event.clientX <= Bounds.right + pad_left &&
                event.clientY >= Bounds.top - pad_top &&
                event.clientY <= Bounds.bottom + pad_top
            );
            if (!isInsideBounds) {
                setRefHovered(false);
                document.removeEventListener('mousemove', handleMouseMove);
            }
        };

        const handleNestedHover = (ev: Event) => {
            if (ev.target === parent_el) return; // Ignore events dispatched by itself
            // deactivate controls:
            setRefHovered(false);
            setIsHovered(false);
        };

        parent_el.addEventListener('mouseenter', handleMouseEnter);
        parent_el.addEventListener("nested-hover", handleNestedHover); // Listen for child hover events

        // Cleanup event listeners on unmount
        return () => {
            parent_el.removeEventListener('mouseenter', handleMouseEnter);
            parent_el.removeEventListener("nested-hover", handleNestedHover);
        };
    }, [ref]);

    // Highlight the ref's border when controls hovered
    React.useEffect(()=>{
        if(isHovered) {
            ref.current.style.outline=".1em dashed black";
            ref.current.style.outlineOffset=".2em"
        } else {
            ref.current.style.outline="";
            ref.current.style.outlineOffset=""
        }
    }, [isHovered]);

    if (!refHovered) return null; // No controls when the parent is not hovered.
    return (
        <div className="dnd-item-controls"
            style={{
                position: "absolute",
                top: position.top - pad_top,
                left: position.left - pad_left,
            }}
            onMouseEnter={()=>setIsHovered(true)}
            onMouseLeave={()=>setIsHovered(false)}
        >
            {props.children}
        </div>
    );
});

export default ItemControlsContainer;