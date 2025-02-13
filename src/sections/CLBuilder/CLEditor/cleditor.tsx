import "./cleditor.sass"
import { useEffect, useReducer } from "react";
import ItemBucket from "../../../components/dnd/Bucket";
import { useImmer } from "use-immer";
import { BucketTypeNames, DynamicComponent, Item } from "../../../components/dnd/types";
import { BucketContext, bucketReducer } from "../../../components/dnd/useBucket";

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
        <BucketContext.Provider value={[bucket,bucketDispatch]}>
            <ItemBucket type={BucketTypeNames.CL_PARAGRAPHS}>
                {pgs?.map((p: string, i: number)=>
                    <DynamicComponent key={i} type={BucketTypeNames.CL_PARAGRAPHS} props={{obj: p}}/>
                )}
            </ItemBucket>
        </BucketContext.Provider>
    );
}

export default CLEditor;