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
import SavedCVsUI from "./savedCVs";
import { Button } from '@headlessui/react'
import { ImportForm, SaveForm, FindReplaceForm, StylesForm, SaveFormData } from "./forms";
import { CustomStyles } from "../../styles";

const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === "1";

function ResumeBuilder() {

    // ---------------- STATE ----------------

    const cvsState = useCvsStore();
    const cur_cv = useCvsStore(useShallow(s => s.ncvs[s.curIdx]));
    const curIsModified = useCvsStore(s => s.trackMods[s.curIdx])

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

            onSaveFormSubmit: (formData: SaveFormData) => {
                console.log("onSaveFormSubmit: ", formData);

                // first check that the cv has actually changed!
                if (!curIsModified) {
                    alert("No changes have been made to the CV!");
                    return;
                }
                // if it has, check wether new/update
                const overwrite = formData.name === cur_cv.name;
                saveCv2backend({
                    ...formData,
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

    // --------------------------------------------------------------------------------
    //                                      POPUPS
    // --------------------------------------------------------------------------------

    const exportPopup = usePopup("Export CV")
    const savePopup = usePopup("Save CV")
    const importPopup = usePopup("Import")
    const deletePopup = usePopup("Delete CV")
    const findReplacePopup = usePopup()
    const updateStylesPopup = usePopup("Customize CV Style")

    const popups = {
        export: {
            hook: exportPopup,
            content: (
                <div id="export-popup" className={CustomStyles.popup_content}>
                    <h2>Export As</h2>
                    <button onClick={CONTROLS.popups.onPDFClicked}>PDF</button>
                    <button onClick={CONTROLS.popups.onJsonClicked}>JSON</button>
                </div>
            )
        },
        save: {
            hook: savePopup,
            content: (
                <SaveForm
                    cvInfo={cur_cv}
                    onSave={CONTROLS.popups.onSaveFormSubmit}
                />
            )
        },
        import: {
            hook: importPopup,
            content: (
                <div id="import-popup" className={CustomStyles.popup_content}>
                    <ImportForm cb={CONTROLS.settings.onImportFormComplete}/>
                </div>
            )
        },
        delete: {
            hook: deletePopup,
            content: (
                <div className={CustomStyles.popup_content}>
                    <p>Are you sure you want to delete?</p>
                    <button onClick={CONTROLS.popups.onDeleteCV}>Yes</button>
                </div>
            )
        },
        findReplace: {
            hook: findReplacePopup,
            content: (
                <FindReplaceForm cb={CONTROLS.settings.onFindAndReplace} />
            )
        },
        styles: {
            hook: updateStylesPopup,
            content: (
                <StylesForm/>
            )
        }
    };

    // --------------------------------------------------------------------------------
    //                                      VIEW
    // --------------------------------------------------------------------------------

    if ( !cvsState.status || !cvInfoState.status ) return null;
    return (
        <Section id="section-cv" heading="Resume Builder">

            {/* ------------ VIEW SAVED CVs ------------ */}
            <SubSection id="named-cvs" heading="Resumes">
                { popups.import.hook.getTriggerButton({content: popups.import.content}) }
                <SavedCVsUI />
            </SubSection>
            {/* ------------ CUR CV INFO, SAVE/EXPORT BUTTONS ------------ */}
            <div title="display-info" className="flex justify-between p-4 border-3 ">
                {/* FILE NAME */}
                <div>
                    <span>Name:</span>
                    {cur_cv?.name}
                    {cvsState.trackMods[cvsState.curIdx] && (
                        <span className="text-darkgrey ml-2">{"(modified)"}</span>
                    )}
                </div>
                {/* TAGS */}
                <div>
                    <span className="descr">Tags:</span>
                    {cur_cv?.tags?.join(", ")}
                </div>
                {/* BUTTONS */}
                <div title="cv-buttons" className="max-w-33% flex gap-1 flex-wrap">
                    {Object.values(popups).map(popup =>
                        popup.hook.getTriggerButton({ content: popup.content }, { className:"border-1 p-1 hover:bg-white"})
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
