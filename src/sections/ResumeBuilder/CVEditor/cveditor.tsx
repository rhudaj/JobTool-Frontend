import "./cveditor.sass";
import { CV, CVSection, Link } from "job-tool-shared-types";
import * as UI from "./cv_components"
import ItemBucket from "../../../components/dnd/Bucket";
import { BucketTypeNames } from "../../../components/dnd/types";
import { StyleManager } from "./styles";

/* ORIGINAL CSS
// delimited-list ----------------------------

.delimited-list
    display: flex
    flex-wrap: wrap
    & > *
        flex: 0 1 auto                     // Prevent children from expanding and ensure they fit their content
        white-space: wrap                  // Prevent wrapping
        white-space-collapse: preserve


// CV-EDITOR ----------------------------

#cv-editor
    height: 100% // take up the whole page
    color: black
    font-family: 'Arial Narrow Bold', sans-serif
    overflow: hidden

    display: grid
    grid-auto-rows: min-content // same as repeat(N, min-content), where N = # rows
    row-gap: 1%

    .section
        display: flex
        flex-direction: column
        .sec-head
            display: flex
            & > :first-child
                width: min-content
            & > :last-child
                width: 100%
        .experience
            display: flex
            flex-direction: column
            gap: 0.5rem
            // first child
            .header-info
                display: flex
                flex-direction: column
                gap: 0.25rem
                .hi-row-1, .hi-row-2
                    display: flex
                    justify-content: space-between


.divider
    font-style: italic
    font-weight: bold

.role-item-list
    display: flex
    gap: 1cqw
    white-space: nowrap

.item-list
    width: max-content
    white-space: nowrap

// STYLES ------------------

.sec-head
    font-weight: bold

hr // HORIZONTAL LINE ACROSS CENTER OF DIV
    border: none
    border-bottom: solid black
    align-self: center


// SUB SECTION ------------------

.sub-sec
    display: flex
    // gap: 0.5em

.sub-sec-head
    font-weight: bold

.title
    font-weight: bold

.role, .location // .date-range
    font-style: italic

.item-list
    font-style: italic

// LINK ------------------------------------------------

.link
    display: flex
    white-space: nowrap
    text-decoration: none
    color: black

// HEADER INFO ------------------------------------------------

#full-name
    text-align: center
    white-space: nowrap
    font-weight: bolder

#link-list
    display: flex
    justify-content: center
    gap: 1em

// sections[summary] ------------------------------------------------

.sec-summary
    display: flex
    flex-direction: column
    gap: 0.5em
*/

function CVEditor(props: {
	cv: CV,
	onUpdate?: (cv: CV) => void
}) {

	const S = StyleManager.getAll();

	const onSectionUpdate = (idx: number, section: CVSection) => {
		const new_sections = [...props.cv.sections];
		new_sections[idx] = section;
		props.onUpdate?.({
			...props.cv,
			sections: new_sections
		})
	};

	const onBucketUpdate = (newVals: CVSection[]) => {
		props.onUpdate?.({
			...props.cv,
			sections: newVals
		})
	};

	// -------------- VIEW --------------

	const cv = props.cv;

	if (!cv) return null;

	const page_padding = {
		padding: `${S.page_padding_top}  ${S.page_padding_sides}`,
	}

	return (
		<div id="cv-editor" style={page_padding}>
			{/* HEADER INFO --------------------------------------*/}
			<div id="full-name" style={{fontSize: S.name_font}}>{cv.header_info.name}</div>
			<div id="link-list" style={{fontSize: S.p_font}}>
				{cv.header_info?.links?.map((l: Link, i: number) => <UI.LinkUI key={i} {...l} /> )}
			</div>
			{/* SECTION BUCKET --------------------------------------*/}
			<ItemBucket
				id="sections"
				items={cv.sections.map((S: CVSection)=>({
					id: S.name,
					value: S
				}))}
				type={BucketTypeNames.SECTIONS}
				onUpdate={onBucketUpdate}
				addItemDisabled
			>
				{cv.sections.map((S: CVSection, i: number) =>
					<UI.SectionUI
						key={i}
						obj={S}
						onUpdate={newSec => onSectionUpdate(i, newSec)}
					/>
				)}
			</ItemBucket>
		</div>
	);
};

export default CVEditor;