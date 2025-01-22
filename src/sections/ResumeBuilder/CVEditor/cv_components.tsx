import "./cveditor.sass";
import { Experience, Link, MonthYear, DateRange } from "job-tool-shared-types";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import { joinClassNames } from "../../../hooks/joinClassNames";
import ItemBucket from "../../../components/dnd/ItemBucket";
import { format, parse } from "date-fns"
import * as UI from "./cv_components"
import { BucketTypes } from "../../../components/dnd/types";
import { useImmer } from "use-immer";
import { useEffect } from "react";

function SectionUI(props: { obj: any, onUpdate: (newObj: any) => void }) {

	const [sec, setSec] = useImmer(props.obj);

	useEffect(()=>{
		props.onUpdate(sec);
	}, [sec]);

	const formatHeader = (head: string) => (
		head.toUpperCase()
	);

	const bt = BucketTypes[sec.item_type];

	return (
		<div className="section" >
			<div className="sec-head">
				<p>{formatHeader(sec.name)}</p>
				<hr />
			</div>
			<div id={`sec-${sec.name}`} className="sec-content">
				<ItemBucket
					id={sec.name}
					values={sec.content}
					item_type={bt.item_type}
					isVertical={bt.isVertical}
					displayItemsClass={bt.displayItemsClass}
					onUpdate={newVal =>{
						setSec(draft=>{
							draft.content = newVal;
						})
					}}
				>
					{
						sec.content?.map((item, i) => (
							bt.DisplayItem({
								obj: item,
								onUpdate: newVal => {
									setSec(draft=>{
										draft.content[i] = newVal;
									})
								}
							})
						))
					}
				</ItemBucket>
			</div>
		</div>
	)
};

function SummaryUI(props: {
	obj: any,		// summary object
	onUpdate?: any	// summary object => void
}) {

	console.log("SummaryUI render: ", props.obj);

	const handleUpdate = (key: string, newVal: any) => {
		props.onUpdate({...props.obj, [key]: newVal});
	};

	return (
		<div className="sec-summary">
			<TextEditDiv tv={props.obj["summary"]} id="summary" onUpdate={val => handleUpdate("summary", val)}/>
			<div className="sub-sec">
				<div className="sub-sec-head">Languages:</div>
				<UI.DelimitedList items={props.obj["languages"]} delimiter=", " onUpdate={val => handleUpdate("languages", val)}/>
			</div>
			<div className="sub-sec">
				<div className="sub-sec-head">Technology:</div>
				<UI.DelimitedList items={props.obj["technologies"]} delimiter=", " onUpdate={val => handleUpdate("technologies", val)}/>
			</div>
		</div>
	)
}

function ExperienceUI(props: {
	obj: Experience,
	onUpdate?: (newObj: Experience) => void;
}) {

	const handleUpdate = (field: keyof Experience, val: any) => {
		if(!props.onUpdate) return;
		props.onUpdate({ ...props.obj, [field]: val });
	};

	if (!props?.obj?.title) {
		return null;
	}
	return (
		<div className="experience">
			{/* ROW 1 */}
			<div className="header-info">
				{/* ROW 1 */}
				<div>
					<div>
						<TextEditDiv className="title" tv={props.obj.title} onUpdate={val => handleUpdate('title', val)} />
						{ props.obj.link && <LinkUI {...props.obj.link} /> }
					</div>
					<DateUI dateRange={props.obj.date} onUpdate={val => handleUpdate('date', val)} />
				</div>
				{/* ROW 2 */}
				<div>
					<div className="role-item-list">
						{ props.obj.role     	? <TextEditDiv className="role" tv={props.obj.role} onUpdate={val => handleUpdate('role', val)} /> 		: null }
						{ props.obj.item_list && props.obj.item_list.length>0  	? <DelimitedList className="item-list" items={props.obj.item_list} delimiter=", " onUpdate={val => handleUpdate('item_list', val)} /> : null}
					</div>
					{ props.obj.location ? <TextEditDiv className="location" tv={props.obj.location} onUpdate={val => handleUpdate('location', val)}/> 	: null }
				</div>
			</div>
			{/* ROW 2 */}
			<div className="exp-content">
				<ul>
					<ItemBucket
						id={`${props.obj.title}-bucket`}
						values={props.obj.description}
						onUpdate={newPoints => {
							handleUpdate('description', newPoints);
						}}
						isVertical={true}
						replaceDisabled
						displayItemsClass="exp-points"
						deleteOnMoveDisabled
					>
						{ props.obj.description.map((descrItem, i) => (
							<li key={i}>
								<TextEditDiv tv={descrItem} onUpdate={val => {
									const newPoints = [...props.obj.description];
									newPoints[i] = val;
									handleUpdate('description', newPoints);
								}} />
							</li>
						)) }
					</ItemBucket>
				</ul>
			</div>
		</div>
	);
};

function DateUI(props: {
	dateRange: DateRange,
	onUpdate?: any
}) {

	const DELIM = " - ";
	const PLACEHOLDER = "Present"

	const monthYear2str = (my: MonthYear): string => (
		format(new Date(my.year, my.month - 1), "MMM yyyy") // Format as "Aug. 2024"
	);

	const strFromDateRange = (dr: DateRange) => (
		monthYear2str(dr.start) + DELIM + (dr.end && dr.end.month ? monthYear2str(dr.end) : PLACEHOLDER)
	);

	const dateRangeFromStr = (dr: string) => {
		try {
			const start_end = dr.split(DELIM);
			props.onUpdate({
				start: str2monthYear(start_end[0]),
				...(start_end[1] !== PLACEHOLDER && { end: str2monthYear(start_end[1]) }) // Only include 'end' if it's not null
			});
		} catch(err: any) {
			alert(`Invalid date range format: ${err}`);
		}
	};

	const str2monthYear = (my: string) => {
		const parsedDate = parse(my, "MMM yyyy", new Date());
		return {
			year: parsedDate.getFullYear(),
			month: parsedDate.getMonth() + 1, // JavaScript months are 0-indexed
		};
	};

	return (
		<TextEditDiv
			className="date-range"
			tv={strFromDateRange(props.dateRange)}
			onUpdate={newVal => dateRangeFromStr(newVal)}
		/>
	)
}

function LinkUI(props: Link) {
	return (
		<div className="link">
			<a className="link" href={props.url}>
				<i className={props.icon} />
				{ props.text && <TextEditDiv tv={props.text} id="link-text" /> }
			</a>
		</div>
	);
};

function DelimitedList(props: {
	items: string[],
	delimiter: string,
	className?: any,
	onUpdate?: (newVals: string[]) => void
}) {

	const onUpdate = (newVal: string) => {
		if (props.onUpdate) {
			props.onUpdate(
				newVal.split(props.delimiter)
			);
		}
	};

	const classNames = joinClassNames("delimited-list", props.className);

	return (
		<div className={classNames}>
			<TextEditDiv tv={props.items.join(props.delimiter)} onUpdate={onUpdate} />
		</div>
	);
};

export { SectionUI, SummaryUI, ExperienceUI, DateUI, LinkUI, DelimitedList }