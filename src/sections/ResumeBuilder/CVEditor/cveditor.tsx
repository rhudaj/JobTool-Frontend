import "./cveditor.sass";
import { CV, CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../../../components/dnd/ItemBucket";
import { Item } from "../../../components/dnd/types";


export interface CVEditorHandle {
	getCV: () => CV;
}

// MAIN COMPONENT
const CVEditor = forwardRef<CVEditorHandle, { cv: CV, sec2Content: (cvsec: CVSection) => any }>(({ cv, sec2Content }, ref) => {

	// -------------- MODEL --------------

	const [CV, setCV] = useImmer<CV>(null);

	useEffect(() => setCV(cv), [cv]);

	// give parent access to CV
	useImperativeHandle(ref, () => ({
		getCV: () => { return CV }
	}));

	const handleItemsChange = (newItems: Item[]) => {
		setCV(cur => { cur.sections = newItems.map(I=>I.value) })
	};

	const handleItemChange = (i: number, newVal: any) => {
		setCV(cur => { cur.sections[i] = newVal })
	};

	// -------------- VIEW --------------

	if (!CV) return null;

	return (
		<div id="cv-editor">
			<div id="full-name" key="name">{CV.header_info.name}</div>
			<div id="link-list">
				{CV.header_info?.links?.map((l,i) => <UI.LinkUI key={i} {...l} /> )}
			</div>
			<ItemBucket
				bucket={{
					id:"sections",
					items: CV.sections.map((sec: CVSection)=>({id: sec.name, value: sec2Content(sec)}))
				}}
				type="sections"
				onItemChange={handleItemChange}
				onUpdate={handleItemsChange}
				addItemDisabled
			/>
		</div>
	);
});

export default CVEditor;