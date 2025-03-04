import { useEffect, useRef, useState } from "react";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import TextItems from "../../../components/TextItems/TextItems";
import { NamedCV } from "job-tool-shared-types";
import { StyleManager } from "../CVEditor/styles";

import { useForm, SubmitHandler } from "react-hook-form"

export const SaveForm = (props: {
    name: string;
    tags: string[];
    onSave: (name: string, tags: string[]) => void;
    disabled?: boolean;
}) => {
    const [name, setName] = useState(null);
    const [tags, setTags] = useState(null);
    const tags_ref = useRef(null);
    const [isNameValid, setIsNameValid] = useState(true);
    const [reason, setReason] = useState("File exists. Will overwrite!");

    useEffect(() => setName(props.name), [props.name]);
    useEffect(() => setTags(props.tags), [props.tags]);

    // Handle name input
    const handleNameChange = (newName: string) => {
        setName(newName);
        const isValid = newName && newName != "";
        setIsNameValid(isValid);
        setReason(
            !isValid
                ? "Invalid file name!"
                : newName === name
                ? "File exists. Will overwrite!"
                : ""
        );
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        props.onSave(name, tags_ref.current.get());
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "5rem" }}
        >
            <p>File Name:</p>
            <TextEditDiv tv={name} onUpdate={handleNameChange} />
            <p style={{ color: isNameValid ? "grey" : "black" }}>{reason}</p>

            <p>Tags (optional):</p>
            <TextItems initItems={tags} ref={tags_ref} />

            <button type="submit" disabled={!isNameValid}>
                Save
            </button>
        </form>
    );
};


interface ImportForm {
    name: string
    pasted_text: string
}
export const ImportForm = (props: { cb: (ncv: NamedCV) => void }) => {

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ImportForm>()

    const onSubmit: SubmitHandler<ImportForm> = (data) => {
        console.log(`form data: `, data)
        if(data.pasted_text) {
            let parsed: any;
            try {
                parsed = JSON.parse(data.pasted_text);
                props.cb({
                    name: data.name,
                    path: "/",
                    data: parsed,
                    tags: [],
                })
            } catch (err: unknown) {
                console.log("Error with your pasted text!")
            }
        }
    }

    return (
        <form className="popup-content" id="import-popup" onSubmit={handleSubmit(onSubmit)}>

            <label>Copy/Paste</label>
            <textarea
                {...register("pasted_text", {required: true})}
                className="json-paste-area"
                placeholder="paste json"
            />
            {errors.pasted_text && <span>field required</span>}

            <label>Name</label>
            <input type="text" defaultValue="untitled" {...register("name", { required: true })}/>

            <button type="submit">Done</button>
        </form>
    );
};



interface FindReplaceFormInput {
    find: string
    replace: string
}
export const FindReplaceForm = (props: { cb: (data: FindReplaceFormInput) => void }) => {

    const {
        register,
        handleSubmit, // validates input before calling `onSubmit`
        formState: { errors },
    } = useForm<FindReplaceFormInput>()
    const onSubmit: SubmitHandler<FindReplaceFormInput> = props.cb

    return (
        <form className="popup-content" id="find-replace" onSubmit={handleSubmit(onSubmit)}>
            {/* FIND TEXT */}
            <input type="text" placeholder="find" {...register("find", { required: true })} />
            {errors.find && <span>field required</span>}

            {/* REPLACE TEXT */}
            <input type="text" placeholder="replace" {...register("replace", { required: true })} />
            {errors.replace && <span>field required</span>}

            <button type="submit">Go</button>
        </form>
    );
};

export const StylesForm = () => {

    const handleUpdate = (key: string, val: number) => {
        console.log(`(Styles) Updating ${key} to ${val}`);
        StyleManager.set(key as any, val);
    };

    return (
        <form className="popup-content" id="styles-form">
            {Object.entries(StyleManager.getAll()).map(([key, val]) => (
                <>
                    <label>{key}</label>
                    <input
                        type="number"
                        defaultValue={StyleManager.styles[key]}
                        onBlur={(e) => handleUpdate(key, Number(e.target.value))}
                    />
                </>
            ))}
        </form>
    )
};

// If TEST_MODE is enabled
export const SaveTrainingExampleForm = (props: { onSave: (job: string) => void }) => {

    const [job, setJob] = useState<string>(null);
    return (
        <div className="popup-content">
            <p>Save Training Example</p>
            <textarea
                className="job-paste-area"
                placeholder="paste job description"
                onBlur={(e) => setJob(e.target.value)}
            />
            <button disabled={job === null} onClick={() => props.onSave(job)}>
                Save
            </button>
        </div>
    );
};
