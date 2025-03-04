import "./resumebuilder.sass";
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { NamedCV } from "job-tool-shared-types";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import SplitView from "../../components/SplitView/splitview";
import CVEditor from "./CVEditor/cveditor";
import * as util from "../../util/fileInOut";
import SubSection from "../../components/Section/SubSection";
import TextEditDiv from "../../components/TextEditDiv/texteditdiv";
import TextItems from "../../components/TextItems/TextItems";
import { PopupExample, usePopup } from "../../hooks/popup";
import { useImmer } from "use-immer";
import { useCvsStore, save2backend as saveCv2backend } from "./useCVs";
import { useCvInfoStore } from "./useCVInfo";
import { useShallow } from 'zustand/react/shallow'
import SavedCVsUI from "./savedCVs/savedCVs";
import { StyleManager } from "./CVEditor/styles";

import { Button } from '@headlessui/react'

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

const FindReplaceForm = (props: { cb: (find: string, replace: string) => void }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const find = (form.elements.namedItem("find") as HTMLInputElement).value;
        const replace = (form.elements.namedItem("replace") as HTMLInputElement).value;
        props.cb(find, replace);
    };

    return (
        <form className="popup-content" id="find-replace" onSubmit={handleSubmit}>
            <p>Find and Replace</p>
            <input type="text" name="find" placeholder="find" />
            <input type="text" name="replace" placeholder="replace" />
            <button type="submit">Go</button>
        </form>
    );
};

const StylesForm = () => {

    const handleUpdate = (key: string, val: number) => {
        console.log(`(Styles) Updating ${key} to ${val}`);
        StyleManager.set(key as any, val);
    };

    return (
        <form className="popup-content" id="styles-form">
            {
                Object.entries(StyleManager.getAll()).map(([key, val]) => (
                    <div key={key}>
                        <p>{key}</p>
                        <input
                            type="number"
                            defaultValue={StyleManager.styles[key]}
                            onBlur={(e) => handleUpdate(key, Number(e.target.value))}
                        />
                    </div>
                ))
            }
        </form>
    )
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

// ------------------------------------------------------------------
//                         ROOT COMPONENT
// ------------------------------------------------------------------

function ResumeBuilder() {

    // ---------------- STATE ----------------

    const cvsState = useCvsStore();
    const cur_cv = useCvsStore(useShallow(s => s.ncvs[s.curIdx]));

    const cvInfoState = useCvInfoStore();

    // Fetch data on mount
    useEffect(() => {
        cvsState.fetch();
        cvInfoState.fetch();
    }, []);

    const saveAsPDF = useComponent2PDF("cv-page");

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
                // first check that the cv has actually changed!
                if (!cvsState.trackMods[cvsState.curIdx]) {
                    alert("No changes have been made to the CV!");
                    return;
                }
                // if it has, check wether new/update
                const overwrite = name === cur_cv.name;
                saveCv2backend({
                    name: name,
                    tags: tags,
                    data: cur_cv.data,
                }, overwrite)
                savePopup.close();
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

            onImportFormComplete: (ncv: NamedCV) => {
                cvsState.add(ncv);
                importPopup.close();
            },

            onFindAndReplace: (find: string, replace: string) => {
                try {
                    cvsState.update(
                        JSON.parse(
                            JSON.stringify(cur_cv.data)
                            .replaceAll(find, replace)
                        )
                    );
                } catch(err: unknown) {
                    alert("Invalid find/replace strings");
                }
                findReplacePopup.close();
            }
        }
    };

    // ref's to popups
    const exportPopup = usePopup("Export CV",
        <div className="popup-content export-popup">
            <h2>Export As</h2>
            <button onClick={CONTROLS.popups.onPDFClicked}>PDF</button>
            <button onClick={CONTROLS.popups.onJsonClicked}>JSON</button>
        </div>
    )

    const savePopup = usePopup("Save CV",
        <SaveForm
            name={cur_cv?.name}
            tags={cur_cv?.tags}
            onSave={CONTROLS.popups.onSaveFormSubmit}
        />
    )

    const importPopup = usePopup("Import",
        <div className="popup-content" id="import-popup">
            <ImportForm
                onComplete={CONTROLS.settings.onImportFormComplete}
            />
        </div>
    )

    const deletePopup = usePopup("Delete CV",
        <div className="popup-content">
            <p>Are you sure you want to delete?</p>
            <button onClick={CONTROLS.popups.onDeleteCV}>Yes</button>
        </div>
    )

    const findReplacePopup = usePopup("Find/Replace",
        <FindReplaceForm cb={CONTROLS.settings.onFindAndReplace} />
    )

    const updateStylesPopup = usePopup("Customize CV Style", <StylesForm/>)

    // ---------------- VIEW ----------------

    if ( !cvsState.status || !cvInfoState.status ) return null;
    return (
        <Section id="section-cv" heading="Resume Builder">

            {/* ------------ POPUPS ------------ */}
            {[
                exportPopup.PopupComponent,
                savePopup.PopupComponent,
                importPopup.PopupComponent,
                deletePopup.PopupComponent,
                findReplacePopup.PopupComponent,
                updateStylesPopup.PopupComponent,
            ]}
            {/* ------------ VIEW SAVED CVs ------------ */}
            <SubSection id="ss-named-cvs" heading="My Resumes">
                <SavedCVsUI />
                <Button onClick={importPopup.open} style={{width: "min-content"}}>New</Button>
            </SubSection>
            {/* ------------ CUR CV INFO, SAVE/EXPORT BUTTONS ------------ */}
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
                    <button onClick={exportPopup.open}>Export</button>
                    <button onClick={deletePopup.open}>Delete</button>
                    <button onClick={findReplacePopup.open}>Find/Replace</button>
                    <button onClick={updateStylesPopup.open}>Styles</button>
                    {USE_BACKEND && (
                        <>
                            <button onClick={savePopup.open}>
                                Save
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* ------------ CV EDITOR ------------ */}
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        <CVEditor cv={cur_cv.data} onUpdate={cvsState.update} />
                    </PrintablePage>
                    <InfoPad info={cvInfoState.cv_info} onUpdate={cvInfoState.set} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;
