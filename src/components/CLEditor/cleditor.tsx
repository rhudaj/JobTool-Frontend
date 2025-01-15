import "./cleditor.sass"
import { useEffect } from "react";
import TextEditDiv from "../TextEditDiv/texteditdiv";
import ItemBucket from "../dnd/ItemBucket";
import { useImmer } from "use-immer";
import { TrackVal } from "../../hooks/trackable";

function CLEditor(props: {
    paragraphs: string[],
}) {

    const [pgs, setPgs] = useImmer<string[]>(null);

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
                    <TextEditDiv key={i} id={`cl-row-${i}`} tv={new TrackVal<string>(p)}/>
                ))
            }
        </ItemBucket>
    );
}

export default CLEditor;