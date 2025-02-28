import "./cveditor.sass";
import { CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import ItemBucket from "../../../components/dnd/Bucket";
import { useContext } from "react";
import { CVActions, CVContext } from "../useCV";
import { BucketTypeNames } from "../../../components/dnd/types";

/**
 * Cares only about the current CV being edited.
 * Requires a CVContext and a CVDispatchContext to be provided.
*/
function CVEditor() {

	const [CV, cv_dispatch] = useContext(CVContext);

	const onSectionUpdate = (idx: number, section: CVSection) => {
		cv_dispatch({
			type: CVActions.SET_SECTION,
			payload: { idx, section }
		});
	};

	const onBucketUpdate = (newVals: CVSection[]) => {
		cv_dispatch({
			type: CVActions.SET,
			payload: {
				...CV,
				sections: newVals
			}
		});
	};

	// -------------- VIEW --------------

	if (!CV) return null;
	return (
		<div id="cv-editor">
			{/* HEADER INFO --------------------------------------*/}
			<div id="full-name" key="name">{CV.header_info.name}</div>
			<div id="link-list">
				{CV.header_info?.links?.map((l,i) => <UI.LinkUI key={i} {...l} /> )}
			</div>
			{/* SECTION BUCKET --------------------------------------*/}
			<ItemBucket
				id="sections"
				items={CV?.sections?.map((S: CVSection)=>({
					id: S.name,
					value: S
				}))}
				type={BucketTypeNames.SECTIONS}
				onUpdate={onBucketUpdate}
				addItemDisabled
			>
				{/* SECTIONS -------------------------------------- */}
				{CV.sections?.map((S: CVSection, i: number) =>
					<UI.SectionUI key={i} obj={S} onUpdate={newSec => onSectionUpdate(i, newSec)} />
				)}
			</ItemBucket>
		</div>
	);
};

export default CVEditor;