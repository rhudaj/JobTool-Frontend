import "./resumebuilder.sass";
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { NamedCV } from "job-tool-shared-types";
import BackendAPI from "../../backend_api";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad, {
    CVInfo,
    InfoPadHandle,
} from "../../components/infoPad/infoPad";
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
import { isEqual } from "lodash";
import { useCVs } from "./useCVs";

// Get settigns from .env file
const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const TEST_MODE = process.env.REACT_APP_TEST_MODE === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/";

console.log("USE_BACKEND: ", USE_BACKEND, " TEST_MODE: ", TEST_MODE);

/* ------------------------------------------------------------------
 *                       CV STATE MANAGER                           *
------------------------------------------------------------------- */

function useCVInfo() {
    const [data, setData] = useState<CVInfo>(null);
    const [status, setStatus] = useState<boolean>(false); // was the data fetched?

    const log = useLogger("useCVInfo");

    // FETCH the data:
    const fetchData = () => {
        if (USE_BACKEND) {
            BackendAPI.request<undefined, CVInfo>({
                method: "GET",
                endpoint: "cv_info",
                handleSuccess: (cv_info) => {
                    setData(cv_info);
                    setStatus(true);
                },
                handleError: (msg: string) => {
                    setStatus(false);
                    alert(msg);
                },
            });
        } else {
            // from the /public folder
            fetch(SAMPLES_PATH + "cv_info.json")
                .then((r) => r.json())
                .then((cv_info) => {
                    if (cv_info) {
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
        if (!data) return;
        else if (!groupId) return;
        else if (itemId) return data[sec_id][groupId][itemId];
        else return data[sec_id][groupId]; // most likely 'default'
    };

    return {
        status,
        fetchData,
        get,
        setData,
        itemFromId,
        save2backend,
    };
}

/* ------------------------------------------------------------------
 *                         SUB COMPONENTS                           *
------------------------------------------------------------------- */

const SaveForm = (props: {
    name: string;
    tags: string[];
    onSave: (name: string, tags: string[]) => void;
    disabled?: boolean;
}) => {
    const [name, setName] = useState(null);
    const [tags, setTags] = useState(null);
    const tags_ref = useRef(null);
    const [isNameValid, setIsNameValid] = useState(true);
    const [reason, setReason] = useState("File exists. Will overwrite!");

    useEffect(() => setName(props.name), [props.name]);
    useEffect(() => setTags(props.tags), [props.tags]);

    // Handle name input
    const handleNameChange = (newName: string) => {
        setName(newName);
        const isValid = newName && newName != "";
        setIsNameValid(isValid);
        setReason(
            !isValid
                ? "Invalid file name!"
                : newName === name
                ? "File exists. Will overwrite!"
                : ""
        );
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        props.onSave(name, tags_ref.current.get());
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "5rem" }}
        >
            <p>File Name:</p>
            <TextEditDiv tv={name} onUpdate={handleNameChange} />
            <p style={{ color: isNameValid ? "grey" : "black" }}>{reason}</p>

            <p>Tags (optional):</p>
            <TextItems initItems={tags} ref={tags_ref} />

            <button type="submit" disabled={!isNameValid}>
                Save
            </button>
        </form>
    );
};

const ImportForm = (props: { onComplete: (ncv: NamedCV) => void }) => {
    const [ncv, setNCV] = useImmer<NamedCV>(null);
    const [errMsg, setErrMsg] = useState("");

    useEffect(() => {
        if (!ncv) return;
        console.log("ncv: ", ncv);
    }, [ncv]);

    // only the data not a full NamedCV json
    const onJsonFromText = (txt: string) => {
        let parsed: any;
        try {
            parsed = JSON.parse(txt);
        } catch (err: unknown) {
            setErrMsg(String(err));
            setNCV(null);
            return;
        }
        setErrMsg("");
        setNCV({
            name: "untitled",
            data: parsed,
            tags: [],
        });
    };

    const onImportNCVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        util.jsonFileImport(e, setNCV);
    };

    const onDoneClicked = () => {
        props.onComplete(ncv);
    };

    return (
        <div className="popup-content" id="import-popup">
            <p>Import from JSON</p>
            <div>
                <p>Copy and Paste</p>
                <textarea
                    className="json-paste-area"
                    placeholder="paste json"
                    onPaste={(e) =>
                        onJsonFromText(e.clipboardData.getData("Text"))
                    }
                />
                <p className="error-message">{errMsg}</p>
            </div>
            <div>
                <p>Import File</p>
                <input type="file" accept=".json" onChange={onImportNCVFile} />
            </div>
            <div>
                <button disabled={ncv === null} onClick={onDoneClicked}>
                    Done
                </button>
            </div>
        </div>
    );
};

// If TEST_MODE is enabled
const SaveTrainingExampleForm = (props: { onSave: (job: string) => void }) => {
    const [job, setJob] = useState<string>(null);

    return (
        <div className="popup-content">
            <p>Save Training Example</p>
            <textarea
                className="job-paste-area"
                placeholder="paste job description"
                onBlur={(e) => setJob(e.target.value)}
            />
            <button disabled={job === null} onClick={() => props.onSave(job)}>
                Save
            </button>
        </div>
    );
};

function SavedCVs(props: {
    cvNames: string[];
    curIdx: number;
    onChange: (idx: number) => void;
    onAdd?: () => void;
    isModified?: boolean[];
}) {
    const curName = props.cvNames ? props.cvNames[props.curIdx] : "";

    return (
        <div className="cv-thumnail-container">
            {props.cvNames?.map((name, idx) => (
                <div
                    key={name} // TODO: ensure names are unique
                    className={joinClassNames(
                        "cv-thumbnail",
                        name === curName ? "active" : "",
                        props.isModified?.[idx] ? "is-modified" : ""
                    )}
                    onClick={() => props.onChange(idx)}
                >
                    {name}
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------
 *                         ROOT COMPONENT                           *
------------------------------------------------------------------- */
function ResumeBuilder() {
    // ---------------- STATE ----------------

    const cvs = useCVs();
    const cv_info = useCVInfo();

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
    useEffect(() => {
        cvs.fetch();
        cv_info.fetchData();
    }, []);

    // ---------------- CONTROLS ----------------

    const CONTROLS = {
        popups: {
            onPDFClicked: () => {
                saveAsPDF(cvs.cur?.name);
                exportPopup.close();
            },
            onJsonClicked: () => {
                const cv = editor_ref.current.getCV();
                if (cv) util.downloadAsJson(cv);
                exportPopup.close();
            },
            onSaveFormSubmit: (newName: string, newTags: string[]) => {
                // first check that the cv has actually changed!

                const edited_cv = editor_ref.current.getCV();

                if (isEqual(edited_cv, cvs.cur.data)) {
                    alert("No changes have been made to the CV!");
                    return;
                }

                cvs.save({
                    name: newName,
                    tags: newTags,
                    data: editor_ref.current.getCV(),
                });
                savePopup.close();
            },
            onImportJsonFileChange: (
                e: React.ChangeEvent<HTMLInputElement>
            ) => {
                util.jsonFileImport(e, cvs.add);
                importPopup.close();
            },
            onPasteJson: (json_str: string, name: string) => {
                const cv = JSON.parse(json_str);
                cvs.add(cv);
            },
            onDeleteCV: () => {
                cvs.deleteCur();
                deletePopup.close();
            },
            onSaveTrainEx: (job: string) => {
                console.log("onSaveTrainEx: job = ", job);
                BackendAPI.request<{ job: string; ncv: NamedCV }>({
                    method: "POST",
                    endpoint: "saveCVTrainEx",
                    body: {
                        job: job,
                        ncv: cvs.cur,
                    },
                    handleSuccess: () => {
                        alert("Saved Training Example");
                        saveTrainExPopup.close();
                    },
                    handleError: alert,
                });
            },
        },
        settings: {
            onPlusClicked: () => {
                importPopup.open(popup_content.import);
            },
            onMinusClicked: () => {
                deletePopup.open(popup_content.delete);
            },
            onSavedItemsFileChanged: (
                ev: React.ChangeEvent<HTMLInputElement>
            ) => {
                util.jsonFileImport(ev, ({ name, data }) =>
                    cv_info.setData(data)
                );
            },
            onExportClicked: () => {
                exportPopup.open(popup_content.export);
            },
            onSaveCurCVClicked: () => {
                savePopup.open(popup_content.save);
            },
            onSaveCVInfoClicked: () => {
                const new_cv_info: CVInfo = infoPad_ref.current.get();
                cv_info.setData(new_cv_info);
                cv_info.save2backend(new_cv_info);
            },
            onImportFormComplete: (ncv: NamedCV) => {
                cvs.add(ncv);
                importPopup.close();
            },
            onSaveTrainExClicked: () => {
                saveTrainExPopup.open(popup_content.saveTrainEx);
            },
        },
        settings_ui: {
            onClickFileSettings: () => {
                setSettingN((prev) => (prev === 1 ? null : 1));
            },
            onClickSelectSettings: () => {
                setSettingN((prev) => (prev === 0 ? null : 0));
            },
        },
        other: {
            onCurCvModified: () => {
                cvs.setCurModified(true, editor_ref.current.getCV());
            },
        },
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
                name={cvs.cur?.name}
                tags={cvs.cur?.tags}
                onSave={CONTROLS.popups.onSaveFormSubmit}
            />
        ),
        import: (
            <div className="popup-content" id="import-popup">
                <ImportForm
                    onComplete={CONTROLS.settings.onImportFormComplete}
                />
            </div>
        ),
        delete: (
            <div className="popup-content">
                <p>Are you sure you want to delete?</p>
                <button onClick={CONTROLS.popups.onDeleteCV}>Yes</button>
            </div>
        ),
        saveTrainEx: (
            <SaveTrainingExampleForm onSave={CONTROLS.popups.onSaveTrainEx} />
        ),
    };

    const settings = [
        // FILE:
        <SubSection id="ss-named-cvs" heading="My Resumes">
            <div id="named-cvs-controls">
                <div onClick={CONTROLS.settings.onPlusClicked}>+</div>
                <div onClick={CONTROLS.settings.onMinusClicked}>-</div>
            </div>
            <SavedCVs
                cvNames={cvs.cvNames}
                curIdx={cvs.curIdx}
                onChange={cvs.selectCur}
                isModified={cvs.mods}
            />
        </SubSection>, // File CONTROLS:
        <div id="file-controls">
            <div style={{ display: "flex", gap: "10rem" }}>
                <p>New Saved Items from JSON:</p>
                <input
                    type="file"
                    accept=".json"
                    onChange={CONTROLS.settings.onSavedItemsFileChanged}
                />
            </div>
            {USE_BACKEND && (
                <>
                    <button onClick={CONTROLS.settings.onSaveCurCVClicked}>
                        Save Current CV
                    </button>
                    <button onClick={CONTROLS.settings.onSaveCVInfoClicked}>
                        Save CV Info
                    </button>
                </>
            )}
            {TEST_MODE ? (
                <button onClick={CONTROLS.settings.onSaveTrainExClicked}>
                    Save Train Example
                </button>
            ) : null}
        </div>,
    ];

    if (!cvs.status || !cv_info.status) return null;
    return (
        <Section id="section-cv" heading="Resume Builder">
            {/* ------------ POPUPS ------------ */}
            {[
                exportPopup.PopupComponent,
                savePopup.PopupComponent,
                importPopup.PopupComponent,
                deletePopup.PopupComponent,
                saveTrainExPopup.PopupComponent,
            ]}
            {/* ------------ SETTINGS ------------ */}
            <div>
                <div className="resume-builder-controls">
                    <div
                        className={settingN === 1 ? "selected" : ""}
                        onClick={CONTROLS.settings_ui.onClickFileSettings}
                    >
                        File
                    </div>
                    <div
                        className={settingN === 0 ? "selected" : ""}
                        onClick={CONTROLS.settings_ui.onClickSelectSettings}
                    >
                        Select
                    </div>
                </div>
                {settingN !== null && settings[settingN]}
            </div>
            {/* ------------ DISPLAY THE CURRENT CV's META INFO ------------ */}
            <div id="display-info">
                <div>
                    <span className="descr">Name:</span>{" "}
                    {cvs.cur?.name}
                    {cvs.isModified() && (
                        <span className="is-modified-status">
                            {"(modified)"}
                        </span>
                    )}
                </div>
                <div>
                    <span className="descr">Tags:</span>
                    {cvs.cur?.tags?.join(", ")}
                </div>
                <div className="export-container">
                    <button onClick={CONTROLS.settings.onExportClicked}>
                        Export
                    </button>
                </div>
            </div>
            {/* ------------ CV EDITOR ------------ */}
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        <CVEditor
                            cv={cvs.cur?.data}
                            dispatch={cvs.dispatch}
                            ref={editor_ref}
                        />
                    </PrintablePage>
                    <InfoPad ref={infoPad_ref} info={cv_info.get()} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;
