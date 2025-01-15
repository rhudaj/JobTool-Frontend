import "./cveditor.sass";
import { Experience, Link, MonthYear, DateRange } from "job-tool-shared-types";
import TextEditDiv from "../TextEditDiv/texteditdiv";
import React, { useEffect, useMemo } from "react";
import { joinClassNames } from "../../hooks/joinClassNames";
import ItemBucket from "../dnd/ItemBucket";
import { format, parse } from "date-fns"
import * as UI from "./cv_components"
import { TrackVal, wrapTrackable } from "../../hooks/trackable";

function SectionUI(props: {
    head: string;
    id?: string;
    children: React.ReactNode;
}) {

	const formatHeader = (head: string) => (
		head.toUpperCase()
	);

	return (
		<div className="section">
			<div className="sec-head">
				<p>{formatHeader(props.head)}</p>
				<hr />
			</div>
			<div id={props.id} className="sec-content">{props.children}</div>
		</div>
	)
};

function SummaryUI(props: { obj: any }) {

	return (
		<div className="sec-summary">
			<TextEditDiv tv={props.obj.summary} id="summary" />
			<div className="sub-sec">
				<div className="sub-sec-head">Languages:</div>
				<UI.DelimitedList items={props.obj.languages} delimiter=", " />
			</div>
			<div className="sub-sec">
				<div className="sub-sec-head">Technology:</div>
				<UI.DelimitedList items={props.obj.technologies} delimiter=", " />
			</div>
		</div>
	)
}

function ExperienceUI(props: { obj: Experience }) {

	if (!props.obj.title) {
		// Invalid object
		return null;
	}
	return (
		<div className="experience">
			{/* ROW 1 */}
			<div className="header-info">
				{/* ROW 1 */}
				<div>
					<div>
						<TextEditDiv className="title" tv={props.obj.title} />
						{ props.obj.link && <LinkUI {...props.obj.link} /> }
					</div>
					<DateUI dateRange={props.obj.date} />
				</div>
				{/* ROW 2 */}
				<div>
					<div className="role-item-list">
						{ props.obj.role     	? <TextEditDiv className="role" tv={props.obj.role} /> 		: null }
						{ props.obj.item_list && props.obj.item_list.length>0  	? <DelimitedList className="item-list" items={props.obj.item_list} delimiter=", " /> : null}
					</div>
					{ props.obj.location ? <TextEditDiv className="location" tv={props.obj.location} /> 	: null }
				</div>
			</div>
			{/* ROW 2 */}
			<div className="exp-content">
				<ul
					// If only one item => don't render bullet point:
					style={{ listStyleType: props.obj.description.length === 1 ? 'none' : 'disc' }}
				>
					<ItemBucket
						id={`${props.obj.title}-bucket`}
						values={props.obj.description}
						onUpdate={newPoints => {
							// TODO: idk if this works or not since might not be changing the object.
							props.obj.description = wrapTrackable(newPoints)
						}}
						isVertical={true}
						replaceDisabled
						displayItemsClass="exp-points"
						deleteOnMoveDisabled
					>
						{ props.obj.description.map((descrItem, i) => (
							<li key={i}>
								<TextEditDiv tv={descrItem} />
							</li>
						)) }
					</ItemBucket>
				</ul>
			</div>
		</div>
	);
};

// TODO: somehow assert that the inner most values of the obj are `TrackVal<number>` type
// TODO: you can pass any object to TrackVal and also specify how to destructure it to inner-html (string) and how to put it back together.
function DateUI(props: { dateRange: DateRange }) {

	const DELIM = " - ";
	const PLACEHOLDER = "Present"

	const strFromDateRange = (dr: DateRange) => (
		monthYear2str(dr.start) + DELIM + (dr.end && dr.end.month ? monthYear2str(dr.end) : PLACEHOLDER)
	);

	const monthYear2str = (my: MonthYear): string => {
		const year =  (my.year as unknown as TrackVal<number>).value
		const month = (my.month as unknown as TrackVal<number>).value
		return format(new Date(year, month - 1), "MMM yyyy") // Format as "Aug. 2024"
	};

	return (
		<TextEditDiv className="date-range" tv={new TrackVal<DateRange>(props.dateRange)}
			construct={}
		>
	)
}

function LinkUI(props: Link) {
	// TODO: disable open link on click while editing (but not when saved as a pdf)
	return (
		<div className="link">
			<a className="link" href={props.url}>
				<i className={props.icon} />
				{ props.text && <TextEditDiv tv={props.text as unknown as TrackVal<string>} id="link-text" /> }
			</a>
		</div>
	);
};

function DelimitedList(props: {
	items: string[],
	delimiter: string,
	className?: any
}) {

	const items2str = (items: string[]) => {
		return items.map(tv=>(tv as unknown as TrackVal<string>).value).join(props.delimiter)
	};

	const str2items = (items_as_str: string) => {
		return items_as_str.split(props.delimiter);
	};

	const tv = useMemo(()=>new TrackVal<string[]>(props.items), [props.items, props.delimiter]);

	const classNames = joinClassNames("delimited-list", props.className);

	return (
		<div className={classNames}>
			<TextEditDiv tv={tv} destruct={items2str} construct={str2items}/>
		</div>
	);
};

export { SectionUI, SummaryUI, ExperienceUI, DateUI, LinkUI, DelimitedList }