import "./cveditor.sass";
import { CV } from "job-tool-shared-types";
import * as UI from "./cv_components"
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../../../components/dnd/ItemBucket";


export interface CVEditorHandle {
	getCV: () => CV;
}

// MAIN COMPONENT
const CVEditor = forwardRef<CVEditorHandle, { cv: CV }>(({ cv }, ref) => {

	// -------------- MODEL --------------

	const [CV, setCV] = useImmer<CV>(null);

	useEffect(() => setCV(cv), [cv]);

	// give parent access to CV
	useImperativeHandle(ref, () => ({
		getCV: () => { return CV }
	}));

	const handleObjChange = (new_vals: any) => {
		setCV(cur => { cur.sections = new_vals })
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
				id="sections"
				values={CV.sections}
				onItemChange={handleItemChange}
				onUpdate={handleObjChange}
				addItemDisabled
			/>
		</div>
	);
});

export default CVEditor;