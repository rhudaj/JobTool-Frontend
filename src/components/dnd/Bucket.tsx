import "./Bucket.scss";
import { DropTargetMonitor, useDrop } from "react-dnd";
import React, { useContext, useEffect, useReducer } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { Item, DEFAULT_ITEM_TYPE, BucketTypes, Bucket } from "./types";
import BucketItem from "./BucketItem";
import { BucketAction, BucketContext, BucketActions, bucketReducer } from "./useBucket";

// Shows a gap between items when dragging over the bucket.
function DropGap(props: { isActive: boolean }) {
    return <div className="drop-gap" hidden={!props.isActive} />;
}

// Helpers to get the get the gap index from the item index
const prevGap = (itemIndex: number) => itemIndex;
const nextGap = (itemIndex: number) => itemIndex + 1;

// #####################################################
//                  BUCKET STATE MANAGEMENT
// #####################################################

// Provided to the children of a bucket (<DNDItem>'s)
interface BucketItemContext {
    bucket_id: string;
    item_type: string;
    disableReplace?: boolean;
    disableMove?: boolean;
    dispatch: React.Dispatch<BucketAction>;
    onHover?: (
        hoverId: string,
        dragId: string,
        isBelow: boolean,
        isRight: boolean
    ) => void;
}

let just_set = false; // TODO: hacky but neccessary
function ItemBucket(props: {
    id: string
    items: Item[]
    type?: string                       // by default, same as ID
    onUpdate?: (newVals: any[]) => void
    children: JSX.Element[]             // the bucket data d.n.n corresponding to the displayed items.
    isHorizontal?: boolean              // orientation of the bucket
    // TODO: put inside 'disable_options' object
    deleteDisabled?: boolean
    replaceDisabled?: boolean
    dropDisabled?: boolean
    deleteOnMoveDisabled?: boolean
    addItemDisabled?: boolean
    moveItemDisabled?: boolean
}) {
    // ----------------- STATE -----------------

    const [bucket, bucketDispatch] = useReducer(bucketReducer, { id: "", items: [] })

    // parent -> bucket
    useEffect(() => {
        just_set = true
        bucketDispatch({
            type: BucketActions.SET,
            payload: {
                id: props.id,
                items: props.items
            } })
    }, [props.items, props.id])

    // bucket -> parent
    useEffect(()=>{
        if(just_set) {
            just_set = false
            return
        }
        props.onUpdate?.(bucket.items.map(I=>I.value))
    }, [bucket.items])

    const [hoveredGap, setHoveredGap] = React.useState<number>(undefined);

    // ----------------- DND RELATED -----------------

    const getIdx = (id: any) => bucket.items.findIndex(I => I.id === id);

    const [{ isHovered }, dropRef] = useDrop(
        () => ({
            accept: props.type ?? DEFAULT_ITEM_TYPE,
            canDrop: () => !props.dropDisabled,
            drop: (
                dropItem: Item,
                monitor: DropTargetMonitor<Item, unknown>
            ) => {
                // An item was dropped on the bucket (or a nested drop target).

                // If the bucket is empty, just add the item.
                if (bucket.items.length === 0) {
                    bucketDispatch({ type: BucketActions.ADD, payload: { atIndex: 0, item: dropItem } });
                    return;
                }

                // drop was ON TOP of a nested item?
                const nestedDropTarget: any = monitor.getDropResult();

                // bucket ALREADY holds it?
                const itemIndex = bucket.items.findIndex(
                    (item) => item.id === dropItem.id
                );
                const notInBucket = itemIndex === -1;

                if (nestedDropTarget?.id !== undefined) {
                    // nested item got the drop
                    bucketDispatch({ type: BucketActions.CHANGE, payload: { id: nestedDropTarget.id, newValue: dropItem.value } });
                } else if (notInBucket) {
                    // Not in the bucket yet, so add it.
                    bucketDispatch({ type: BucketActions.ADD, payload: { atIndex: hoveredGap, item: dropItem } });
                } else if (!props.moveItemDisabled) {
                    // Its in the bucket already. Re-order.
                    // CLAMP index between 0 and props.items.length-1
                    let newIndex = Math.max(
                        Math.min(hoveredGap, bucket.items.length - 1),
                        0
                    );
                    bucketDispatch({ type: BucketActions.MOVE, payload: { indexBefore: itemIndex, indexAfter: newIndex } });
                }
                // after drop, no need to display the gap
                if (hoveredGap !== undefined) setHoveredGap(undefined);

                // (optional) returned item will be the 'dropResult' and available in 'endDrag'
                return { id: bucket.id };
            },
            collect: (monitor) => ({
                isHovered: !props.dropDisabled && monitor.isOver(),
            }),
        }),
        // dependency array - if any of these values change, the above object will be recreated.
        [bucket?.items, hoveredGap]
    );

    const onItemHover = (
        hoverId: string,
        dragId: string,
        isBelow: boolean,
        isRight: boolean
    ) => {

        // Wether its "past half" depends on orientation of the bucket
        const isPastHalf = props.isHorizontal ? isRight : isBelow;

        // Find the index of the item being hovered over:
        const hoveredIndex = getIdx(hoverId);
        const dragIndex = getIdx(dragId);

        // Find the corresponding gap:
        let gapIndex = isPastHalf
            ? nextGap(hoveredIndex)
            : prevGap(hoveredIndex);

        const diff = dragIndex - gapIndex;

        // Is the gap is around the current dragItem ?
        if (diff === 0 || diff === -1) {
            gapIndex = undefined;
        }

        setHoveredGap(gapIndex); // Only sets the new value if they differ (by VALUE)
    };

    // -----------------RENDER-----------------

    if (!bucket?.items || props.children.length !== bucket.items.length)
        return null;

    const classes = joinClassNames("bucket-wrapper", isHovered ? "hover" : "");

    return (
        <div
            ref={dropRef}
            className={classes}
            onMouseLeave={() => setHoveredGap(undefined)}
        >
            <div className={BucketTypes[props.type ?? bucket.id].layoutClass}>
                {bucket.items.map((I: Item, i: number) => {
                    return (
                        <div key={`bucket-${bucket.id}-item-${i}`}>
                            {i === 0 && (
                                <DropGap isActive={hoveredGap === prevGap(i)} />
                            )}
                            <BucketItemContext.Provider
                                value={{
                                    bucket_id: bucket.id,
                                    item_type: props.type ?? DEFAULT_ITEM_TYPE,
                                    disableMove: props.moveItemDisabled,
                                    disableReplace: props.replaceDisabled,
                                    dispatch: bucketDispatch,
                                    onHover: !props.dropDisabled && onItemHover,
                                }}
                            >
                                <BucketItem item={I}>
                                    {props.children[i]}
                                </BucketItem>
                            </BucketItemContext.Provider>
                            <DropGap isActive={hoveredGap === nextGap(i)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const BucketItemContext = React.createContext<BucketItemContext>(null);
export default ItemBucket;
