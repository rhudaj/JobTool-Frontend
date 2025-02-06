import "./cveditor.sass";
import { CV, CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import ItemBucket from "../../../components/dnd/Bucket";
import { DynamicComponent } from "../../../components/dnd/types";
import { useContext } from "react";
import { CVContext, CVDispatchContext } from "../CVContext";
import { createContext } from "vm";

/**
 * Cares only about the current CV being edited.
 * Requires a CVContext and a CVDispatchContext to be provided.
*/
function CVEditor() {

	const CV: CV = useContext(CVContext);
	const cv_dispatch = useContext(CVDispatchContext);

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
				bucket={{
					id: "sections",
					items: CV.sections?.map((S: CVSection)=>({
						id: S.name,
						value: S
					}))
				}}
				type="sections"
				addItemDisabled
			>
					{/* SECTIONS -------------------------------------- */}
					{CV.sections?.map((S: CVSection, i: number) =>
						<UI.SectionUI key={i} obj={S} />
					)}
			</ItemBucket>
		</div>
	);
};

export default CVEditor;