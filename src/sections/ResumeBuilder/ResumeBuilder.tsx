import { useEffect, useState, useRef } from "react";
import { Section } from "../../components/Section/Section";
import { CV } from "job-tool-shared-types";
import { BackendAPI } from "../../backend_api";
import { PrintablePage } from "../../components/PagePrint/pageprint";
import { printReactComponentAsPdf } from "../../hooks/component2pdf";
import { InfoPad } from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useLogger } from "../../hooks/logger";
import { SplitView } from "../../components/SplitView/splitview";
import { CVEditor } from "../../components/CVEditor/template2/cveditor2";

function ResumeBuilder() {

    // ---------------- STATE ----------------

    const cvref = useRef(null);
    const [named_cvs, set_named_cvs] = useState<{ name: string; data: CV }[]>(null);
    const [active_cv, set_active_cv] = useState<{ name: string; data: CV }>(null);
    const [cvInfo, setCVInfo] = useState<any>([]);

    // Get data on mount
    useEffect(() => {
        // Get all saved CVs
        BackendAPI.get<{ name: string; data: CV }[]>("all_cvs") // getCVs getCVinfo getCLinfo
            .then((cvs) => {
                if (cvs && cvs.length > 0) {
                    log(`Got ${cvs.length} CVs from backend`);
                    set_named_cvs(cvs);
                    set_active_cv(cvs[0]); // set the first CV as the default
                }
            });
        // Get the cv info
        BackendAPI.get<any>("cv_info").then((cv_info) => {
            if (cv_info) {
                log("Got CV info from backend");
                setCVInfo(cv_info);
            } else {
                log("No CV Info received from backend");
            }
        });
    }, []);

    const log = useLogger("ResumeBuilder");

    // ---------------- CONTROLS ----------------

    const changeCV = (name: string) => {
        const new_cv = named_cvs.find((cv) => cv.name === name);
        log("Changing active_cv to:", new_cv.name);
        set_active_cv(new_cv);
    };

    const saveCV = () => {
        // Get non-empty user input for CV name
        let cvName: string | null = null;

        while (true) {
            cvName = prompt("Name the CV")?.trim();
            // 3 cases
            if (cvName === null) {
                // they clicked cancel
                break;
            } else if (cvName === "") {
                // they clicked ok but didn't enter anything
                cvName = null;
                alert("Input cannot be left blank.");
            } else if (named_cvs.find((cv) => cv.name === cvName)) {
                // alert("CV with that name already exists.");
                const isConfirmed = window.confirm(
                    "CV with that name already exists. Are you okay with it?"
                );
                if (isConfirmed) {
                    // User clicked "OK"
                    console.log("User is okay with it.");
                    break;
                } else {
                    // User clicked "Cancel"
                    console.log("User is not okay with it.");
                    cvName = null;
                }
            } else {
                // they entered a VALID name
                break;
            }
        }

        if (!cvName) {
            // Can't save a CV without a valid name
            log("User cancelled the prompt.");
            return;
        } else {
            log(`User entered CV name: ${cvName}`);
        }
        // get CV from the cvref:
        const newCV = cvref.current.getCV();
        // Save the named CV to the backend
        BackendAPI.post<{ name: string; cv: CV }, null>("saveCV", {
            name: cvName,
            cv: newCV,
        });
    };

    // ---------------- RENDER ----------------

    const Controls = () => (
        <div id="resume-builder-controls">
            <div>
                <p>Import</p>
                <select onChange={(e) => changeCV(e.target.value)}>
                    {named_cvs?.map((cv, i) => (
                        <option key={i} value={cv.name}>
                            {cv.name}
                        </option>
                    ))}
                </select>
                <button className="import-button">Import</button>
            </div>
            <div>
                <p>Export</p>
                <button
                    className="download-button"
                    onClick={() => printReactComponentAsPdf("cv-page")}
                >
                    {" "}
                    Download PDF{" "}
                </button>
                <button onClick={saveCV}> Save CV </button>
            </div>
        </div>
    );

    return (
        <Section id="section-cv" heading="Resume Builder">
            <Controls/>
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        {<CVEditor cv={active_cv?.data} ref={cvref} />}
                    </PrintablePage>
                    <InfoPad info={cvInfo} />
                </SplitView>
                </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;