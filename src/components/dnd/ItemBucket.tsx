import "./ItemBucket.scss";
import { DropTargetMonitor, useDrop } from "react-dnd";
import React, { useEffect, useState } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { Item, DEFAULT_ITEM_TYPE } from "./types";
import { useImmer } from "use-immer";
import DNDItem from "./Item";
import objectHash from "object-hash";

/* Empty all values in an object (recursively) */
const emptyObject = (obj: any): any => {
	// 3 CASES
	if (Array.isArray(obj)) {
		// 1: ARRAY (RECURSIVE)
		return obj.map(emptyObject);
	} else if (typeof obj === "object" && obj !== null) {
		// 2: OBJECT (RECURSIVE)
		return Object.fromEntries(
			Object.entries(obj).map(([key, val]) => [key, emptyObject(val)])
		);
	} else if (typeof obj == "number") {
		return 0;
	} else if (typeof obj == "string") {
		return "None";
	}
};

/**
 * Shows a gap between items when dragging over the bucket.
 */
function DropGap(props: { isActive: boolean }) {
    return <div className="drop-gap" hidden={!props.isActive} />;
}

// Helpers to get the get the gap index from the item index
const prevGap = (itemIndex: number) => itemIndex;
const nextGap = (itemIndex: number) => itemIndex + 1;

// TODO: Item { idx: int, bucket: string, value: any }

/**
 * Bucket State Manager
 * @param values - initial values of the bucket
 */
const useBucket = (initVals: any[]) => {

    const [items, setItems] = useImmer<Item[]>(null);

    useEffect(()=>{
        console.log('useBucket: new values');
        setItems(initVals?.map(v => ({
            id: objectHash.sha1(v),
            value: v,
        })))
    }, [initVals])


    // -----------------STATE CONTROL-----------------

    const getIdx = (id: any) => items.findIndex(I => I.id === id);

    const getValues = () => {
        return items?.map((I) => I.value);
    };

    /**
     * Call assumes item is not already in the bucket.
     * If no item is specified, inserts an empty one.
     */
    const addItem = (atIndex: number, item?: Item) => {
        if (!item) {
            // duplicate one of the items in the bucket to get its structure.
			item = emptyObject(items[0]); // deep copy
        }
        setItems((draft) => {
            draft.splice(atIndex, 0, item);
        });
    };

    const addBlankItem = (id: any, below: boolean) => {
        // TODO: for now just duplicate the item (since we don't know the format)
        let srcIndex = items.findIndex(I => I.id === id);
        const index2add = srcIndex + (below ? 1 : 0);
        addItem(index2add);
    }

    const moveItem = (indexBefore: number, indexAfter: number) => {
        setItems((draft) => {
            const [movedItem] = draft.splice(indexBefore, 1);
            draft.splice(indexAfter, 0, movedItem);
        });
    };

    const removeItem = (id: any) => {
        setItems((draft) => {
            draft.splice(getIdx(id), 1);
        });
    };

    const changeItemValue = (id: any, newValue: any) => {
        setItems((draft) => {
            draft[getIdx(id)].value = newValue;
        });
    };

    return { items, getValues, addItem, addBlankItem, moveItem, removeItem, changeItemValue, getIdx };
};


// Provided to the children of a bucket (<DNDItem>'s)
interface BucketItemContext {
    bucket_id: string,
    item_type: string,
    disableReplace?: boolean,
    onDelete?: (id: any) => void,
    onAddItem?: (id: any, below: boolean) => void,
    onHover?: (hoverId: string, dragId: string, isBelow: boolean, isRight: boolean) => void,
    onRemove?: (dragId: any) => void;
};

/**
 * Bucket of DND Items component
 * @param props
 * @returns
 * TODO: hover and drop only works when over an item, not if there is empty space at the bottom of all items
 * TODO: controls should be put here next to each item (since they only make sense if the item is in a bucker)
 */
function ItemBucket(props: {
    id: any;
    values: any[];
    children: JSX.Element[];
    isVertical: boolean;
    displayItemsClass?: string;
    item_type?: string;
    onUpdate?: (newValues: any[]) => void;
    deleteDisabled?: boolean;
    replaceDisabled?: boolean;
    dropDisabled?: boolean;
    deleteOnMoveDisabled?: boolean;
}) {
    // ----------------- STATE -----------------

    const bucket = useBucket(props.values);

    const [hoveredGap, setHoveredGap] = React.useState<number | undefined>(undefined);

    React.useEffect(() => {
        if (!bucket.items || !props.onUpdate) return;
        const newValues = bucket.getValues();
        if (JSON.stringify(newValues) == JSON.stringify(props.values)) return;  // needed, else maximum depth! TODO:
        props.onUpdate(newValues); // && items != bucket.items
    }, [bucket.items]);

    // ----------------- DND RELATED -----------------

    const onItemHover = (hoverId: string, dragId: string, isBelow: boolean, isRight: boolean) => {

        // if (props.dropDisabled) return; // TODO: bring this check outside.

        // Wether its "past half" depends on orientation of the bucket
        const isPastHalf = props.isVertical ? isBelow : isRight;

        // Find the index of the item being hovered over:
        const hoveredIndex = bucket.getIdx(hoverId);
        const dragIndex = bucket.getIdx(dragId);

        // Find the corresponding gap:
        let gapIndex = isPastHalf ? nextGap(hoveredIndex) : prevGap(hoveredIndex);

        const diff = dragIndex - gapIndex;

        // Is the gap is around the current dragItem ?
        if (diff === 0 || diff === -1) {
            gapIndex = undefined;
        }

        setHoveredGap(gapIndex); // Only sets the new value if they differ (by VALUE)
    };

    const [{ isHovered }, dropRef] = useDrop(
        () => ({
            accept: props.item_type ?? DEFAULT_ITEM_TYPE,
            canDrop: () => !props.dropDisabled,
            drop: (
                dropItem: Item,
                monitor: DropTargetMonitor<Item, unknown>
            ) => {
                // An item was dropped on the bucket (or a nested drop target).

                if (bucket.items.length === 0) {
                    bucket.addItem(0, dropItem);
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
                    // => nested item handled the drop
                    bucket.changeItemValue(nestedDropTarget.id, dropItem.value);
                } else if (notInBucket) {
                    // Not in the bucket yet, so add it.
                    bucket.addItem(hoveredGap, dropItem);
                } else if (bucket.moveItem) {
                    // Its in the bucket already, and we've dropped it somewhere else inside
                    // that's not over another item. So re-order.
                    // CLAMP index between 0 and props.items.length-1
                    let newIndex = Math.max(
                        Math.min(hoveredGap, bucket.items.length - 1),
                        0
                    );
                    bucket.moveItem(itemIndex, newIndex);
                }
                // after drop, no need to display the gap
                if (hoveredGap !== undefined) setHoveredGap(undefined);

                // (optional) returned item will be the 'dropResult' and available in 'endDrag'
                return { id: props.id };
            },
            collect: (monitor) => ({
                isHovered: !props.dropDisabled && monitor.isOver(),
            }),
        }),
        // dependency array - if any of these values change, the above object will be recreated.
        [bucket.items, hoveredGap]
    );

    // -----------------RENDER-----------------

    if (!bucket.items) {
        return null
    }

    const classes = joinClassNames(
        "bucket-wrapper",
        isHovered ? "hover" : ""
    );

    return (
        <div ref={dropRef} className={classes} onMouseLeave={()=>setHoveredGap(undefined)}>
            <div className={props.displayItemsClass}>
                {bucket.items.map((I: Item, i: number) => (
                    <>
                        { i === 0 && <DropGap isActive={hoveredGap === prevGap(i)} /> }
                        <BucketContext.Provider value={{
                            bucket_id: props.id,
                            item_type: props.item_type ?? DEFAULT_ITEM_TYPE,
                            disableReplace: props.replaceDisabled,
                            onDelete: !props.deleteDisabled && bucket.removeItem,
                            onAddItem: bucket.addBlankItem,
                            onHover: !props.dropDisabled && onItemHover,
                            onRemove: !props.deleteOnMoveDisabled && bucket.removeItem,
                        }}>
                            <DNDItem key={i} item={I} children={props.children[i]}/>
                        </BucketContext.Provider>
                        <DropGap isActive={hoveredGap === nextGap(i)} />
                    </>
                ))}
            </div>
        </div>
    );
}

export const BucketContext = React.createContext<BucketItemContext>(null);
export default ItemBucket;
