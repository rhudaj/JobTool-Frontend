import "./cveditor.sass";
import { Experience, Link, MonthYear, DateRange, CVSection } from "job-tool-shared-types";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import { joinClassNames } from "../../../util/joinClassNames";
import ItemBucket from "../../../components/dnd/Bucket";
import { format, parse } from "date-fns"
import * as UI from "./cv_components"
import { useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";     // icons
import { BucketTypeNames, DynamicComponent, Item } from "../../../components/dnd/types";
import { useImmer } from "use-immer";

// TODO: atm InfoPad does not work because it does not supply CVContext
// These components should not be handling CVContext
// They have to use callbacks

function SectionUI(props: { obj: CVSection; onUpdate?: (newObj: any)=>void }) {

	const [data, setData] = useImmer(props.obj);

	// data -> parent
	useEffect(() => {
		props.onUpdate(data);
	}, [data]);

	const onItemUpdate = (i: number, newVal: any) => {
		setData(draft => {
			draft.items[i] = newVal;
		});
	};

	const onBucketUpdate = (newVals: any[]) => {
		setData(draft => {
			draft.items = newVals
		})
	}

	const formatHeader = (s: string) => s.toUpperCase();

	if(!data) return null;
	return (
		<div className="section" >
			<div className="sec-head">
				<p>{formatHeader(data.name)}</p>
				<hr />
			</div>
			<div id={`sec-${data.name}`} className="sec-content">
				<ItemBucket
					id={data.name}
					items={data.items?.map((item: any, i: number)=>({
						id:    `${data.name}-${i}`,
						value: item
					}))}
					type={data.bucket_type}
					onUpdate={onBucketUpdate}
				>
					{data.items?.map((item: any, i: number) =>
						<DynamicComponent
							key={`${i}-${i}`}
							type={data.bucket_type}
							props={{ obj: item, onUpdate: (newVal: any) => onItemUpdate(i, newVal) }}
						/>
						// <div>{`item-${i}`}</div>
					)}
				</ItemBucket>
			</div>
		</div>
	)
}

function SummaryUI(props: { obj: any, onUpdate?: (newObj: any)=>void }) {

	// data from parent:
	const [data, setData] = useImmer(props.obj);

	useEffect(() => {
		if(!data) return;
		props.onUpdate?.(data);
	}, [data]);

	const handleUpdate = (key: string, newVal: any) => {
		setData(draft => {
			draft[key] = newVal;
		});
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

// Note: we can make changes to this and it be local.
function ExperienceUI(props: {
	obj: Experience
	onUpdate?: (newObj: any)=>void
	disableBucketFeatures?: boolean
}) {

	const [data, setData] = useImmer(props.obj);

	useEffect(() => {
		if(!data) return;
		props.onUpdate?.(data);
	}, [data]);

	const handleUpdate = (field: keyof Experience, val: any) => {
		setData(draft => {
			draft[field] = val;
		});
	};

	const handleItemChange = (i: number, newVal: any) => {
		setData(draft => {
			draft.description[i] = newVal;
		});
	};

	const onBucketUpdate = (newVals: any[]) => {
		handleUpdate('description', newVals);
	};

	if (!data) {
		console.log("ExperienceUI, data = ", data);
		return null;
	}

	const bulletPoints = data.description.map((item: string, i: number)=>(
		<li key={i}>
			<TextEditDiv
				tv={item}
				onUpdate={newVal=>handleItemChange(i, newVal)}
			/>
		</li>
	));

	return (
		<div className="experience">
			{/* ROW 1 */}
			<div className="header-info">
				{/* ROW 1 */}
				<div className="hi-row-1">
					<div className="hi-col-1">
						<TextEditDiv className="title" tv={data.title} onUpdate={val => handleUpdate('title', val)} />
					</div>
					<div className="hi-col-2">
						<DateUI obj={data.date} onUpdate={val => handleUpdate('date', val)} />
					</div>
				</div>
				{/* ROW 2 */}
				<div className="hi-row-2">
					<div className="hi-col-1 role-item-list">
						{ data.role &&
						<TextEditDiv className="role" tv={data.role} onUpdate={val => handleUpdate('role', val)} />}
						{  (data.item_list && data.item_list.length>1) &&
						<>
						<span className="divider">|</span>
						<DelimitedList className="item-list" items={data.item_list} delimiter=", " onUpdate={val => handleUpdate('item_list', val)} />
						</>
						}
					</div>
					<div className="hi-col-2">
						{ data.location &&
						<TextEditDiv className="location" tv={data.location} onUpdate={val => handleUpdate('location', val)}/>}
					</div>
				</div>
			</div>
			{/* ROW 2 */}
			<div className="exp-content">
				<ul>
					{props.disableBucketFeatures ? bulletPoints : (
						<ItemBucket
							id="experience"
							items={data?.description?.map((item: string, i: number)=>({
								id: `${data.title}-bp${i}`,
								value: item
							}))}
							type={BucketTypeNames.EXP_POINTS}
							onUpdate={onBucketUpdate}
							replaceDisabled deleteOnMoveDisabled
							{...(props.disableBucketFeatures ? { addItemDisabled: true, deleteDisabled: true, dropDisabled: true, moveItemDisabled: true } : {})}
						>
							{bulletPoints}
						</ItemBucket>
					)}
				</ul>
			</div>
		</div>
	);
}

// TODO: this is a temp solution
// dont show date.
function ProjectUI(props: {
	obj: Experience;
	onUpdate?: (newObj: any)=>void
	disableBucketFeatures?: boolean;
}) {

	// data from parent:
	const [data, setData] = useImmer(props.obj);

	useEffect(() => {
		if(!data) return
		props.onUpdate?.(data)
	}, [data]);

	const handleUpdate = (field: keyof Experience, val: any) => {
		setData(draft => {
			draft[field] = val;
		});
	};

	const handleItemChange = (i: number, newVal: any) => {
		data.description[i] = newVal;
	};

	const onBucketUpdate = (newVals: any[]) => {
		handleUpdate("description", newVals)
	}

	if (!data) return null;

	const bucket_items = data.description.map((item: string, i: number)=>(
		<li key={i}>
			<TextEditDiv
				tv={item}
				onUpdate={newVal=>handleItemChange(i, newVal)}
			/>
		</li>
	));

	return (
		<div className="experience">
			{/* ROW 1 */}
			<div className="header-info">
				{/* ROW 1 */}
				<div className="hi-row-1">
					<div className="hi-col-1 role-item-list">
						<TextEditDiv className="title" tv={data.title} onUpdate={val => handleUpdate('title', val)} />
						{ (data.item_list && data.item_list.length>1) &&
						<>
						<span className="divider">|</span>
						<DelimitedList className="item-list" items={data.item_list} delimiter=", " onUpdate={val => handleUpdate('item_list', val)} />
						</>}
					</div>
					<div className="hi-col-2">
						{ data.link && <LinkUI {...data.link} /> }
					</div>
				</div>
			</div>
			{/* ROW 2 */}
			<div className="exp-content">
				<ul>
					{props.disableBucketFeatures ? bucket_items : (
						<ItemBucket
							id="experience"
							items={data?.description?.map((item: string, i: number)=>({
								id: `${data.title}-bp${i}`,
								value: item
							}))}
							type={BucketTypeNames.EXP_POINTS}
							onUpdate={onBucketUpdate}
							replaceDisabled deleteOnMoveDisabled
							{...(props.disableBucketFeatures ? { addItemDisabled: true, deleteDisabled: true, dropDisabled: true, moveItemDisabled: true } : {})}
						>
							{bucket_items}
						</ItemBucket>
					)}
				</ul>
			</div>
		</div>
	);
}

function DateUI(props: { obj: DateRange, onUpdate?: any }) {

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
			tv={strFromDateRange(props.obj)}
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
}

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
}

export { SectionUI, SummaryUI, ExperienceUI, ProjectUI, DateUI, LinkUI, DelimitedList }