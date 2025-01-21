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
		setCV(props.cv);
	}, [props.cv]);


	// give parent access to CV
	useImperativeHandle(ref, () => ({
		getCV: () => {
			return CV;
		}
	}));

	// -------------- VIEW (setup) --------------

	if (!CV) {
		return null;
	}

	// -------------- VIEW --------------

	return (
		<div id="cv-editor">
			<div id="full-name" key="name">{CV.header_info.name}</div>
			<div id="link-list">
				{CV.header_info.links?.map((l,i) => <UI.LinkUI key={i} {...l} /> )}
			</div>
			<ItemBucket
				id="sections-bucket"
				values={CV.sections} // only worry about tracking the string names (assumes all unique)
				isVertical={true}
				item_type="section"
				displayItemsClass="section"
				onUpdate={new_vals => {
					setCV(draft => {
						draft.sections = new_vals
					})
				}}
			>
				{
					CV.sections?.map((sec, i) => (
						<UI.SectionUI obj={sec} onUpdate={new_obj => {
							setCV(draft => {
								draft.sections[i] = new_obj;
							})
						}}/>
					))
				}
			</ItemBucket>
		</div>
	);
});

export default CVEditor;