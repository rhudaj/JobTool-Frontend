// import "./BucketItem.sass"
import { useDrag, useDrop } from "react-dnd";
import React, { useContext } from "react";
import { Item } from "./types";
import { BucketItemContext } from "./Bucket";
import { ControlsBox, useHoverBuffer } from "../ControlBox";

const control_button_style = "border-1 border-black opacity-50 hover:opacity-100";

/**
 * This item should only ever be rendered inside a Bucket component.
 * Because it requires the ctxt to be present.
*/
export default function BucketItem(props: {
    item: Item,
    children: React.ReactNode
}) {

    // -------------------- STATE ---------------------

    const ctxt = useContext(BucketItemContext);
    const { ref, isHovered } = useHoverBuffer(15); // ref' drag handle

    // -----------------DRAG FUNCTIONALITY-----------------

    const [{isDragging}, drag, preview] = useDrag(() => ({
        type: ctxt.item_type,
        canDrag: true,
        item: () => {
            return {
                ...props.item,
                type: ctxt.item_type
            }; 			// sent to the drop target when dropped.
        },
        end: (item: Item, monitor) => {
            const dropResult: {id: any} = monitor.getDropResult();  // the bucket we dropped on
            // Cancelled/invalid drop || same bucket => dont remove
            if(!dropResult || dropResult.id === ctxt.bucket_id) return;
            // remove from old bucket
            // TODO: for now I commented this out:
            // ctxt.dispatch({ type: "REMOVE", payload: { id: item.id } });
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        }), [props.item, ctxt.onHover]
    );

    // -----------------DROP FUNCTIONALITY-----------------

    const [{isDropTarget}, drop] = useDrop(
        () => ({
            accept: ctxt.item_type,
            canDrop: (dropItem: Item) => {
                return ctxt.disableReplace !== true && dropItem.id !== props.item.id;
            },
            drop: () => ({
                ...props.item,
                type: ctxt.item_type
            }),
            hover: (dragItem: Item, monitor) => {

                if ( !ctxt.onHover || dragItem.id === props.item.id )
                    return;

                const rect = ref.current.getBoundingClientRect();
                const dragPos = monitor.getClientOffset();

                ctxt.onHover(
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
        [props.item, ctxt.onHover]
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

    if(!ctxt) {
        throw new Error("BucketItem must be rendered inside a Bucket component.");
    }

    return (
        <div
            ref={ref}
            title="dnd-item-wrapper"
            className={"relative"}
            style={{
                opacity: isDragging ? 10 : 1,
                backgroundColor: isDropTarget ? "lightcyan" : null
            }}
        >
            {props.children}
            { isHovered &&
            <ControlsBox buttonClass={control_button_style} placement="top" controls={[
                {
                    id: "move",
                    icon_class: "fa-solid fa-grip",
                    ref: drag,
                },
                {
                    id: "delete",
                    icon_class: "fa-solid fa-x",
                    // disabled: !Boolean(ctxt.onDelete),
                    onClick: ()=>ctxt.dispatch({type: "REMOVE", payload: { id: props.item.id }})
                },
                {
                    id: "add-above",
                    icon_class: "fa-solid fa-arrow-up",
                    // disabled: !Boolean(ctxt.onAddItem),
                    // onClick: ()=>ctxt.onAddItem(props.item.id, true)
                    onClick: ()=>ctxt.dispatch({type: "ADD_BLANK", payload: { id: props.item.id, below: false }})

                },
                {
                    id: "add-below",
                    icon_class: "fa-solid fa-arrow-down",
                    // disabled: !Boolean(ctxt.onAddItem),
                    onClick: ()=>ctxt.dispatch({type: "ADD_BLANK", payload: { id: props.item.id, below: true }})
                }
            ]}/>}
        </div>
    );
};

// TODO: combine BucketItem & StandaloneDragItem (somehow)
// OR: somehow a bucket can inject features/controls into a StandaloneDragItem.
/**
 * A standalone drag item that can be used outside of a bucket.
 * It has no drop functionality, only drag.
*/
export function StandaloneDragItem(props: {
    item: Item,
    item_type: string,
    children: React.ReactNode,
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
        collect: (monitor) => ({
            isDragging: monitor.isDragging()
        }),
        }), [props.item]
    );

    preview(ref);     // Inject the dnd props into the reference

    // -----------------RENDER-----------------

    return (
        <div
            ref={ref}
            className={"relative"}
            style={{ opacity: isDragging ? 10 : 1 }}
        >
            { isHovered &&
            <ControlsBox placement="top" controls={[{
                id: "move",
                icon_class: "fa-solid fa-grip",
                ref: drag,
            }]}/>}
            {props.children}
        </div>
    );
};