import "./textitems.sass"
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
        <div className="text-items">
            <div className="text-input"
                ref={text_ref}
                contentEditable="true"
                onKeyDown={handleKeyDown}
            />
            <div className="items-container">
                { items.map((txt: string, idx: number) => (
                    <span className="item" onDoubleClick={()=>onDeleteItem(idx)}>
                        {txt}
                    </span>
                ))}
            </div>
        </div>
    )
});

export default TextItems;