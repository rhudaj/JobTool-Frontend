import "./cveditor.sass";
import { CV, CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import ItemBucket from "../../../components/dnd/Bucket";
import { useContext, useEffect, useReducer, useRef } from "react";
import { BucketContext, bucketReducer } from "../../../components/dnd/useBucket";
import { CVActions, CVContext } from "../useCV";
import { BucketTypeNames } from "../../../components/dnd/types";
import { isEqual } from "lodash";

/**
 * Cares only about the current CV being edited.
 * Requires a CVContext and a CVDispatchContext to be provided.
*/
function CVEditor() {

	const [CV, cv_dispatch] = useContext(CVContext);

	const [bucket, bucketDispatch] = useReducer(bucketReducer, { id: "sections", items: [] });

	const justSet = useRef(false);

	useEffect(()=>{
		if(justSet.current) {
			justSet.current = false;
			return;
		}
		bucketDispatch({
			type: CVActions.SET,
			payload: CV?.sections?.map((S: CVSection)=>({
				id: S.name,
				value: S
			}))
		});
	}, [CV?.sections]);

	useEffect(()=>{
		justSet.current = true;
		cv_dispatch({
			type: CVActions.SET,
			payload: {
				...CV,
				sections: bucket.items.map((i: any)=>i.value)
			}
		})
	}, [bucket.items]);

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
			<BucketContext.Provider value={[bucket, bucketDispatch]}>
				<ItemBucket type={BucketTypeNames.SECTIONS} addItemDisabled>
					{/* SECTIONS -------------------------------------- */}
					{CV.sections?.map((S: CVSection, i: number) =>
						<UI.SectionUI key={i} obj={S} sec_idx={i} />
					)}
				</ItemBucket>
			</BucketContext.Provider>
		</div>
	);
};

export default CVEditor;