import "./resumebuilder.sass";
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { CVSection, NamedCV } from "job-tool-shared-types";
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

// Manages any state/controls relating to the CV builder
function useCVManager() {
    // ---------------- STATE (internal) ----------------
    const [named_cvs, set_named_cvs] = useState<NamedCV[]>(null);
    const [cvInfo, setCVInfo] = useState<CVInfo>(null);
    const [cur, set_cur] = useState<number>(null);

    useEffect(() => {
        if(USE_BACKEND) {
            BackendAPI.get<NamedCV[]>("all_cvs").then(cvs=>{
                set_named_cvs(cvs?.filter(cv => cv && cv.name && cv.data))
            });
            BackendAPI.get<CVInfo>("cv_info").then(setCVInfo);
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

            // CV-INFO:
            fetch(SAMPLES_PATH + "cv_info.json")
                .then((r) => r.json())
                .then(setCVInfo);
        }
    }, []);

    useEffect(() => {
        if (!named_cvs || named_cvs.length === 0) return;
        log(`Got ${named_cvs.length} CVs from backend`);
        set_cur(0);
    }, [named_cvs]);

    const log = useLogger("ResumeBuilder");

    // ---------------- CONTROLS (what user sees) ----------------

    // other

    // TODO: this is a workaround
    const sec2Content = (cvsec: CVSection) => {
        if(!cvInfo) return;
        const sec = cvInfo[cvsec.name];
        const sec_items = cvsec.item_ids.map((itemId:string)=>{
            const [groupId, nameId] = itemId.split("/", 2);
            const obj = sec[groupId][nameId];
            return { id: itemId, value: obj };
        })
        return {
            name: cvsec.name,
            bucket_type: cvsec.bucket_type,
            content: sec_items,
        }
    };

    // setters

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
    const curName = () => named_cvs ? named_cvs[cur]?.name : null;
    const curData = () => named_cvs[cur]?.data;
    const curTags = () => named_cvs ? named_cvs[cur]?.tags : null;
    const getCVInfo = () => cvInfo;

    return {
        curIdx,
        cvNames,
        curName,
        curTags,
        getCVInfo,
        curData,
        setCVInfo,
        importFromJson,
        changeCV,
        save2backend,
        deleteCur,
        sec2Content
    };
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

    const state = useCVManager();
    const editor_ref = useRef<CVEditorHandle>(null);
    const [settingN, setSettingN] = useState(null); // null => none, 0 => SavedCVs, 1 => file settings
    const saveAsPDF = useComponent2PDF("cv-page");

    const export_modal = useRef(null)
    const save_modal = useRef(null)
    const import_modal = useRef(null);
    const delete_modal = useRef(null);

    // ---------------- VIEW ----------------

    const popup_modals = [
        (
            <PopupModal ref={export_modal}>
                <div className="export-popup">
                    <button onClick={() => {
                        saveAsPDF(state.curName());
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
                    name={state.curName()}
                    tags={state.curTags()}
                    onSave={(newName: string, newTags: string[]) => {
                        state.save2backend({
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
                    util.jsonFileImport(e, state.importFromJson);
                    import_modal.current.close();
                }}/>
            </PopupModal>
        ),
        (
            <PopupModal ref={delete_modal}>
                <p>Are you sure you want to delete?</p>
                <button onClick={()=>{
                    state.deleteCur();
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
                    cvNames={state.cvNames()}
                    curIdx={state.curIdx()}
                    onChange={state.changeCV}
                />
            </SubSection>
        ),
        ( // File CONTROLS:
            <div id="file-controls">
                <div style={{ display: "flex", gap: "10rem" }}>
                    <p>New Saved Items from JSON:</p>
                    <input type="file" accept=".json" onChange={(ev) =>
                        util.jsonFileImport(ev, ({ name, data }) =>
                            state.setCVInfo(data)
                        )}
                    />
                </div>
                <div onClick={()=>export_modal.current.open()}>Export</div>
                {USE_BACKEND && <div onClick={()=>save_modal.current.open()}>Save</div>}
            </div>
        )
    ];

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
                <div><span className="descr">Name:</span> {state.curName()}</div>
                <div><span className="descr">Tags:</span> {state.curTags()?.join(", ")}</div>
            </div>

             {/* ------------ CV EDITOR ------------ */}
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        {state.cvNames() && (
                            <CVEditor cv={state.curData()} sec2Content={state.sec2Content} ref={editor_ref} />
                        )}
                    </PrintablePage>
                    {/* <div>TESTING</div> */}
                    <InfoPad info={state.getCVInfo()} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;
