import "./resumebuilder.sass";
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { NamedCV } from "job-tool-shared-types";
import BackendAPI from "../../backend_api";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad, { CVInfo } from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import useLogger from "../../hooks/logger";
import SplitView from "../../components/SplitView/splitview";
import CVEditor, { CVEditorHandle } from "./CVEditor/cveditor";
import * as util from "../../util/fileInOut";
import { joinClassNames } from "../../util/joinClassNames";
import SubSection from "../../components/Section/SubSection";
import { PopupModal } from "../../components/PopupModal/PopupModal";
import TextEditDiv from "../../components/TextEditDiv/texteditdiv";
import TextItems from "../../components/TextItems/TextItems";

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";

/* ------------------------------------------------------------------
 *                       CV STATE MANAGER                           *
------------------------------------------------------------------- */

function useCVInfo() {

    const [cvInfo, setCVInfo] = useState<CVInfo>(null);

    const log = useLogger("useCVInfo");

    // FETCH the data:
    const fetchData = () => {
        if(USE_BACKEND) {
            BackendAPI.get<CVInfo>("cv_info").then(cv_info=>{
                if(cv_info) {
                    log(`got cv_info from backend`)
                    setCVInfo(cv_info);
                } else {
                    log(`NO cv_info from backend`)
                }
            });
        } else {
            // from the /public folder
            fetch(SAMPLES_PATH + "cv_info.json")
                .then(r => r.json())
                .then(setCVInfo);
        }
    };

    const get = () => cvInfo;

    // Extract the data from `cv_info` using the specified id
	const itemFromId = (sec_id: string, item_id: string): any => {
        if(!cvInfo)     return;
		const [groupId, itemId] = item_id.split("/", 2);
		if(!groupId) 	return
		else if(itemId) return cvInfo[sec_id][groupId][itemId];
		else 			return cvInfo[sec_id][groupId]; // most likely 'default'
	};

    return {
        fetchData,
        get,
        itemFromId,
        setCVInfo
    }
};

// Manages any state/controls relating to the CV builder
function useCVs() {

    // -------------------- STATE  --------------------

    const [named_cvs, set_named_cvs] = useState<NamedCV[]>(null);
    const [cur, set_cur] = useState<number>(null);

    useEffect(() => {
        if (!named_cvs || named_cvs.length === 0) return;
        log(`Got ${named_cvs.length} CVs from backend`);
        set_cur(0);
    }, [named_cvs]);

    const log = useLogger("ResumeBuilder");

    // ---------------- CONTROLS (what user sees) ----------------

    // setters

    const fetchData = () => {
        if(USE_BACKEND) {
            BackendAPI.get<NamedCV[]>("all_cvs").then(cvs=>{
                const valid_cvs = cvs?.filter(cv => cv && cv.name && cv.data);
                if(valid_cvs) set_named_cvs(valid_cvs)
            });
        }
        else {
            const samps = [
                "sample_resume1.json",
                "sample_resume2.json",
                "sample_resume3.json",
            ];
            const temp = [];

            const fetchPromises = samps.map(name =>
                fetch(`${SAMPLES_PATH}/CVs/${name}`)
                .then(r => r.json())
            );

            // Wait for all fetches to finish
            Promise.all(fetchPromises)
                .then((results) => {
                    set_named_cvs(results);
                })
                .catch((error) => {
                    // Handle any errors in the fetches
                    console.error("Error fetching CV data:", error);
                });

            set_named_cvs(temp);
        }
    };

    const changeCV = (name: string) => {
        const idx = named_cvs.findIndex((cv) => cv.name === name);
        log("Changing active_cv to:", named_cvs[idx].name);
        set_cur(idx);
    };

    const save2backend = (ncv: NamedCV) => {
        BackendAPI.post<NamedCV, null>("saveCV", ncv);
    };

    const importFromJson = (named_cv: NamedCV) => {
        set_named_cvs([named_cv, ...named_cvs]);
    };

    const deleteCur = (local?: boolean) => {
        // (for now) only delete locally
        set_named_cvs(prev=>{
            const newArr = [...prev];
            newArr.splice(cur, 1)
            return newArr;
        });
        set_cur(0);
    };

    // getters

    const curIdx = () => cur;
    const cvNames = () => named_cvs?.map((ncv) => ncv.name);
    const curCV = () => named_cvs ? named_cvs[cur] : null;

    return { fetchData, curIdx, cvNames, curCV, importFromJson, changeCV, save2backend, deleteCur };
}

/* ------------------------------------------------------------------
 *                         SUB COMPONENTS                           *
------------------------------------------------------------------- */

const SaveForm = (props: {
    name: string,
    tags: string[],
    onSave: (name: string, tags: string[]) => void,
    disabled?: boolean
}) => {

    const [name, setName] = useState(null);
    const [tags, setTags] = useState(null);
    const tags_ref = useRef(null);
    const [isNameValid, setIsNameValid] = useState(true);
    const [reason, setReason] = useState("File exists. Will overwrite!");

    useEffect(()=>setName(props.name), [props.name]);
    useEffect(()=>setTags(props.tags), [props.tags]);

    // Handle name input
    const handleNameChange = (newName: string) => {
        setName(newName);
        const isValid = newName && newName != "";
        setIsNameValid(isValid);
        setReason(
            !isValid ? "Invalid file name!" :
            (newName === name) ? "File exists. Will overwrite!" : ""
        );
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        props.onSave(name, tags_ref.current.get());
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
            <p>File Name:</p>
            <TextEditDiv tv={name} onUpdate={handleNameChange}/>
            <p style={{ color: isNameValid?"grey":"black"}}>
                {reason}
            </p>

            <p>Tags (optional):</p>
            <TextItems initItems={tags} ref={tags_ref}/>

            <button type="submit" disabled={!isNameValid}>Save</button>
        </form>
    );
};

function SavedCVs(props: {
    cvNames: string[];
    curIdx: number;
    onChange: (name: string) => void;
    onAdd?: () => void;
}) {
    const curName = props.cvNames ? props.cvNames[props.curIdx] : "";

    const CVThumnail = (name: string) => (
        <div
            className={joinClassNames(
                "cv-thumbnail",
                name === curName ? "active" : ""
            )}
            onClick={(e) => props.onChange(name)}
        >
            {name}
        </div>
    );

    return (
        <div className="cv-thumnail-container">
            {props.cvNames?.map(CVThumnail)}
        </div>
    );
}

/* ------------------------------------------------------------------
 *                         ROOT COMPONENT                           *
------------------------------------------------------------------- */
function ResumeBuilder() {
    // ---------------- STATE ----------------

    const cvsState = useCVs();
    const cvInfoState = useCVInfo();

    const editor_ref = useRef<CVEditorHandle>(null);
    const [settingN, setSettingN] = useState(null); // null => none, 0 => SavedCVs, 1 => file settings
    const saveAsPDF = useComponent2PDF("cv-page");

    // references to popup modal elements
    const export_modal = useRef(null)
    const save_modal = useRef(null)
    const import_modal = useRef(null);
    const delete_modal = useRef(null);

    // Fetch data on mount
    useEffect(()=>{
        cvsState.fetchData();
        cvInfoState.fetchData();
    }, [])

    // ---------------- VIEW ----------------

    const popup_modals = [
        (
            <PopupModal ref={export_modal}>
                <div className="export-popup">
                    <button onClick={() => {
                        saveAsPDF(cvsState.curCV()?.name);
                        export_modal.current.close();
                    }}>PDF</button>
                    <button onClick={()=>{
                        util.downloadAsJson(editor_ref.current.getCV());
                        export_modal.current.close();
                    }}>JSON</button>
                </div>
            </PopupModal>
        ),
        (
            <PopupModal ref={save_modal}>
                <SaveForm
                    name={cvsState.curCV()?.name}
                    tags={cvsState.curCV()?.tags}
                    onSave={(newName: string, newTags: string[]) => {
                        cvsState.save2backend({
                            name: newName,
                            tags: newTags,
                            data: editor_ref.current.getCV()
                        });
                        save_modal.current.close();
                    }}
                />
            </PopupModal>
        ),
        (
            <PopupModal ref={import_modal}>
                <p>New Resume from JSON:</p>
                <input type="file" accept=".json" onChange={e => {
                    util.jsonFileImport(e, cvsState.importFromJson);
                    import_modal.current.close();
                }}/>
            </PopupModal>
        ),
        (
            <PopupModal ref={delete_modal}>
                <p>Are you sure you want to delete?</p>
                <button onClick={()=>{
                    cvsState.deleteCur();
                    delete_modal.current.close()
                }}>Yes</button>
            </PopupModal>
        )
    ];

    const settings = [
        ( // FILE:
            <SubSection id="ss-named-cvs" heading="My Resumes">
                <div id="named-cvs-controls">
                    <div onClick={()=>import_modal.current.open()}>+</div>
                    <div onClick={()=>delete_modal.current.open()}>-</div>
                </div>
                <SavedCVs
                    cvNames={cvsState.cvNames()}
                    curIdx={cvsState.curIdx()}
                    onChange={cvsState.changeCV}
                />
            </SubSection>
        ),
        ( // File CONTROLS:
            <div id="file-controls">
                <div style={{ display: "flex", gap: "10rem" }}>
                    <p>New Saved Items from JSON:</p>
                    <input type="file" accept=".json" onChange={(ev) =>
                        util.jsonFileImport(ev, ({ name, data }) =>
                            cvInfoState.setCVInfo(data)
                        )}
                    />
                </div>
                <div onClick={()=>export_modal.current.open()}>Export</div>
                {USE_BACKEND && <div onClick={()=>save_modal.current.open()}>Save</div>}
            </div>
        )
    ];

    if (!cvsState.cvNames() || !cvInfoState.get()) return null;
    return (
        <Section id="section-cv" heading="Resume Builder">
            {/* ------------ SETTINGS ------------ */}
            {popup_modals}
            <div>
                <div className="resume-builder-controls">
                    <div className={settingN===1?"selected":""} onClick={()=>setSettingN(prev=>prev===1?null:1)}>File</div>
                    <div className={settingN===0?"selected":""} onClick={()=>setSettingN(prev=>prev===0?null:0)}>Select</div>
                </div>
                { settingN!==null && settings[settingN] }
            </div>

            {/* ------------ CUR CV INFO ------------ */}
            <div id="display-info">
                <div><span className="descr">Name:</span> {cvsState.curCV().name}</div>
                <div><span className="descr">Tags:</span> {cvsState.curCV()?.tags?.join(", ")}</div>
            </div>

             {/* ------------ CV EDITOR ------------ */}
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        <CVEditor cv={cvsState.curCV()?.data} itemFromId={cvInfoState.itemFromId} ref={editor_ref} />
                    </PrintablePage>
                    {/* <div>TESTING</div> */}
                    <InfoPad info={cvInfoState.get()} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;
