import "./cveditor.sass";
import { CV, CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import ItemBucket from "../../../components/dnd/Bucket";
import { useContext, useReducer } from "react";
import { CVContext } from "../CVContext";
import { BucketContext, BucketDispatchContext, bucketReducer } from "../../../components/dnd/useBucket";

/**
 * Cares only about the current CV being edited.
 * Requires a CVContext and a CVDispatchContext to be provided.
*/
function CVEditor() {

	const CV: CV = useContext(CVContext);

	const [bucket, bucketDispatch] = useReducer(bucketReducer, {
		id: "sections",
		items: CV?.sections?.map((S: CVSection)=>({
			id: S.name,
			value: S
		}))
	});

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
			<BucketContext.Provider value={bucket}>
			<BucketDispatchContext.Provider value={bucketDispatch}>
				<ItemBucket
					type="sections"
					addItemDisabled
				>
					{/* SECTIONS -------------------------------------- */}
					{CV.sections?.map((S: CVSection, i: number) =>
						<UI.SectionUI key={i} obj={S} sec_idx={i} />
					)}
				</ItemBucket>
			</BucketDispatchContext.Provider>
			</BucketContext.Provider>
		</div>
	);
};

export default CVEditor;