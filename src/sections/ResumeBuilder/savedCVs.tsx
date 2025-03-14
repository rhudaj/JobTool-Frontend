import {
    Popover,
    PopoverButton,
    PopoverPanel,
} from "@headlessui/react";
import { Field, Fieldset, Input, Label } from '@headlessui/react'
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useShallow } from "zustand/react/shallow";
import { useCvsStore } from "./useCVs";
import { useEffect, useMemo } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { useImmer } from "use-immer";

const DEFAULT_GROUP = "other";

// TODO: only works for 1 level of nesting

// -----------------------------------------------------------------------------
//                                  FILE VIEWER
// -----------------------------------------------------------------------------

interface File {
    name: string,
    path: string,
    isModified: boolean,
    isActive: boolean,
    idx: number, // set when building the tree
}

// Group -> list of files
type FileTree = [ string, File[] ][]

/**
 * Displays the list of saved CVs.
 * And allows the user to select one (change state.curIdx)
 */
function FileTreeUI(props: {
    files: File[]
    onFileSelect: (file_idx: number) => void
}) {

    // ----------------- STATE -----------------

    const tree: FileTree = useMemo(() => {
        const groups = {};
        props.files.forEach(F => {
			// BASE CASE
            if (F.path === "/") {
                groups[DEFAULT_GROUP] = groups[DEFAULT_GROUP] || [];
                groups[DEFAULT_GROUP].push(F);
                return;
            }
			// RECURSIVE CASE
            const [subGroups, lastPart] = [
                F.path.split("/").slice(1, -1),
                F.path.split("/").pop(),
            ];
            let cur = groups; // start at root
            subGroups.forEach((part) => {
                cur[part] = cur[part] || {}; // may(not) exist yet
                cur = cur[part];
            });
            // last part, insert the item
            cur[lastPart] = cur[lastPart] || [];
            cur[lastPart].push(F);
        });
        return Object.entries(groups);
    }, [props.files]);

    // ----------------- VIEW -----------------

    const groupsStyle = "flex justify-between pl-4"

    return (
        <PopoverPanel title="group-list" className={groupsStyle}>
            {tree.map(([group, file_list]: [string, File[]]) => (
                <Popover title="group-item-list" style={{ position: "relative" }}>
                    <PopoverButton as="div">{group}</PopoverButton>
                    <PopoverPanel className="pl-4">
                        {file_list.map(file =>
                            <FileUI
                                key={`item-${file.idx}-${file.name}`}
                                file={file}
                                onClick={props.onFileSelect}
                            />
                        )}
                    </PopoverPanel>
                </Popover>
            ))}
        </PopoverPanel>
    );
};

function FileUI(props: {
	file: File
	onClick: (idx: number) => void,
}) {
	return (
		<div
			className="w-max whitespace-nowrap p-2 hover:scale-105"
            style={{
                fontWeight: props.file.isActive ? "bold" : "",
                backgroundColor: props.file.isModified ? "red 300" : ""
            }}
			onClick={()=>props.onClick(props.file.idx)}
		>
			{props.file.name}
		</div>
	)
}

// -----------------------------------------------------------------------------
//                                  FILTER CVS
// -----------------------------------------------------------------------------


interface FilterCVParams {
    name?: string
    tags?: string[],
    pattern?: RegExp,
};
function FilterFilesForm(props: {
    onChange: (newValues: FilterCVParams) => void
}) {

    const { register, getValues } = useForm<FilterCVParams>();

    const handleChange = () => {
        props.onChange( getValues() )
    };

    const fieldStyle = "flex gap-4 p-4"
    const inputStyle = "bg-white text-black"

    return (
        <Fieldset className="flex flex-col" onBlur={handleChange}>
            <Field className={fieldStyle}>
                <Label className="block">Name</Label>
                <Input className={inputStyle} {...register("name")}/>
            </Field>
            <Field className={fieldStyle}>
                <Label className="block">Tags</Label>
                <Input className={inputStyle} {...register("tags", {
                    setValueAs: (value: string) => value
                        .split(",")
                        .map(s=>s.trim())
                        .filter(s=>s)
                })} />
            </Field>
            <Field className={fieldStyle}>
                <Label className="block">Pattern</Label>
                <Input className={inputStyle} {...register("name")} />
            </Field>
        </Fieldset>
    )
};

// -----------------------------------------------------------------------------
//                                  MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function SavedCVsUI() {

    const cvsState = useCvsStore();
    const files = useMemo(() => cvsState.ncvs.map((ncv, i) => ({
        idx: i,
        name: ncv.name,
        path: ncv.path,
        isModified: cvsState.trackMods[i],
        isActive: i === cvsState.curIdx
    })), [cvsState.ncvs, cvsState.trackMods, cvsState.curIdx]);

    useEffect(()=>{
        console.log('new files = ', files)
    }, [files])

    const [filter, setFilter] = useImmer<FilterCVParams>(null);

    const onCvSelected = (idx: number) => {
        if (idx === cvsState.curIdx) return; // only update if diff
        cvsState.setCur(idx);
    };

    const onFilterChange = (filter: FilterCVParams) => {
        console.log('File Filter Update!')
        setFilter(filter);
    };

    return (
        <Popover>
            <PopoverButton className="inline-flex items-center gap-2 rounded-md">
                Options
                <i className="fa-solid fa-caret-down"></i>
            </PopoverButton>
            <PopoverPanel
                transition
                anchor="bottom start"
                className="w-200 p-4 text-white bg-[#4e4e4e]"
            >
                <Popover className="select-file-group">
                    <PopoverButton>Filter</PopoverButton>
                    <PopoverPanel className="pl-4">
                        <FilterFilesForm onChange={onFilterChange}/>
                    </PopoverPanel>
                </Popover>

                <Popover title="select-file-group">
                    <PopoverButton>Select</PopoverButton>
                    <FileTreeUI
                        files={files}
                        onFileSelect={onCvSelected}
                    />
                </Popover>

            </PopoverPanel>
        </Popover>
    );
}
