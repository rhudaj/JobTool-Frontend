import "./cveditor.sass";
import { CV, CVSection, Link } from "job-tool-shared-types";
import * as UI from "./cv_components"
import ItemBucket from "../../../components/dnd/Bucket";
import { BucketTypeNames } from "../../../components/dnd/types";
import { useEffect } from "react";

/**
 * Cares only about the current CV being edited.
 * Requires a CVContext and a CVDispatchContext to be provided.
*/
// TODO: pass a context instead
function CVEditor(props: {
	cv: CV,
	onUpdate?: (cv: CV) => void
}) {

	useEffect(() => {
		console.log("CVEditor: new cv: ", props.cv);
	}, [props.cv]);

	const onSectionUpdate = (idx: number, section: CVSection) => {
		const new_sections = [...props.cv.sections];
		new_sections[idx] = section;
		props.onUpdate?.({
			...props.cv,
			sections: new_sections
		})
	};

	const onBucketUpdate = (newVals: CVSection[]) => {
		props.onUpdate?.({
			...props.cv,
			sections: newVals
		})
	};

	// -------------- VIEW --------------

	const cv = props.cv;

	if (!cv) return null;
	return (
		<div id="cv-editor">
			{/* HEADER INFO --------------------------------------*/}
			<div id="full-name" key="name">{cv.header_info.name}</div>
			<div id="link-list">
				{cv.header_info?.links?.map((l: Link, i: number) => <UI.LinkUI key={i} {...l} /> )}
			</div>
			{/* SECTION BUCKET --------------------------------------*/}
			<ItemBucket
				id="sections"
				items={cv.sections.map((S: CVSection)=>({
					id: S.name,
					value: S
				}))}
				type={BucketTypeNames.SECTIONS}
				onUpdate={onBucketUpdate}
				addItemDisabled
			>
				{/* SECTIONS -------------------------------------- */}
				{cv.sections.map((S: CVSection, i: number) =>
					<UI.SectionUI
						key={i}
						obj={S}
						onUpdate={newSec => onSectionUpdate(i, newSec)}
					/>
				)}
			</ItemBucket>
		</div>
	);
};

export default CVEditor;