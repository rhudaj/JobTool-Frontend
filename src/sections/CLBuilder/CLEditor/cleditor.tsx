import "./cleditor.sass"
import { useEffect, useReducer } from "react";
import ItemBucket from "../../../components/dnd/Bucket";
import { useImmer } from "use-immer";
import { DynamicComponent, Item } from "../../../components/dnd/types";
import { BucketContext, BucketDispatchContext, bucketReducer } from "../../../components/dnd/useBucket";

function CLEditor(props: {
    paragraphs: string[],
}) {

    const [pgs, setPgs] = useImmer<string[]>(null);

    const [bucket, bucketDispatch] = useReducer(bucketReducer, {
        id: "cl-paragraphs",
        items: pgs?.map((p: string, i: number) => ({
            id: `cl-paragraph-${i}`,
            value: p
        }))
	});

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
        <BucketContext.Provider value={bucket}>
        <BucketDispatchContext.Provider value={bucketDispatch}>
            <ItemBucket>
                {pgs?.map((p: string, i: number)=>
                    <DynamicComponent key={i} type="cl-paragraphs" props={{obj: p}}/>
                )}
            </ItemBucket>
        </BucketDispatchContext.Provider>
        </BucketContext.Provider>
    );
}

export default CLEditor;