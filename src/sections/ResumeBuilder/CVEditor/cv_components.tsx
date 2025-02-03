import "./cveditor.sass";
import { Experience, Link, MonthYear, DateRange, CVSection, CV } from "job-tool-shared-types";
import TextEditDiv from "../../../components/TextEditDiv/texteditdiv";
import { joinClassNames } from "../../../util/joinClassNames";
import ItemBucket from "../../../components/dnd/Bucket";
import { format, parse } from "date-fns"
import * as UI from "./cv_components"
import { Item } from "../../../components/dnd/types";
import useLogger from "../../../hooks/logger";
import { useEffect } from "react";
import { useImmer } from "use-immer";
import "@fortawesome/fontawesome-free/css/all.min.css";     // icons


function SectionUI(props: {
	obj: CVSection;
	children: any[];
	onUpdate?: (newObj: CVSection) => void;
}) {
	const [data, setData] = useImmer<CVSection>(null);

	// parent --> this
	useEffect(()=>{
		if(props.obj.name === "education") {
			log("education SectionUI received a new props.obj: ", props.obj);
		}
		if(!props.obj) return;
		setData(props.obj);
	}, [props.obj]);

	// this --> parent
	useEffect(()=>{
		if(!data) return;
		props.onUpdate?.(data);
	}, [data]);

	const log = useLogger("SectionUI");
	const formatHeader = (s: string) => s.toUpperCase();

	const handleBucketUpdate = (newItems: Item<string>[]) =>{
		log("handleBucketUpdate: ", newItems);
		setData(draft=>{
			draft.items = newItems.map((I: Item) => I.value);
		})
	};

	if(!data) return null;
	return (
		<div className="section" >
			<div className="sec-head">
				<p>{formatHeader(data.name)}</p>
				<hr />
			</div>
			<div id={`sec-${data.name}`} className="sec-content">
				<ItemBucket
					bucket={{
						id: data.name,
						items: data.items.map((item: any, i: number)=>({
							id:    `${data.name}-${i}`,
							value: item
						}))
					}}
					type={data.bucket_type}
					onUpdate={handleBucketUpdate}
				>
					{props.children}
				</ItemBucket>
			</div>
		</div>
	)
}

function SummaryUI(props: {
	obj: any,
	onUpdate?: (newObj: any) => void
}) {

	const handleUpdate = (key: string, newVal: any) => {
		props.onUpdate?.({...props.obj, [key]: newVal});
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
	obj: Experience;
	disableBucketFeatures?: boolean;
	onUpdate?: (newObj: Experience) => void;
}) {

	const [data, setData] = useImmer(null);

	// parent --> this
	useEffect(()=>{
		if(!props.obj) return;
		setData(props.obj);
	}, [props.obj]);

	// this --> parent
	useEffect(()=>{
		if(!data) return;
		props.onUpdate?.(data);
	}, [data])

	const handleUpdate = (field: keyof Experience, val: any) => {
		setData(cur=>{
			cur[field] = val;
		})
	};

	const handleItemChange = (i: number, newVal: any) => {
		setData(cur=>{
			cur.description[i] = newVal;
		})
	};

	if (!data) return null;

	const bucket_items = data.description.map((item: string, i: number)=>(
		<li>
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
				<div>
					<div>
						<TextEditDiv className="title" tv={data.title} onUpdate={val => handleUpdate('title', val)} />
						{ data.link && <LinkUI {...data.link} /> }
					</div>
					<DateUI obj={data.date} onUpdate={val => handleUpdate('date', val)} />
				</div>
				{/* ROW 2 */}
				<div>
					<div className="role-item-list">
						{ data.role     	? <TextEditDiv className="role" tv={data.role} onUpdate={val => handleUpdate('role', val)} /> 		: null }
						{ data.item_list && data.item_list.length>0  	? <DelimitedList className="item-list" items={data.item_list} delimiter=", " onUpdate={val => handleUpdate('item_list', val)} /> : null}
					</div>
					{ data.location ? <TextEditDiv className="location" tv={data.location} onUpdate={val => handleUpdate('location', val)}/> 	: null }
				</div>
			</div>
			{/* ROW 2 */}
			<div className="exp-content">
				<ul>
					{props.disableBucketFeatures ? bucket_items : (
						<ItemBucket
							bucket={{
								id: `${data.title}-bucket`,
								items: data.description.map((item: string, i: number)=>({
									id: `${data.title}-bp${i}`,
									value: item
								}))
							}}
							type={"exp-points"}
							onUpdate={newPoints => handleUpdate('description', newPoints.map(I=>I.value))}
							// By default, these are disabled
							replaceDisabled deleteOnMoveDisabled
							// Conditionally disabled
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

export { SectionUI, SummaryUI, ExperienceUI, DateUI, LinkUI, DelimitedList }