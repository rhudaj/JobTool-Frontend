import {
    Popover,
    PopoverButton,
    PopoverPanel,
} from "@headlessui/react";
import { Field, Fieldset, Input, Label } from '@headlessui/react'
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { useShallow } from "zustand/react/shallow";
import { useCvsStore } from "./useCVs";
import { useEffect, useMemo, useRef, useState } from "react";
import { joinClassNames } from "../../util/joinClassNames";
import { useImmer } from "use-immer";
import { NamedCV } from "job-tool-shared-types";

const DEFAULT_GROUP = "other";

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

    return (
        <PopoverPanel title="group-list" className="flex justify-between p-4">
            {tree.map(([group, file_list]: [string, File[]]) => (
                <Popover title="group-item-list">
                    <PopoverButton as="div">
                        {group}
                        <i className="fa-solid fa-caret-down"/>
                    </PopoverButton>
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
    values: FilterCVParams, // ensures data persists across popover toggles
    onChange: (newValues: FilterCVParams) => void
}) {

    const { register, watch, reset } = useForm<FilterCVParams>({
        defaultValues: props.values
    });

    // Sync external state when the form is re-mounted
    // useEffect(() => {
    //     console.log("props.values = ", props.values)
    //     reset(props.values);
    // }, [props.values, reset]);

    // Watch fields and update the parent only when values change
    useEffect(() => {
        const subscription = watch((data: FilterCVParams) => {
            props.onChange(data);
        });
        return () => subscription.unsubscribe(); // Cleanup on unmount
    }, [watch, props.onChange]);

    const fieldStyle = "flex gap-4 p-4"
    const inputStyle = "bg-white text-black"

    console.log("props.values = ", props.values)

    return (
        <Fieldset className="flex flex-col">
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
                <Input className={inputStyle} {...register("pattern", {
                    setValueAs: (value: string) => RegExp(value)
                })} />
            </Field>
        </Fieldset>
    )
};

// -----------------------------------------------------------------------------
//                                  MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function SavedCVsUI() {

    // ------------------------ STATE ------------------------

    const cvsState = useCvsStore();
    const [allFiles, setAllFiles] = useImmer<File[]>([]);
    const [filteredFiles, setFilteredFiles] = useImmer<File[]>([]);
    const [filter, setFilter] = useImmer<FilterCVParams>(null);

    // at the start, its all files
    useEffect(()=>{
        setAllFiles(
            cvsState.ncvs.map((ncv, i) => ({
                idx: i,
                name: ncv.name,
                path: ncv.path,
                isModified: cvsState.trackMods[i],
                isActive: i === cvsState.curIdx
            }))
        )
    }, [cvsState.ncvs]);

    useEffect(()=>{
        setFilteredFiles(allFiles);
    }, [allFiles])

    useEffect(()=>{
        if(filter === null) return; // just mounted
        console.log('Filter changed: ', filter)
        setFilteredFiles(
            allFiles.filter(F => {
                const ncv = cvsState.ncvs[F.idx];
                return (
                    !filter.name ||
                    F.name.toLowerCase().includes(filter.name.toLowerCase())
                ) &&
                (
                    !filter.pattern ||
                    JSON.stringify(ncv.data).match(filter.pattern)
                ) &&
                (
                    !filter.tags ||
                    filter.tags.every(tag => ncv.tags.includes(tag))
                )
            })
        )
    }, [filter])

    useEffect(()=>{
        console.log(`Filtered files, ${cvsState.ncvs.length} --> ${filteredFiles.length}`);
    }, [filteredFiles])

    const onCvSelected = (idx: number) => {
        if (idx === cvsState.curIdx) return; // only update if diff
        cvsState.setCur(idx);
    };

    return (
        <Popover>
            <PopoverButton className="inline-flex items-center gap-2 rounded-md">
                Select
                <i className="fa-solid fa-caret-down"/>
            </PopoverButton>
            <PopoverPanel
                transition
                anchor="bottom start"
                className="w-200 p-4 text-white bg-[#4e4e4e]"
            >
                <Popover className="select-file-group">
                    <PopoverButton>Filter</PopoverButton>
                    <PopoverPanel className="pl-4">
                        <FilterFilesForm values={filter} onChange={setFilter}/>
                    </PopoverPanel>
                </Popover>

                <Popover title="select-file-group">
                    <PopoverButton>Select</PopoverButton>
                    <FileTreeUI
                        files={filteredFiles}
                        onFileSelect={onCvSelected}
                    />
                </Popover>

            </PopoverPanel>
        </Popover>
    );
}
