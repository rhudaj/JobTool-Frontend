import "./cleditor.sass"
import { useEffect } from "react";
import ItemBucket from "../../../components/dnd/Bucket";
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

    const handleItemChange = (i: number, newVal: any) => {
        setPgs(draft => {
            draft[i] = newVal;
        })
    };

    return (
        <></>
        // <ItemBucket
        //     id="cl-paragraphs"
        //     values={pgs}
        //     onItemChange={handleItemChange}
        //     onUpdate={setPgs}
        // />
    );
}

export default CLEditor;