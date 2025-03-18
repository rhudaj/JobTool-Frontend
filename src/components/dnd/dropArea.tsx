import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { BucketTypes, DEFAULT_ITEM_TYPE, Item } from "./types";
import { useDrop } from "react-dnd";
import { StandaloneDragItem } from "./BucketItem";

export function SingleItemDropArea(props: {
    id: string,
    onUpdate: (state: Item & { type: string }) => void,
}){

    const [state, setState] = useState<Item & { type: string }>(null);

    useEffect(()=>{
        if(!state || !state.value || !state.id) return;
        props.onUpdate(state);
    }, [state]);

    const [{ isHovered }, dropRef] = useDrop(() => ({
        accept: Object.keys(BucketTypes),
        drop: (dropItem: Item & { type: string }) => {
            console.log('Item dropped:', dropItem);
            setState(dropItem)
        },
        collect: (monitor) => ({
            isHovered: monitor.isOver(),
        }),
    }), []);


    // ----------------- VIEW -----------------

    return (
        <div
            title="drop-area"
            ref={dropRef as any}
            className={isHovered ? "border-dashed border-black" : ""}
        >
            <div
                title="bucket-items"
                className="min-h-10 border-1 border-dashed p-2"
            >
                { state &&
                <StandaloneDragItem item={state} item_type={state.type}>
                    {BucketTypes[state.type].DisplayItem({obj: state.value })}
                </StandaloneDragItem>}
            </div>
        </div>
    );
};