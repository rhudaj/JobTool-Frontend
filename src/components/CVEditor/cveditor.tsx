import "./cveditor.sass";
import { CV, Experience } from "job-tool-shared-types";
import * as UI from "./cv_components"
import TextEditDiv from "../TextEditDiv/texteditdiv";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../dnd/ItemBucket";
import { BucketTypes } from "../dnd/types";
import  useLogger  from "../../hooks/logger";

// MAIN COMPONENT
const CVEditor = forwardRef((
	props: { cv: CV },
	ref: React.ForwardedRef<any>
) => {

	const log = useLogger("CVEditor");

	// -------------- MODEL --------------

	const [CV, setCV] = useImmer<CV>(null);
	const [sectionOrder, setSectionOrder] = useImmer<string[]>(null);

	// initialize the CV & sectionOrder
	useEffect(() => {
		setCV(props.cv);
		if(!props.cv) return;
		setSectionOrder(Object.keys(props.cv.sections))
	}, [props.cv]);

	// give parent access to CV
	useImperativeHandle(ref, () => ({
		getCV: () => {
			// Update the sections of the cv based on sectionOrder (TODO: find a better way)
			const new_sections = {...CV}
			new_sections.sections = {}
			sectionOrder.forEach(secName => {
				new_sections.sections[secName] = CV.sections[secName]
			})
			return new_sections;
		}
	}));

	// -------------- VIEW (setup) --------------

	if (!CV || !sectionOrder) {
		return null;
	}

	console.log("section order: ", sectionOrder);

	const bt = BucketTypes["experiences"];
	const sections_ui = sectionOrder.map(sec_head => (
		<UI.SectionUI head={sec_head.toUpperCase()} id={`sec-${sec_head}`}>
			{
				(sec_head !== "summary") ? (
					<ItemBucket
						id={sec_head}
						values={CV.sections[sec_head] as any[]}
						item_type={bt.item_type}
						isVertical={bt.isVertical}
						displayItemsClass={bt.displayItemsClass}
						onUpdate={(newItems) => {
							setCV(draft => {
								draft.sections[sec_head] = newItems
							})
						}}
					>
						{CV.sections[sec_head]?.map((exp, i) => (
							<UI.ExperienceUI key={i} {...exp} onUpdate={(newExp: Experience) => {
								setCV(draft => {
									draft.sections[sec_head][i] = newExp
								})
							}} />
						))}
					</ItemBucket>
				) : (
					<>
						<TextEditDiv tv={CV.sections[sec_head].summary} id="summary" onUpdate={val => {
							setCV(draft => {
								draft.sections[sec_head].summary = val
							})
						}}/>
						<div className="sub-sec">
							<div className="sub-sec-head">Languages:</div>
							<UI.DelimitedList items={CV.sections[sec_head].languages} delimiter=", " onUpdate={vals=> {
								setCV(draft => {
									draft.sections[sec_head].languages = vals
								})
							}}/>
						</div>
						<div className="sub-sec">
							<div className="sub-sec-head">Technology:</div>
							<UI.DelimitedList items={CV.sections[sec_head].technologies} delimiter=", " onUpdate={vals=> {
								setCV(draft => {
									draft.sections[sec_head].technologies = vals
								})
							}}/>
						</div>
					</>
				)
			}
		</UI.SectionUI>
	))

	// -------------- VIEW --------------

	return (
		<div id="cv-editor">
			<div id="full-name" key="name">{CV.name}</div>
			<div id="link-list">
				{CV.links?.map((l,i) => <UI.LinkUI key={i} {...l} /> )}
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
