import "./cleditor.sass"
import { useEffect } from "react";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import ItemBucket from "../../../components/dnd/ItemBucket";
import { useImmer } from "use-immer";
import { BucketTypes } from "../../../components/dnd/types";

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

    const bt = BucketTypes["cl-paragraphs"]

    return (
        <ItemBucket
            id="cl-paragraphs"
            values={pgs}
            type={bt}
            DisplayItem={bt.DisplayItem}
            onItemChange={(i, newVal) => {
                setPgs(draft => {
                    draft[i] = newVal;
                })
            }}
            onUpdate={newVals => setPgs(newVals)}
        />
    );
}

export default CLEditor;