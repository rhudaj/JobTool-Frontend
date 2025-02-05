import "./resumebuilder.sass";
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { NamedCV } from "job-tool-shared-types";
import BackendAPI from "../../backend_api";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad, { CVInfo, InfoPadHandle } from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import useLogger from "../../hooks/logger";
import SplitView from "../../components/SplitView/splitview";
import CVEditor, { CVEditorHandle } from "./CVEditor/cveditor";
import * as util from "../../util/fileInOut";
import { joinClassNames } from "../../util/joinClassNames";
import SubSection from "../../components/Section/SubSection";
import TextEditDiv from "../../components/TextEditDiv/texteditdiv";
import TextItems from "../../components/TextItems/TextItems";
import { usePopup } from "../../hooks/Popup/popup";
import { useImmer } from "use-immer";

// Get settigns from .env file
const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const TEST_MODE = process.env.REACT_APP_TEST_MODE === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";
const CVS_PATH = `${SAMPLES_PATH}/CVs`;

console.log("USE_BACKEND: ", USE_BACKEND, " TEST_MODE: ", TEST_MODE);

/* ------------------------------------------------------------------
 *                       CV STATE MANAGER                           *
------------------------------------------------------------------- */

function useCVInfo() {

    const [data, setData] = useState<CVInfo>(null);
    const [status, setStatus] = useState<boolean>(false);   // was the data fetched?

    useEffect(()=> log("Status == ", status), [status]);

    const log = useLogger("useCVInfo");

    // FETCH the data:
    const fetchData = () => {
        if(USE_BACKEND) {
            BackendAPI.request<undefined, CVInfo>({
                method: "GET",
                endpoint: "cv_info",
                handleSuccess: cv_info => { setData(cv_info); setStatus(true); },
                handleError: (msg: string) => {
                    setStatus(false);
                    alert(msg);
                },
            })
        } else {
            // from the /public folder
            fetch(SAMPLES_PATH + "cv_info.json")
            .then(r => r.json())
            .then(cv_info => {
                if(cv_info) {
                    log(`got cv_info from ${SAMPLES_PATH}`);
                    setData(cv_info);
                    setStatus(true);
                } else {
                    setStatus(false);
                }
            });
        }
    };

    const save2backend = (newData: CVInfo) => {
        BackendAPI.request<CVInfo>({
            method: "POST",
            endpoint: "saveCVInfo",
            body: newData,
            handleSuccess: () => alert("Success! Saved cv info"),
            handleError: alert,
        });
    };

    const get = () => data;

    // Extract the data from `cv_info` using the specified id
	const itemFromId = (sec_id: string, item_id: string): any => {
        const [groupId, itemId] = item_id.split("/", 2);
        if(!data)           return;
		else if (!groupId) 	return
		else if(itemId)     return data[sec_id][groupId][itemId];
		else 			    return data[sec_id][groupId];           // most likely 'default'
	};

    return {
        status,
        fetchData,
        get,
        setData,
        itemFromId,
        save2backend
    }
};

// Manages any state/controls relating to the list of cv's
function useCVs() {

    // -------------------- STATE  --------------------

    const [data, setData] = useState<NamedCV[]>(null);
    const [status, setStatus] = useState<boolean>(false);   // was the data fetched?
    const [cur, set_cur] = useState<number>(null);

    const [log, warn] = useLogger("ResumeBuilder");

    // ---------------- CONTROLS (what user sees) ----------------

    useEffect(()=>{
        log("cur/data has changed!");
    }, [cur, data])

    // setters

    const fetchData = () => {
        if(USE_BACKEND) {
            BackendAPI.request<undefined, NamedCV[]>({
                method: "GET",
                endpoint: "all_cvs",
                handleSuccess: ncvs=>{
                    setData(ncvs);
                    set_cur(0);
                    setStatus(true);
                },
                handleError: (msg: string) => {
                    setStatus(false);
                    alert(msg);
                }
            })
        }
        else {
            const samps = [
                "sample_resume1.json",
                "sample_resume2.json",
                "sample_resume3.json",
            ];

            // Fetch all sample files:
            Promise.all(
                samps.map(name =>
                    fetch(`${CVS_PATH}/${name}`)
                    .then(r => r.json())
                )
            )
            // Once they're all fetched:
            .then((cv_arr) => {
                // Once they
                if(cv_arr.length > 0) {
                    log(`Got ${cv_arr.length} CVs from ${CVS_PATH}`)
                    setData(cv_arr);
                    set_cur(0);
                    setStatus(true);
                } else {
                    setStatus(false);
                }
            })
            // If you encountered an error:
            .catch((error) => {
                warn("Error fetching CV data:", error);
                setStatus(false);
            });
        }
    };

    const changeCV = (name: string) => {
        const idx = data.findIndex((cv: NamedCV) => cv.name === name);
        log("Changing active_cv to:", data[idx].name);
        set_cur(idx);
    };

    const save2backend = (ncv: NamedCV) => {
        BackendAPI.request<NamedCV>({
            method: "POST",
            endpoint: "saveCV",
            body: ncv,
            handleSuccess: ()=>alert("Saved CV!"),
            handleError: alert
        })
    };

    const add = (named_cv: NamedCV) => {
        setData([named_cv, ...data]);
    };

    const deleteCur = (local?: boolean) => {
        // (for now) only delete locally
        setData(prev=>{
            const newArr = [...prev];
            newArr.splice(cur, 1)
            return newArr;
        });
        set_cur(0);
    };

    // getters

    const curIdx = () => cur;
    const cvNames = () => data?.map((ncv: NamedCV) => ncv.name);
    const curCV = () => data ? data[cur] : null;

    return { status, fetchData, curIdx, cvNames, curCV, add, changeCV, save2backend, deleteCur };
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

const ImportForm = (props: {
    onComplete: (ncv: NamedCV) => void;
}) => {

    const [ncv, setNCV] = useImmer<NamedCV>(null);
    const [errMsg, setErrMsg] = useState("");

    useEffect(()=>{
        if(!ncv) return;
        console.log("ncv: ", ncv);
    }, [ncv])

    // only the data not a full NamedCV json
    const onJsonFromText = (txt: string) => {
        let parsed: any;
        try {
            parsed = JSON.parse(txt);
        } catch (err: unknown) {
            setErrMsg(String(err))
            setNCV(null);
            return;
        }
        setErrMsg("");
        setNCV({
            name: "untitled",
            data: parsed,
            tags: [],
        })
    };

    const onImportNCVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        util.jsonFileImport(e, setNCV);
    };

    const onDoneClicked = () => {
        props.onComplete(ncv);
    }

    return (
        <div className="popup-content" id="import-popup">
            <p>Import from JSON</p>
            <div>
                <p>Copy and Paste</p>
                <textarea
                    className="json-paste-area"
                    placeholder="paste json"
                    onPaste={(e)=>onJsonFromText(e.clipboardData.getData('Text'))}
                />
                <p className="error-message">{errMsg}</p>
            </div>
            <div>
                <p>Import File</p>
                <input type="file" accept=".json" onChange={onImportNCVFile}/>
            </div>
            <div>
                <button disabled={ncv===null} onClick={onDoneClicked}>Done</button>
            </div>
        </div>
    );
};

// If TEST_MODE is enabled
const SaveTrainingExampleForm = (props: {
    onSave: (job: string) => void;
}) => {

    const [job, setJob] = useState<string>(null);

    return (
        <div className="popup-content">
            <p>Save Training Example</p>
            <textarea
                className="job-paste-area"
                placeholder="paste job description"
                onBlur={(e)=>setJob(e.target.value)}
            />
            <button disabled={job === null} onClick={()=>props.onSave(job)}>Save</button>
        </div>
    )
};

function SavedCVs(props: {
    cvNames: string[];
    curIdx: number;
    onChange: (name: string) => void;
    onAdd?: () => void;
}) {
    const curName = props.cvNames ? props.cvNames[props.curIdx] : "";

    const CVThumnail = ({name}) => (
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
            {props.cvNames?.map((name, i)=>
                <CVThumnail key={i} name={name} />
            )}
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
    const infoPad_ref = useRef<InfoPadHandle>(null);

    const [settingN, setSettingN] = useState(null); // null => none, 0 => SavedCVs, 1 => file settings
    const saveAsPDF = useComponent2PDF("cv-page");

    // references to popup modal elements
    const exportPopup = usePopup();
    const savePopup = usePopup();
    const importPopup = usePopup();
    const deletePopup = usePopup();
    const saveTrainExPopup = usePopup();

    // Fetch data on mount
    useEffect(()=>{
        cvsState.fetchData();
        cvInfoState.fetchData();
    }, [])

    // ---------------- CONTROLS ----------------

    const CONTROLS = {
        popups: {
            onPDFClicked: () => {
                saveAsPDF(cvsState.curCV()?.name);
                exportPopup.close();
            },
            onJsonClicked: () => {
                const cv = editor_ref.current.getCV();
                if(cv) util.downloadAsJson(cv);
                exportPopup.close();
            },
            onSaveFormSubmit: (newName: string, newTags: string[]) => {
                cvsState.save2backend({
                    name: newName,
                    tags: newTags,
                    data: editor_ref.current.getCV()
                });
                savePopup.close();
            },
            onImportJsonFileChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                util.jsonFileImport(e, cvsState.add);
                importPopup.close();
            },
            onPasteJson: (json_str: string, name: string) => {
                const cv = JSON.parse(json_str);
                cvsState.add(cv)
            },
            onDeleteCV: ()=>{
                cvsState.deleteCur();
                deletePopup.close()
            },
            onSaveTrainEx: (job: string) => {
                console.log("onSaveTrainEx: job = ", job);
                BackendAPI.request<{job: string, ncv: NamedCV}>({
                    method: "POST",
                    endpoint: "saveCVTrainEx",
                    body: {
                        job: job,
                        ncv: cvsState.curCV()
                    },
                    handleSuccess: () => {
                        alert("Saved Training Example")
                        saveTrainExPopup.close();
                    },
                    handleError: alert
                })
            }
        },
        settings: {
            onPlusClicked: () => {
                importPopup.open(popup_content.import);
            },
            onMinusClicked: () => {
                deletePopup.open(popup_content.delete);
            },
            onSavedItemsFileChanged: (ev: React.ChangeEvent<HTMLInputElement>) => {
                util.jsonFileImport(ev, ({ name, data }) => cvInfoState.setData(data) );
            },
            onExportClicked: () => {
                exportPopup.open(popup_content.export);
            },
            onSaveCurCVClicked: () => {
                savePopup.open(popup_content.save);
            },
            onSaveCVInfoClicked: ()=>{
                const new_cv_info: CVInfo = infoPad_ref.current.get();
                cvInfoState.setData(new_cv_info);
                cvInfoState.save2backend(new_cv_info);
            },
            onImportFormComplete: (ncv: NamedCV) => {
                cvsState.add(ncv);
                importPopup.close();
            },
            onSaveTrainExClicked: () => {
                saveTrainExPopup.open(popup_content.saveTrainEx)
            }
        },
        settings_ui: {
            onClickFileSettings: () => {
                setSettingN(prev=>prev===1?null:1);
            },
            onClickSelectSettings: () => {
                setSettingN(prev=>prev===0?null:0);
            }
        }
    };

    // ---------------- VIEW ----------------

    const popup_content = {
        export: (
            <div className="popup-content export-popup">
                <h2>Export As</h2>
                <button onClick={CONTROLS.popups.onPDFClicked}>PDF</button>
                <button onClick={CONTROLS.popups.onJsonClicked}>JSON</button>
            </div>
        ),
        save: (
            <SaveForm
                name={cvsState.curCV()?.name}
                tags={cvsState.curCV()?.tags}
                onSave={CONTROLS.popups.onSaveFormSubmit}
            />
        ),
        import: (
            <div className="popup-content" id="import-popup">
                <ImportForm onComplete={CONTROLS.settings.onImportFormComplete}/>
            </div>
        ),
        delete: (
            <div className="popup-content">
                <p>Are you sure you want to delete?</p>
                <button onClick={CONTROLS.popups.onDeleteCV}>Yes</button>
            </div>
        ),
        saveTrainEx: (
            <SaveTrainingExampleForm onSave={CONTROLS.popups.onSaveTrainEx}/>
        )
    };

    const settings = [
        ( // FILE:
            <SubSection id="ss-named-cvs" heading="My Resumes">
                <div id="named-cvs-controls">
                    <div onClick={CONTROLS.settings.onPlusClicked}>+</div>
                    <div onClick={CONTROLS.settings.onMinusClicked}>-</div>
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
                    <input type="file" accept=".json" onChange={CONTROLS.settings.onSavedItemsFileChanged}/>
                </div>
                {USE_BACKEND &&
                    <>
                    <button onClick={CONTROLS.settings.onSaveCurCVClicked}>Save Current CV</button>
                    <button onClick={CONTROLS.settings.onSaveCVInfoClicked}>Save CV Info</button>
                    </>
                }
                {TEST_MODE ?
                    <button onClick={CONTROLS.settings.onSaveTrainExClicked}>Save Train Example</button>
                    : null
                }
            </div>
        )
    ];

    if (!cvsState.status || !cvInfoState.status) return null;
    return (
        <Section id="section-cv" heading="Resume Builder">
            {/* ------------ POPUPS ------------ */}
            {[exportPopup.PopupComponent, savePopup.PopupComponent, importPopup.PopupComponent, deletePopup.PopupComponent, saveTrainExPopup.PopupComponent]}
            {/* ------------ SETTINGS ------------ */}
            <div>
                <div className="resume-builder-controls">
                    <div className={settingN===1?"selected":""} onClick={CONTROLS.settings_ui.onClickFileSettings}>File</div>
                    <div className={settingN===0?"selected":""} onClick={CONTROLS.settings_ui.onClickSelectSettings}>Select</div>
                </div>
                { settingN!==null && settings[settingN] }
            </div>
            {/* ------------ DISPLAY THE CURRENT CV's META INFO ------------ */}
            <div id="display-info">
                <div>
                    <span className="descr">Name:</span> {cvsState.curCV()?.name}
                </div>
                <div>
                    <span className="descr">Tags:</span>
                    {cvsState.curCV()?.tags?.join(", ")}
                </div>
                <div className="export-container">
                    <button onClick={CONTROLS.settings.onExportClicked}>Export</button>
                </div>
            </div>
             {/* ------------ CV EDITOR ------------ */}
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        <CVEditor cv={cvsState.curCV()?.data} ref={editor_ref} />
                    </PrintablePage>
                    {/* <div>TESTING</div> */}
                    <InfoPad ref={infoPad_ref} info={cvInfoState.get()} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;
