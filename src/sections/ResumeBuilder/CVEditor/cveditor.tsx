import "./cveditor.sass";
import { CV } from "job-tool-shared-types";
import * as UI from "./cv_components"
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../../../components/dnd/ItemBucket";

// MAIN COMPONENT
const CVEditor = forwardRef((
	props: { cv: CV },
	ref: React.ForwardedRef<any>
) => {

	// -------------- MODEL --------------

	const [CV, setCV] = useImmer<CV>(null);

	useEffect(() => {
		console.log("CVEditor\n\tnew props.cv: ", props.cv)
		// CHECK: props.cv has the correct updates => CV has the correct updates
		setCV(props.cv);
	}, [props.cv]);

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
				id="sections-bucket"
				values={CV.sections}
				type={"sections"}
				onItemChange={handleItemChange}
				addItemDisabled
				onUpdate={handleObjChange}
			/>
		</div>
	);
});

export default CVEditor;