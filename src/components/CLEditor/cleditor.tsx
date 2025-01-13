import "./cleditor.sass"
import { useEffect } from "react";
import TextEditDiv from "../TextEditDiv/texteditdiv";
import ItemBucket from "../dnd/ItemBucket";
import { useImmer } from "use-immer";

function CLEditor(props: {
    paragraphs: string[],
}) {

    const [pgs, setPgs] = useImmer<string[]>([]);

    useEffect(()=> {
        setPgs(props.paragraphs);
    }, [props.paragraphs]);

    return (
        <ItemBucket
            id="cl-paragraphs"
            values={pgs}
            isVertical={true}
            displayItemsClass="cl-editor"
            item_type="cl-item"
            onUpdate={newVals => setPgs(newVals)}
        >
            {
                pgs?.map((p: string, i: number)=>(
                    <TextEditDiv key={i} id={`cl-row-${i}`} tv={p}/>
                ))
            }
        </ItemBucket>
    );
}

export default CLEditor;