import "./textitems.sass"
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useImmer } from "use-immer";

const TextItems = forwardRef((props: {
    initItems?: string[]
}, ref: React.ForwardedRef<any>) => {

    const [items, setItems] = useImmer<string[]>(props.initItems ?? []);
    const text_ref = useRef<HTMLDivElement>(null);

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

    const Item = (txt: string, idx: number) => (
        <span className="item" onDoubleClick={e=>onDeleteItem(idx)}>
            {txt}
        </span>
    )

    return (
        <div className="text-items">
            <div className="text-input"
                ref={text_ref}
                contentEditable="true"
                onKeyDown={handleKeyDown}
            />
            <div className="items-container">
                {items.map(Item)}
            </div>
        </div>
    )
});

export default TextItems;