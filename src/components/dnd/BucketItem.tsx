import "./BucketItem.sass"
import { useDrag, useDrop } from "react-dnd";
import React, { useContext } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { Item } from "./types";
import ItemControlsContainer from "./ItemControls";
import { BucketContext } from "./Bucket";
import { ControlsBox } from "../ControlsBox/ControlBox";

import { useState, useEffect, useRef } from "react";

function useHoverBuffer(buffer: number) {
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


export default function BucketItem(props: { item: Item, children: JSX.Element }) {

    const bucketContext = useContext(BucketContext);

    const { ref, isHovered } = useHoverBuffer(15); // 40px buffer zone

    // -------------------- STATE ---------------------

    // const ref = React.useRef(null);

    // -----------------DRAG FUNCTIONALITY-----------------

    const [{isDragging}, drag, preview] = useDrag(() => ({
        type: bucketContext.item_type,
        canDrag: true,
        item: () => {
            return props.item; 			// sent to the drop target when dropped.
        },
        end: (item: Item, monitor) => {
            const dropResult: {id: any} = monitor.getDropResult();  // the bucket we dropped on
            // Cancelled/invalid drop || same bucket
            if(!dropResult || dropResult.id === bucketContext.bucket_id) return;
            bucketContext.onRemove && bucketContext.onRemove(item.id);
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        }), [props.item, bucketContext.onHover]
    );

    // -----------------DROP FUNCTIONALITY-----------------

    const [{isDropTarget}, drop] = useDrop(
        () => ({
            accept: bucketContext.item_type,
            canDrop: (dropItem: Item) => {
                return bucketContext.disableReplace !== true && dropItem.id !== props.item.id;
            },
            drop: () => props.item,
            hover: (dragItem: Item, monitor) => {

                if ( !bucketContext.onHover || dragItem.id === props.item.id )
                    return;

                const rect = ref.current.getBoundingClientRect();
                const dragPos = monitor.getClientOffset();

                bucketContext.onHover(
                    props.item.id,  // hovered item's ID
                    dragItem.id,
                    (dragPos.y - rect.top) > (rect.bottom - rect.top)/2, 	// is it below?
                    (dragPos.x - rect.left) > (rect.right - rect.left)/2	// is it right?
                );
            },
            collect: (monitor) => ({
                isDropTarget: monitor.canDrop() && monitor.isOver()
            }),
        }),
        [props.item, bucketContext.onHover]
    );

    drop(preview(ref));     // Inject the dnd props into the reference

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

    // -----------------RENDER-----------------

    const classNames = joinClassNames(
        "dnd-item-wrapper",
        isDragging ? "dragging" : "", isDropTarget ? "droppable": "",
        "can-drag" // props.disableDrag === true ? "no-drag" : "can-drag"
    );

    return (
        <div ref={ref} className={classNames}>
            {props.children}
            { isHovered &&
            <ControlsBox id="dnd-item-controls" controls={[
                {
                    id: "move",
                    icon_class: "fa-solid fa-grip",
                    ref: drag,
                },
                {
                    id: "delete",
                    icon_class: "fa-solid fa-x",
                    disabled: !Boolean(bucketContext.onDelete),
                    onClick: ()=>bucketContext.onDelete(props.item.id)
                },
                {
                    id: "add-above",
                    icon_class: "fa-solid fa-arrow-up",
                    disabled: !Boolean(bucketContext.onAddItem),
                    onClick: ()=>bucketContext.onAddItem(props.item.id, true)
                },
                {
                    id: "add-below",
                    icon_class: "fa-solid fa-arrow-down",
                    disabled: !Boolean(bucketContext.onAddItem),
                    onClick: ()=>bucketContext.onAddItem(props.item.id, false)
                }
            ]}/>}
        </div>
    );
};

// Drag only, can't be Dropped on. Only has Move Controls
export function StandaloneDragItem(props: {
    item: Item,
    item_type: string,
    children: JSX.Element,
}) {

    // -------------------- STATE ---------------------

    const ref = React.useRef(null);

    // -----------------DRAG FUNCTIONALITY-----------------

    const [{isDragging}, drag, preview] = useDrag(() => ({
        type: props.item_type,
        canDrag: true,
        item: () => {
            return props.item; 			// sent to the drop target when dropped.
        },
        end: (item: Item, monitor) => {
            const dropResult = monitor.getDropResult();  // the bucket we dropped on
            if(!dropResult) return;             // Cancelled/invalid drop
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        }), [props.item]
    );

    preview(ref);     // Inject the dnd props into the reference

    // -----------------RENDER-----------------

    const classNames = joinClassNames(
        "standalone-drag-item-wrapper",
        isDragging ? "dragging" : "",
    );

    return (
        <div ref={ref} className={classNames}>
            <ItemControlsContainer ref={ref}>
                <div ref={drag} className="move-handle">M</div>
            </ItemControlsContainer>
            {props.children}
        </div>
    );
};