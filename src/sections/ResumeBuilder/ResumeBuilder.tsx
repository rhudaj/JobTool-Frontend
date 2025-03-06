import { useEffect } from "react";
import { NamedCV } from "job-tool-shared-types";
import { useComponent2PDF } from "../../hooks";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CVEditor from "./CVEditor/cveditor";
import * as util from "../../util/fileInOut";

import { Section, SubSection, SplitView, InfoPad, PrintablePage } from "../../components"

import { usePopup } from "../../hooks/popup";
import { useCvsStore, save2backend as saveCv2backend } from "./useCVs";
import { useCvInfoStore } from "./useCVInfo";
import { useShallow } from 'zustand/react/shallow'
import SavedCVsUI from "./savedCVs/savedCVs";
import { Button } from '@headlessui/react'
import { ImportForm, SaveForm, FindReplaceForm, StylesForm } from "./Forms/forms";
import { CustomStyles } from "../../styles";

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === "1";

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
                console.log(`onImportFormComplete: ncv = `, ncv)
                cvsState.add(ncv);
                importPopup.close();
            },

            onFindAndReplace: ({find, replace}) => {
                console.log(`find: ${find}, replace: ${replace}`)
                try {
                    cvsState.update(
                        JSON.parse(
                            JSON.stringify(cur_cv.data)
                            .replaceAll(find, replace)
                        )
                    );
                } catch(err: unknown) {
                    alert(`Invalid find/replace strings: ${err}`);
                }
                findReplacePopup.close();
            }
        }
    };

    // ref's to popups
    const exportPopup = usePopup("Export CV")
    const savePopup = usePopup("Save CV")
    const importPopup = usePopup("Import")
    const deletePopup = usePopup("Delete CV")
    const findReplacePopup = usePopup()
    const updateStylesPopup = usePopup("Customize CV Style")

    const POPUP_CONTENT = {
        export: (
            <div id="export-popup" className={CustomStyles.popup_content}>
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
            <div id="import-popup" className={CustomStyles.popup_content}>
                <ImportForm cb={CONTROLS.settings.onImportFormComplete}/>
            </div>
        ),
        delete: (
            <div className={CustomStyles.popup_content}>
                <p>Are you sure you want to delete?</p>
                <button onClick={CONTROLS.popups.onDeleteCV}>Yes</button>
            </div>
        ),
        findReplace: (
            <FindReplaceForm cb={CONTROLS.settings.onFindAndReplace} />
        ),
        styles: (
            <StylesForm/>
        )
    }

    // ---------------- VIEW ----------------

    if ( !cvsState.status || !cvInfoState.status ) return null;
    return (
        <Section id="section-cv" heading="Resume Builder">

            {/* ------------ POPUPS ------------ */}
            {[
                exportPopup.component,
                savePopup.component,
                importPopup.component,
                deletePopup.component,
                findReplacePopup.component,
                updateStylesPopup.component,
            ]}
            {/* ------------ VIEW SAVED CVs ------------ */}
            <SubSection id="named-cvs" heading="Resumes">
                <Button onClick={()=>importPopup.open(POPUP_CONTENT.import)} style={{width: "min-content"}}>New</Button>
                <SavedCVsUI />
            </SubSection>
            {/* ------------ CUR CV INFO, SAVE/EXPORT BUTTONS ------------ */}
            <div id="display-info" className="flex justify-between p-4 border-3 ">
                <div>
                    <span className="text-white">Name:</span>{" "}
                    {cur_cv?.name}
                    {cvsState.trackMods[cvsState.curIdx] && (
                        <span className="text-darkgrey ml-2">{"(modified)"}</span>
                    )}
                </div>
                <div>
                    <span className="descr">Tags:</span>
                    {cur_cv?.tags?.join(", ")}
                </div>
                <div className="export-container">
                    <button onClick={()=>exportPopup.open(POPUP_CONTENT.export)}>Export</button>
                    <button onClick={()=>deletePopup.open(POPUP_CONTENT.delete)}>Delete</button>
                    <button onClick={()=>findReplacePopup.open(POPUP_CONTENT.findReplace)}>Find/Replace</button>
                    <button onClick={()=>updateStylesPopup.open(POPUP_CONTENT.styles)}>Styles</button>
                    {USE_BACKEND && (
                        <>
                            <button onClick={()=>savePopup.open(POPUP_CONTENT.save)}>
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
