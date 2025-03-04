import "./savedCVs.sass";
import {
    Popover,
    PopoverButton,
    PopoverPanel,
} from "@headlessui/react";
import { useShallow } from "zustand/react/shallow";
import { useCvsStore } from "../useCVs";
import { useMemo } from "react";
import { joinClassNames } from "../../../util/joinClassNames";

const DEFAULT_GROUP = "other";

function CVItem(props: {
	name: string,
	idx: number,
	isActive: boolean,
	isModified: boolean,
	onClick: (idx: number) => void,
}) {
	const classes = joinClassNames(
		"cv-thumbnail",
		props.isActive ? "active" : "",
		props.isModified ? "is-modified" : ""
	)
	return (
		<div key={props.name} className={classes}
			onClick={()=>props.onClick(props.idx)}
		>
			{props.name}
		</div>
	)
}

// TODO: only works for 1 level of nesting

/**
 * Displays the list of saved CVs.
 * And allows the user to select one (change state.curIdx)
 */
export default function SavedCVsUI() {
    const cvsState = useCvsStore();
    // useShallow => cvNames updates ONLY when output of the selector does
    const cvNames = useCvsStore(
        useShallow((state) => state.ncvs.map((cv) => cv.name || "Unnamed CV"))
    );
    const cvPaths = useCvsStore(
        useShallow((state) => state.ncvs.map((cv) => cv.path))
    );

    const groups: [string, any[]][] = useMemo(() => {
        // path looks like: "/dir1/dir2/.../dirN/name"
        // this should insert the item {name, i} into groups[dir1][di2]...[dirN]
        const groups = {};
        cvNames.forEach((name, cv_idx) => {
            const path = cvPaths[cv_idx];
			// BASE CASE
            if (path === "/") {
                groups[DEFAULT_GROUP] = groups[DEFAULT_GROUP] || [];
                groups[DEFAULT_GROUP].push({ name, cv_idx });
                return;
            }
			// RECURSIVE CASE
            const [subGroups, lastPart] = [
                path.split("/").slice(1, -1),
                path.split("/").pop(),
            ];
            let cur = groups; // start at root
            subGroups.forEach((part) => {
                cur[part] = cur[part] || {}; // may(not) exist yet
                cur = cur[part];
            });
            // last part, insert the item
            cur[lastPart] = cur[lastPart] || [];
            cur[lastPart].push({ name, cv_idx });
        });
        return Object.entries(groups);
    }, [cvPaths]);

    const curName = cvNames ? cvNames[cvsState.curIdx] : "";

    const onCvSelected = (idx: number) => {
        if (idx === cvsState.curIdx) return; // only update if diff
        cvsState.setCur(idx);
    };

    return (
		<Popover className="select-group">
			<PopoverButton>Select</PopoverButton>
			<PopoverPanel style={{paddingLeft: '15rem'}}>
				{groups.map(([group, item_list]: [string, any[]]) => (
					<Popover className="cv-group" style={{ position: "relative" }}>
						<PopoverButton as="div">{group}</PopoverButton>
						<PopoverPanel style={{ paddingLeft: '20rem' }}>
							{item_list.map(({name, cv_idx})=>
								<CVItem
									name={name}
									idx={cv_idx}
									isModified={cvsState.trackMods[cv_idx]}
									isActive={name === curName}
									onClick={onCvSelected}
								/>
							)}
						</PopoverPanel>
					</Popover>
				))}
			</PopoverPanel>
		</Popover>
    );
}

{
    /* {list.map(({cv_name, cv_idx}) => (
<div key={cv_name}
	className={joinClassNames(
		"cv-thumbnail",
		cv_name === curName ? "active" : "",
		cvsState.trackMods[cv_idx] ? "is-modified" : ""
	)}
	onClick={()=>onThumbnailClick(cv_idx)}
>
	{cv_name}
</div>

))} */
}
