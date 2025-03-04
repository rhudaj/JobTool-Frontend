import { useEffect, useRef, useState } from "react";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import TextItems from "../../../components/TextItems/TextItems";
import { useImmer } from "use-immer";
import { NamedCV } from "job-tool-shared-types";
import * as util from "../../../util/fileInOut";
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

export const ImportForm = (props: { onComplete: (ncv: NamedCV) => void }) => {
    const [ncv, setNCV] = useImmer<NamedCV>(null);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
        if (!ncv) return;
        console.log("ncv: ", ncv);
    }, [ncv]);

    // only the data not a full NamedCV json
    const onJsonFromText = (txt: string) => {
        let parsed: any;
        try {
            parsed = JSON.parse(txt);
        } catch (err: unknown) {
            setErrMsg(String(err));
            setNCV(null);
            return;
        }
        setErrMsg("");
        setNCV({
            name: "untitled",
            data: parsed,
            tags: [],
        });
    };

    const onImportNCVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        util.jsonFileImport(e, setNCV);
    };

    const onDoneClicked = () => {
        props.onComplete(ncv);
    };

    return (
        <div className="popup-content" id="import-popup">
            <p>Import from JSON</p>
            <div>
                <p>Copy and Paste</p>
                <textarea
                    className="json-paste-area"
                    placeholder="paste json"
                    onPaste={(e) =>
                        onJsonFromText(e.clipboardData.getData("Text"))
                    }
                />
                <p className="error-message">{errMsg}</p>
            </div>
            <div>
                <p>Import File</p>
                <input type="file" accept=".json" onChange={onImportNCVFile} />
            </div>
            <div>
                <button disabled={ncv === null} onClick={onDoneClicked}>
                    Done
                </button>
            </div>
        </div>
    );
};

export const FindReplaceForm = (props: { cb: (find: string, replace: string) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const find = (form.elements.namedItem("find") as HTMLInputElement).value;
        const replace = (form.elements.namedItem("replace") as HTMLInputElement).value;
        props.cb(find, replace);
    };

    return (
        <form className="popup-content" id="find-replace" onSubmit={handleSubmit}>
            <p>Find and Replace</p>
            <input type="text" name="find" placeholder="find" />
            <input type="text" name="replace" placeholder="replace" />
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
            {
                Object.entries(StyleManager.getAll()).map(([key, val]) => (
                    <div key={key}>
                        <p>{key}</p>
                        <input
                            type="number"
                            defaultValue={StyleManager.styles[key]}
                            onBlur={(e) => handleUpdate(key, Number(e.target.value))}
                        />
                    </div>
                ))
            }
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
