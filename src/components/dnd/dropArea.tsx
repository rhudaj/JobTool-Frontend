import { useState, forwardRef, useImperativeHandle } from "react";
import { BucketTypes, DEFAULT_ITEM_TYPE, Item } from "./types";
import { useDrop } from "react-dnd";
import { StandaloneDragItem } from "./BucketItem";

export const SingleItemDropArea = forwardRef((
    props: { id: string },
    ref: React.ForwardedRef<any>
) => {

    const [item, setItem] = useState<Item>(null);

    useImperativeHandle(ref, () => ({ item }));

    const [{ isHovered }, dropRef] = useDrop(() => ({
        accept: ["summary"],
        drop: (dropItem: Item) => {
            console.log('Item dropped:', item);
            setItem(dropItem)
            // return { id: props.id };
        },
        collect: (monitor) => ({
            isHovered: monitor.isOver(),
        }),
    }), []);


    // -----------------RENDER-----------------

    return (
        <div
            title="bucket-dnd-wrapper"
            ref={dropRef as any}
            className={isHovered ? "border-dashed border-black" : ""}
        >
            <div
                title="bucket-items"
                className="min-h-10 border-1 border-dashed p-2"
            >
                { item &&
                <StandaloneDragItem item={item} item_type={""}>
                    {JSON.stringify(item.value)}
                </StandaloneDragItem>}
            </div>
        </div>
    );
});