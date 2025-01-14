import "./cveditor.sass";
import { CV } from "job-tool-shared-types";
import * as UI from "./cv_components"
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../dnd/ItemBucket";
import { BucketTypes } from "../dnd/types";
import  useLogger  from "../../hooks/logger";

// const MAP = new Map([
// 	["summary", UI.SummaryUI],
// 	["experiences", UI.ExperienceUI]
// ]);


// MAIN COMPONENT
const CVEditor = forwardRef((
	props: { cv: CV },
	ref: React.ForwardedRef<any>
) => {

	const log = useLogger("CVEditor");

	// -------------- MODEL --------------

	const [CV, setCV] = useImmer<CV>(null);
	const [sectionOrder, setSectionOrder] = useImmer<number[]>(null);

	// initialize the CV & sectionOrder
	useEffect(() => {
		setCV(props.cv);
		if(!props.cv) return;
		setSectionOrder(Array.from(Array(props.cv.sections.length).keys()))
	}, [props.cv]);

	useEffect(()=>{
		console.log("new CV: ", CV)
	}, [CV])

	// give parent access to CV
	useImperativeHandle(ref, () => ({
		getCV: () => {
			// Update the sections of the cv based on sectionOrder (TODO: find a better way)
			const new_cv = {...CV}
			new_cv.sections = sectionOrder.map(sec_idx => CV.sections[sec_idx])
			return new_cv
		}
	}));

	// -------------- VIEW (setup) --------------

	if (!CV || !sectionOrder) {
		return null;
	}

	const sections_ui = sectionOrder.map(sec_idx => {

		const sec = CV.sections[sec_idx];
		const sec_content = sec.content;	// list of items of the same type
		const sec_head = sec.name;			// the name/header for the section
		// Each section specifies an `item_type`, which indicates which React UI component to use for displaying it.

		const bt = BucketTypes[sec.item_type];

		return (
			<UI.SectionUI head={sec_head.toUpperCase()} id={`sec-${sec_head}`}>
				<ItemBucket
					id={sec_head}
					values={sec.content}
					item_type={bt.item_type}
					isVertical={bt.isVertical}
					displayItemsClass={bt.displayItemsClass}
					onUpdate={new_vals => {
						setCV(draft => {
							draft.sections[sec_idx].content = new_vals
						})
					}}
				>
					{
						sec_content?.map((item, i) => (
							bt.DisplayItem({
								obj: item,
								onUpdate: (new_val: any)=>{
									setCV(draft => {
										console.log("new_val = ", new_val)
										draft.sections[sec_idx].content[i] = new_val
									})
								}
							})
						))
					}
				</ItemBucket>
			</UI.SectionUI>
		);
	})

	// -------------- VIEW --------------

	return (
		<div id="cv-editor">
			<div id="full-name" key="name">{CV.header_info.name}</div>
			<div id="link-list">
				{CV.header_info.links?.map((l,i) => <UI.LinkUI key={i} {...l} /> )}
			</div>
			<ItemBucket
				id="sections-bucket"
				values={sectionOrder} // only worry about tracking the string names (assumes all unique)
				isVertical={true}
				item_type="section"
				displayItemsClass="section"
				onUpdate={newSecOrder => {
					setSectionOrder([...newSecOrder])
				}}
			>{sections_ui}</ItemBucket>
		</div>
	);
});

export default CVEditor;
