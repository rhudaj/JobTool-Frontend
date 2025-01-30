import "./BucketItem.scss"
import { useDrag, useDrop } from "react-dnd";
import React, { useContext } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { Item } from "./types";
import ItemControlsContainer from "./ItemControls";
import { BucketContext } from "./Bucket";

export default function BucketItem(props: { item: Item, children: JSX.Element }) {

    const bucketContext = useContext(BucketContext);

    // -------------------- STATE ---------------------

    const ref = React.useRef(null);

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

    // -----------------RENDER-----------------

    const classNames = joinClassNames(
        "dnd-item-wrapper",
        isDragging ? "dragging" : "", isDropTarget ? "droppable": "",
        "can-drag" // props.disableDrag === true ? "no-drag" : "can-drag"
    );

    return (
        <>
            <div ref={ref} className={classNames}>
                {props.children}
            </div>
            <ItemControlsContainer ref={ref}>
                <div ref={drag} className="move-handle">M</div>
                { bucketContext.onDelete &&
                <div className="delete-button" onClick={()=>bucketContext.onDelete(props.item.id)}>X</div>}
                { bucketContext.onAddItem &&
                    <>
                    <div className="add-item" onClick={()=>bucketContext.onAddItem(props.item.id, true)}>↓</div>
                    <div className="add-item" onClick={()=>bucketContext.onAddItem(props.item.id, false)}>↑</div>
                    </>
                }
            </ItemControlsContainer>
        </>
    );
};

// Drag only, can't be Dropped on. Only has Move Controls
export function StandaloneItem(props: {
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
        "dnd-item-wrapper",
        isDragging ? "dragging" : "",
    );

    return (
        <>
            <div ref={ref} className={classNames}>
                {props.children}
            </div>
            <ItemControlsContainer ref={ref}>
                <div ref={drag} className="move-handle">M</div>
            </ItemControlsContainer>
        </>
    );
};