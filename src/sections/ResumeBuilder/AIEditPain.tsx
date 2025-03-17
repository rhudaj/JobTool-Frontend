import { Button } from "@headlessui/react";
import { SingleItemDropArea } from "../../components/dnd/dropArea";
import { useRef, useState } from "react";
import BackendAPI from "../../backend_api";
import { StandaloneDragItem } from "../../components/dnd/BucketItem";
import { BucketTypes } from "../../components/dnd/types";

export function AIEditPane(props: {}) {

    const dropAreaRef = useRef(null);
    const [AIResponse, setAIResponse] = useState(null);

    const handleSubmit = () => {
        const item = dropAreaRef.current.item;
        BackendAPI.request({
            method: "POST",
            endpoint: "cv_info",
            body: item,
        })
        .then(setAIResponse)
        .catch(alert)
    };

    return (
        <div className="grid grid-cols-[1fr_1fr]">
            <div title="drop-area" className="border-1 p-2">
                <SingleItemDropArea ref={dropAreaRef} id="ai-edit-item"/>
                <Button className="mt-4">Go</Button>
            </div>
            <div title="ai-response" className="border-1 p-2">
                <StandaloneDragItem item={AIResponse} item_type="summary">
                    { JSON.stringify(AIResponse) }
                </StandaloneDragItem>
            </div>
        </div>
    )
};