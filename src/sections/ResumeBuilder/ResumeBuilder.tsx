import "./resumebuilder.sass";
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { NamedCV } from "job-tool-shared-types";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad, { CVInfo, InfoPadHandle } from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import SplitView from "../../components/SplitView/splitview";
import CVEditor from "./CVEditor/cveditor";
import * as util from "../../util/fileInOut";
import { joinClassNames } from "../../util/joinClassNames";
import SubSection from "../../components/Section/SubSection";
import TextEditDiv from "../../components/TextEditDiv/texteditdiv";
import TextItems from "../../components/TextItems/TextItems";
import { usePopup } from "../../hooks/Popup/popup";
import { useImmer } from "use-immer";
import { useCvsStore } from "./useCVs";
import { useCVInfo } from "./useCVInfo";
import { useShallow } from 'zustand/react/shallow'

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";

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

/**
 * Displays the list of saved CVs.
 * And allows the user to select one (change state.curIdx)
 */
function SavedCVsUI() {

    const cvsState = useCvsStore();
    const cvNames = useCvsStore(useShallow(state => state.ncvs.map(cv => cv.name)));
        // useShallow => cvNames updates ONLY when output of the selector does
    const curName = cvNames ? cvNames[cvsState.curIdx] : "";

    const onThumbnailClick = (idx: number) => {
        // only update if different
        if (idx === cvsState.curIdx) return;
        cvsState.setCur(idx);
    }

    return (
        <div className="cv-thumnail-container">
            {cvNames?.map((name: string, i: number) => (
                <div
                    key={name}
                    className={joinClassNames(
                        "cv-thumbnail",
                        name === curName ? "active" : "",
                        cvsState.trackMods[i] ? "is-modified" : ""
                    )}
                    onClick={()=>onThumbnailClick(i)}
                >
                    {name}
                </div>
            ))}
        </div>
    );
}

// ------------------------------------------------------------------
//                         ROOT COMPONENT
// ------------------------------------------------------------------

function ResumeBuilder() {

    // ---------------- STATE ----------------

    const cvsState = useCvsStore();
    const cur_cv = useCvsStore(useShallow(s => s.ncvs[s.curIdx]));

    useEffect(() => {
        console.log(`ResumeBuilder: current CV changed: ${cur_cv?.name}`);
    }, [cur_cv])

    const cv_info = useCVInfo();

    // Fetch data on mount
    useEffect(() => {
        cvsState.fetch();
        cv_info.fetch();
    }, []);

    const infoPad_ref = useRef<InfoPadHandle>(null);

    const [settingN, setSettingN] = useState(null); // null => none, 0 => SavedCVs, 1 => file settings
    const saveAsPDF = useComponent2PDF("cv-page");

    // ref's to popups
    const exportPopup = usePopup();
    const savePopup = usePopup();
    const importPopup = usePopup();
    const deletePopup = usePopup();
    const saveTrainExPopup = usePopup();

    // ---------------- CONTROLS ----------------

    const CONTROLS = {
        popups: {
            onPDFClicked: () => {
                saveAsPDF(cur_cv?.name);
                exportPopup.close();
            },
            onJsonClicked: () => {
                if (cur_cv) util.downloadAsJson(cur_cv);
                exportPopup.close();
            },
            onSaveFormSubmit: (name: string, tags: string[]) => {
                // TODO: fix/figure out since cur_cv is based on cvs
                // first check that the cv has actually changed!
                // if (isEqual(edited_cv, cvs.cur.data)) {
                //     alert("No changes have been made to the CV!");
                //     return;
                // }
                // cvs.save(
                //     {
                //         name: name,
                //         tags: tags,
                //         data: edited_cv,
                //     },
                //     (name === cvs.cur.name)
                // );
                // savePopup.close();
            },
            onImportJsonFileChange: (
                e: React.ChangeEvent<HTMLInputElement>
            ) => {
                util.jsonFileImport(e, cvsState.add);
                importPopup.close();
            },
            onPasteJson: (json_str: string, name: string) => {
                const cv = JSON.parse(json_str);
                cvsState.add(cv);
            },
            onDeleteCV: () => {
                cvsState.delCur(); // NOTE: only deletes locally
                deletePopup.close();
            }
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
                cv_info.save(new_cv_info);
            },
            onImportFormComplete: (ncv: NamedCV) => {
                cvsState.add(ncv);
                importPopup.close();
            }
        },
        settings_ui: {
            onClickFileSettings: () => {
                setSettingN((prev) => (prev === 1 ? null : 1));
            },
            onClickSelectSettings: () => {
                setSettingN((prev) => (prev === 0 ? null : 0));
            },
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
                name={cur_cv?.name}
                tags={cur_cv?.tags}
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
        )
    };

    const settings = [
        // FILE:
        (
            <SubSection id="ss-named-cvs" heading="My Resumes">
                <div id="named-cvs-controls">
                    <div onClick={CONTROLS.settings.onPlusClicked}>+</div>
                    <div onClick={CONTROLS.settings.onMinusClicked}>-</div>
                </div>
                <SavedCVsUI />
            </SubSection>
        ),
        // File CONTROLS:
        (
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
            </div>
        ),
    ];

    if ( !cvsState.status || !cv_info.status ) return null;
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
                    {cur_cv?.name}
                    {cvsState.trackMods[cvsState.curIdx] && (
                        <span className="is-modified-status">
                            {"(modified)"}
                        </span>
                    )}
                </div>
                <div>
                    <span className="descr">Tags:</span>
                    {cur_cv?.tags?.join(", ")}
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
                        {cur_cv.data && <CVEditor cv={cur_cv.data} onUpdate={cvsState.update} /> }
                    </PrintablePage>
                    <InfoPad ref={infoPad_ref} info={cv_info.get} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;
