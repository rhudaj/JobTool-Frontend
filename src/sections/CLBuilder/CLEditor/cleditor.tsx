import "./cleditor.sass"
import { useEffect } from "react";
import ItemBucket from "../../../components/dnd/Bucket";
import { useImmer } from "use-immer";
import { DynamicComponent, Item } from "../../../components/dnd/types";

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

    const handleBucketUpdate = (newItems: Item[]) => {
        setPgs(newItems.map((I:Item)=>I.value));
    }

    return (
        <ItemBucket
            bucket={{
                id: "cl-paragraphs",
                items: pgs?.map((p: string, i: number) => ({
                    id: `cl-paragraph-${i}`,
                    value: p
                }))
            }}
            type="cl-paragraphs"
            onUpdate={handleBucketUpdate}
        >
            {
                pgs?.map((p: string, i: number)=>
                    <DynamicComponent key={i} type="cl-paragraphs" props={{obj: p}}/>
                )
            }
        </ItemBucket>
    );
}

export default CLEditor;