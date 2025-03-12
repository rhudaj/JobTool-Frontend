import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useImmer } from "use-immer";

const TextItems = forwardRef((props: {
    initItems?: string[]
}, ref: React.ForwardedRef<any>) => {

    const [items, setItems] = useImmer<string[]>([]);
    const text_ref = useRef<HTMLDivElement>(null);

    useEffect(()=>setItems(props.initItems), [props.initItems]);

    useImperativeHandle(ref, () => ({
        get() { return items; }
    }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Enter') return; // only care ab
        e.preventDefault();
        const new_item = text_ref.current.textContent.trim();
        if(!new_item) return;
        if(items.find(t=>t===new_item)) return;
        setItems(draft=>{draft.push(new_item)});
        text_ref.current.innerHTML = "";
    };

    const onDeleteItem = (idx: number) => {
        setItems(draft=>{
            draft.splice(idx, 1);
        })
    }

    if (!items) return null;
    return (
        <div title="text-items" className="text-left ltr w-full h-max flex flex-col gap-20">
            <div
                title="text-input"
                className="p-20 w-full bg-white"
                ref={text_ref}
                contentEditable="true"
                onKeyDown={handleKeyDown}
            />
            <div title="items-container" className="w-full min-h-[50rem] border-1 border-dashed border-black p-20">
                { items.map((txt: string, idx: number) => (
                    <span
                        title="item"
                        className="p-3 border-1 border-dashed border-blue"
                        onDoubleClick={()=>onDeleteItem(idx)}
                    >
                        {txt}
                    </span>
                ))}
            </div>
        </div>
    )
});

export default TextItems;