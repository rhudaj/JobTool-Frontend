import "./BucketItem.sass"
import { useDrag, useDrop } from "react-dnd";
import React, { useContext } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { Item } from "./types";
import { BucketContext } from "./Bucket";
import { ControlsBox, useHoverBuffer } from "../ControlsBox/ControlBox";

/**
 * This item should only ever be rendered inside a Bucket component.
 * Because it requires the BucketContext to be present.
*/
export default function BucketItem(props: { item: Item, children: JSX.Element }) {

    const bucketContext = useContext(BucketContext);

    // a reference to a drag handle
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
            bucketContext.dispatch({ type: "REMOVE", payload: { id: item.id } });
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

    drop(preview(ref));     // Inject the dnd props into the reference

    // -----------------RENDER-----------------

    if(!bucketContext) {
        throw new Error("BucketItem must be rendered inside a Bucket component.");
    }

    const classNames = joinClassNames(
        "dnd-item-wrapper",
        isDragging ? "dragging" : "", isDropTarget ? "droppable": "",
        "can-drag" // props.disableDrag === true ? "no-drag" : "can-drag"
    );

    return (
        <div ref={ref} className={classNames}>
            {props.children}
            { isHovered &&
            <ControlsBox className="dnd-item-controls" controls={[
                {
                    id: "move",
                    icon_class: "fa-solid fa-grip",
                    ref: drag,
                },
                {
                    id: "delete",
                    icon_class: "fa-solid fa-x",
                    // disabled: !Boolean(bucketContext.onDelete),
                    onClick: ()=>bucketContext.dispatch({type: "REMOVE", payload: { id: props.item.id }})
                },
                {
                    id: "add-above",
                    icon_class: "fa-solid fa-arrow-up",
                    // disabled: !Boolean(bucketContext.onAddItem),
                    // onClick: ()=>bucketContext.onAddItem(props.item.id, true)
                    onClick: ()=>bucketContext.dispatch({type: "ADD_BLANK", payload: { id: props.item.id, below: false }})

                },
                {
                    id: "add-below",
                    icon_class: "fa-solid fa-arrow-down",
                    // disabled: !Boolean(bucketContext.onAddItem),
                    onClick: ()=>bucketContext.dispatch({type: "ADD_BLANK", payload: { id: props.item.id, below: true }})
                }
            ]}/>}
        </div>
    );
};

/**
 * A standalone drag item that can be used outside of a bucket.
 * It has no drop functionality, only drag.
*/
export function StandaloneDragItem(props: {
    item: Item,
    item_type: string,
    children: JSX.Element,
}) {

    // -------------------- STATE ---------------------

    const { ref, isHovered } = useHoverBuffer(15); // 40px buffer zone

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
            { isHovered &&
            <ControlsBox className="dnd-item-controls" controls={[{
                id: "move",
                icon_class: "fa-solid fa-grip",
                ref: drag,
            }]}/>}
            {props.children}
        </div>
    );
};