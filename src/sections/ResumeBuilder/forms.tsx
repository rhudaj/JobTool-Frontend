import { useEffect, useState } from "react";
import TextItems from "../../components/TextItems";
import { CVMetaInfo, NamedCV } from "job-tool-shared-types";
import { StyleManager } from "./CVEditor/styles";
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { CustomStyles } from "../../styles";

/**
 * Notes on "react-hook-form"
 * --------------------------
 * `register`
 *
 *      SOURCE: https://react-hook-form.com/docs/useform/register
 *      WHAT? method to register an input|select element & apply validation rules to React Hook Form.
 *      EXAMPLE: register('name', { required: true })
 *      RETURNS: { ref, name, onChange, onBlur }
 *
*/

interface SaveFormInput extends CVMetaInfo {}
export const SaveForm = (props: {
    cvInfo: CVMetaInfo
    onSave: (formData: SaveFormInput) => void;
    disabled?: boolean
    saveAnnotation?: boolean
}) => {

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<SaveFormInput>({
        defaultValues: {
            name: "untitled",
            path: "/",
            tags: []
        },
        values: props.cvInfo,
        resolver: async (data) => {
            // Custom validation
            const errors: Record<string, { message: string }> = {};
            if (!data.name) errors.name = { message: "File name required!" };
            if (!data.path) errors.path = { message: "Path required!" };
            return { values: data, errors };
        }
    });

    return (
        <form
            className="grid grid-cols-[max-content_1fr] gap-x-10"
            onSubmit={handleSubmit(props.onSave)}
            onChange={(e)=>console.log('SAVE FORM CHANGED: ', (e.target as any).value)}
        >

            {/* FIELD #1 -- NAME */}
            <label>File Name:</label>
            <div>
                <input name="file-name" type="text" {...register('name')} />
                <p>{errors.name?.message}</p>
            </div>

            {/* FIELD #2 -- PATH */}
            <label>Path:</label>
            <div>
                <input name="path" type="text" {...register('path')} />
                <p>{errors.path?.message}</p>
            </div>

            {/* FIELD #3 -- TAGS */}
            <label>Tags:</label>
            <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                    <TextItems
                        initItems={field.value}
                        // NOTE: the native <form> element wont react to changes. Only the react-hook-form.
                        onUpdate={(newTags: string[]) => field.onChange(newTags)}
                    />
                )}
            />
            <button type="submit">Save</button>
        </form>
    )
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
        <form className={CustomStyles.popup_content} id="import-form" onSubmit={handleSubmit(onSubmit)}>

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
        <form className={CustomStyles.popup_content} id="find-replace" onSubmit={handleSubmit(onSubmit)}>
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
        <form id="styles-form" className={"flex flex-col w-100 max-h-500 overflow-y-scroll"}>
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
const SaveTrainingExampleForm = (props: { onSave: (job: string) => void }) => {

    const [job, setJob] = useState<string>(null);
    return (
        <div className={CustomStyles.popup_content}>
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
