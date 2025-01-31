import "./cveditor.sass";
import { CV, CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../../../components/dnd/Bucket";
import { DynamicComponent, Item } from "../../../components/dnd/types";

export interface CVEditorHandle {
	getCV: () => CV;
}

// MAIN COMPONENT
const CVEditor = forwardRef<CVEditorHandle, { cv: CV, itemFromId: (secId: string, itemId: string)=>any }>(({ cv, itemFromId }, ref) => {

	// -------------- MODEL ---------------

	const [CV, setCV] = useImmer<CV>(null);

	useEffect(() => setCV(cv), [cv]);

	// give parent access to CV
	useImperativeHandle(ref, () => ({
		getCV: () => { return CV }
	}));

	const handleItemsChange = (newItems: Item[]) => {
		setCV(cur => { cur.sections = newItems.map(I=>I.value) })
	};

	// -------------- VIEW --------------

	if (!itemFromId || !CV) return null;
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
					items: CV.sections.map((S: CVSection)=>({id: S.name, value: S} as Item<CVSection>))
				}}
				type="sections"
				onUpdate={handleItemsChange}
				addItemDisabled
			>
				{/* SECTIONS -------------------------------------- */}
				{CV.sections.map((S: CVSection, i: number)=>(
					<UI.SectionUI
						key={i}
						obj={S}
						onUpdate={(newObj: CVSection)=>{
							setCV(cur_cv=>{
								cur_cv.sections[i] = newObj;
							})
						}}
					>
						{/* SECTION ITEMS  -------------------------------------- */}
						{S.item_ids.map((iid: string, i: number) => (
							<DynamicComponent
								type={S.bucket_type}
								props={{
									obj: itemFromId(S.name, iid),
									// don't care ab updates to individual items
								}}
							/>
						))}
					</UI.SectionUI>
				))}
			</ItemBucket>
		</div>
	);
});

export default CVEditor;