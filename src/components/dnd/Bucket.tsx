import "./Bucket.scss";
import { DropTargetMonitor, useDrop } from "react-dnd";
import React, { useReducer } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { Item, DEFAULT_ITEM_TYPE, BucketTypes, Bucket } from "./types";
import BucketItem from "./BucketItem";
import { isEqual } from "lodash";
import { ADD, BucketAction, bucketReducer, CHANGE, MOVE } from "./useBucket";

// TODO: bucket should not have internal state. It should simply be a wrapper around the items that its passed.
// At the moment, you being passes items. Then creating internal state. Then updating internal state, then notifying the parent of the change.
// And then the parent updates the items. This is a bit convoluted. The bucket should simply be a wrapper around the items.

/**
 * Shows a gap between items when dragging over the bucket.
 */
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

function ItemBucket(props: {
    bucket: Bucket;
    children: JSX.Element[];                // the bucket data d.n.n corresponding to the displayed items.
    type?: string;                          // by default, same as ID
    onUpdate?: (newItems: Item[]) => void;  // when the `Bucket` data changes.
    deleteDisabled?: boolean;
    replaceDisabled?: boolean;
    dropDisabled?: boolean;
    deleteOnMoveDisabled?: boolean;
    addItemDisabled?: boolean;
    moveItemDisabled?: boolean;
}) {
    // ----------------- STATE -----------------

    const [bucket, bucketDispatch] = useReducer(bucketReducer, { items: props.bucket.items });
    const [hoveredGap, setHoveredGap] = React.useState<number>(undefined);

    React.useEffect(() => {
        if (!bucket.items) return;
        if (isEqual(bucket.items, props.bucket.items)) return;
        props.onUpdate?.(bucket.items);
    }, [bucket.items]);

    const type = BucketTypes[props.type ?? props.bucket.id];

    const getIdx = (id: any) => bucket.items.findIndex(I => I.id === id);

    // ----------------- DND RELATED -----------------

    const onItemHover = (
        hoverId: string,
        dragId: string,
        isBelow: boolean,
        isRight: boolean
    ) => {
        // Wether its "past half" depends on orientation of the bucket
        const isPastHalf = type.isVertical ? isBelow : isRight;

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

    const [{ isHovered }, dropRef] = useDrop(
        () => ({
            accept: type.item_type ?? DEFAULT_ITEM_TYPE,
            canDrop: () => !props.dropDisabled,
            drop: (
                dropItem: Item,
                monitor: DropTargetMonitor<Item, unknown>
            ) => {
                // An item was dropped on the bucket (or a nested drop target).

                // If the bucket is empty, just add the item.
                if (bucket.items.length === 0) {
                    bucketDispatch({ type: ADD, payload: { atIndex: 0, item: dropItem } });
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
                    bucketDispatch({ type: CHANGE, payload: { id: nestedDropTarget.id, newValue: dropItem.value } });
                } else if (notInBucket) {
                    // Not in the bucket yet, so add it.
                    // bucket.addItem(hoveredGap, dropItem);
                    bucketDispatch({ type: ADD, payload: { atIndex: hoveredGap, item: dropItem } });
                } else if (!props.moveItemDisabled) {
                    // Its in the bucket already. Re-order.
                    // CLAMP index between 0 and props.items.length-1
                    let newIndex = Math.max(
                        Math.min(hoveredGap, bucket.items.length - 1),
                        0
                    );
                    bucketDispatch({ type: MOVE, payload: { indexBefore: itemIndex, indexAfter: newIndex } });
                }
                // after drop, no need to display the gap
                if (hoveredGap !== undefined) setHoveredGap(undefined);

                // (optional) returned item will be the 'dropResult' and available in 'endDrag'
                return { id: props.bucket.id };
            },
            collect: (monitor) => ({
                isHovered: !props.dropDisabled && monitor.isOver(),
            }),
        }),
        // dependency array - if any of these values change, the above object will be recreated.
        [bucket.items, hoveredGap]
    );

    // -----------------RENDER-----------------

    if (!bucket.items || props.children.length !== bucket.items.length)
        return null;

    const classes = joinClassNames("bucket-wrapper", isHovered ? "hover" : "");

    return (
        <div
            ref={dropRef}
            className={classes}
            onMouseLeave={() => setHoveredGap(undefined)}
        >
            <div className={type.displayItemsClass}>
                {bucket.items.map((I: Item, i: number) => {
                    return (
                        <div key={`bucket-${props.bucket.id}-item-${i}`}>
                            {i === 0 && (
                                <DropGap isActive={hoveredGap === prevGap(i)} />
                            )}
                            <BucketContext.Provider
                                value={{
                                    bucket_id: props.bucket.id,
                                    item_type:
                                        type.item_type ?? DEFAULT_ITEM_TYPE,
                                    disableMove: props.moveItemDisabled,
                                    disableReplace: props.replaceDisabled,
                                    dispatch: bucketDispatch,
                                    onHover: !props.dropDisabled && onItemHover,
                                }}
                            >
                                <BucketItem item={I}>
                                    {props.children[i]}
                                </BucketItem>
                            </BucketContext.Provider>
                            <DropGap isActive={hoveredGap === nextGap(i)} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const BucketContext = React.createContext<BucketItemContext>(null);
export default ItemBucket;
