import "./cveditor.sass";
import { CV, CVSection } from "job-tool-shared-types";
import * as UI from "./cv_components"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useImmer } from "use-immer";
import ItemBucket from "../../../components/dnd/Bucket";
import { DynamicComponent, Item } from "../../../components/dnd/types";
import useLogger from "../../../hooks/logger";

export interface CVEditorHandle {
	getCV: () => CV;
};

interface CVEditorProps {
	cv: CV;
	onUpdate: () => void;
};

/**
 * Cares only about the current CV being edited.
*/
const CVEditor = forwardRef<CVEditorHandle, CVEditorProps>((props, ref) => {

	// -------------- MODEL ---------------

	const [CV, setCV] = useImmer<CV>(null);
	const isFirstRender = useRef(true);

	// parent -> this
	useEffect(() => {
		setCV(props.cv)
		isFirstRender.current = true;
	}, [props.cv]);

	// notify the parent when changed (but not on mount, and not when its from the props.)
	useEffect(() => {
		if(!CV) return;
		if(isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		props.onUpdate()
	}, [CV]);

	// give can access it whenever it wants.
	useImperativeHandle(ref, () => ({
		getCV: () => { return CV }
	}));

	// -------------- CONTROLS -----------

	const handleSectionsBucketChange = (newItems: Item[]) => {
		setCV(draft => {
			draft.sections = newItems?.map((I: Item) => I.value)
		})
	};

	const handleSectionChange = (newObj: CVSection, idx: number) => {
		setCV(draft => {
			draft.sections[idx] = newObj;
		})
	};

	const handleItemChange = (newVal: any, sec_idx: number, item_idx: number) => {
		setCV(draft => {
			draft.sections[sec_idx].items[item_idx] = newVal;
		})
	};

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
				onUpdate={handleSectionsBucketChange}
				addItemDisabled
			>
				{/* SECTIONS -------------------------------------- */}
				{CV.sections?.map((S: CVSection, i: number) =>
					<UI.SectionUI
						key={i}
						obj={S}
						onUpdate={(newObj: CVSection)=>handleSectionChange(newObj, i)}
					>
						{/* SECTION ITEMS  -------------------------------------- */}
						{S.items?.map((item: any, j: number) =>
							<DynamicComponent
								key={`${i}-${j}`}
								type={S.bucket_type}
								props={{
									obj: item,
									onUpdate: (newVal: any) => handleItemChange(newVal, i, j)
								}}
							/>
						)}
					</UI.SectionUI>
				)}
			</ItemBucket>
		</div>
	);
});

export default CVEditor;