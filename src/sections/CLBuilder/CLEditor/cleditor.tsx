import "./cleditor.sass"
import { useEffect } from "react";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import ItemBucket from "../../../components/dnd/ItemBucket";
import { useImmer } from "use-immer";

function CLEditor(props: {
    paragraphs: string[],
}) {

    const [pgs, setPgs] = useImmer<string[]>(null);

    useEffect(()=> {
        setPgs([
            "First Last",
            "City, State",
            "username@email.come",
            "",
            new Date().toDateString(),
            "Dear Hiring Manager",
            ...(props.paragraphs ? props.paragraphs : [])
        ]);
    }, [props.paragraphs]);

    return (
        <ItemBucket
            id="cl-paragraphs"
            values={pgs}
            type={{
                isVertical: true,
                displayItemsClass: "cl-editor",
                item_type: "cl-item",
                DisplayItem: ()=><></>
            }}
            onUpdate={newVals => setPgs(newVals)}
        >
            {
                pgs?.map((p: string, i: number)=>(
                    <TextEditDiv key={i} id={`cl-row-${i}`} tv={p} onUpdate={newVal => {
                        setPgs(draft => {
                            draft[i] = newVal;
                        })
                    }}/>
                ))
            }
        </ItemBucket>
    );
}

export default CLEditor;