import { Button } from "@headlessui/react";
import { SingleItemDropArea } from "../../components/dnd/dropArea";
import { useRef, useState } from "react";
import BackendAPI from "../../backend_api";
import { StandaloneDragItem } from "../../components/dnd/BucketItem";
import { BucketTypes } from "../../components/dnd/types";

export function AIEditPane(props: {}) {
    const itemRef = useRef(null);
    const [AIResponse, setAIResponse] = useState(null);
    const [job, setJob] = useState("");

    const onJobDescriptionBlur = (e) => {
        setJob(e.target.value);
    };

    const handleSubmit = () => {
        const cur = itemRef.current;
        console.log("AI Editing this item: ", cur.value);
        BackendAPI.request({
            method: "POST",
            endpoint: "AI/EditItem",
            body: {
                item: cur.value,
                description: `id=${cur.id}, type=${cur.type}`,
                job: job,
            },
        })
            .then(result => {
                setAIResponse(result)
                setJob(null)
            })
            .catch(alert);
    };

    return (
        <div className="grid grid-cols-[1fr_1fr]">
            <div title="drop-area" className="flex flex-col gap-2 border-1 p-2">
                <SingleItemDropArea ref={itemRef} id="ai-edit-item" />
                <label>Job Description:</label>
                <input
                    type="text"
                    className="border-1"
                    onBlur={onJobDescriptionBlur}
                ></input>
                <Button className="mt-4" onClick={handleSubmit}>
                    Go
                </Button>
            </div>
            <div title="ai-response" className="border-1 p-2">
                {AIResponse &&
                <StandaloneDragItem
                    item={{ id: `${itemRef.current.id}-tailored`, value: AIResponse }}
                    item_type={itemRef.current.type}
                >
                    {BucketTypes[itemRef.current.type].DisplayItem({obj: AIResponse}) }
                </StandaloneDragItem>}
            </div>
        </div>
    );
}
