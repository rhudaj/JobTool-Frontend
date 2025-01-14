import "./resumebuilder.sass"
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { CV } from "job-tool-shared-types";
import BackendAPI from "../../backend_api";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import  useLogger  from "../../hooks/logger";
import SplitView from "../../components/SplitView/splitview";
import CVEditor from "../../components/CVEditor/cveditor";

function ResumeBuilder() {

    const log = useLogger("ResumeBuilder");

    // ---------------- STATE ----------------

    const cvref = useRef(null);
    const [named_cvs, set_named_cvs] = useState<{ name: string; data: CV }[]>(null);
    const [cur, set_cur] = useState<number>(null);
    const [cvInfo, setCVInfo] = useState<any>([]);

    const saveAsPDF = useComponent2PDF("cv-page")

    // Get data on mount
    useEffect(() => {
        console.log("process.env.USE_BACKEND = ", process.env.REACT_APP_USE_BACKEND)
        if(process.env.REACT_APP_USE_BACKEND === "0") {
            // USE A SAMPLE:
            console.log("Using sample cv")
            fetch(process.env.PUBLIC_URL + "/samples/sample_cv.json")
            .then(response => {
                return response.json()
            })
            .then(data => {
                const named_cv = {name: "sample_cv", data: data}
                set_named_cvs([named_cv])
                set_cur(0)
            })
        } else {
            // USE THE BACKEND SERVER:
            // Get all saved CVs
            BackendAPI.get<{ name: string; data: CV }[]>("all_cvs") // getCVs getCVinfo getCLinfo
            .then((cvs) => {
                if (cvs && cvs.length > 0) {
                    log(`Got ${cvs.length} CVs from backend`);
                    set_named_cvs(cvs);
                    set_cur(0);             // use the first one by default
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
        }
    }, []);

    // ---------------- CONTROLS ----------------

    const changeCV = (name: string) => {
        const idx = named_cvs.findIndex(cv => cv.name === name);
        log("Changing active_cv to:", named_cvs[idx].name);
        set_cur(idx);
    };

    /** save the resume as json to the Downloads folder */
    const saveAsJson = () => {

        // get the modified cv:
        const jsonString = JSON.stringify(
            cvref.current.getCV()
        );

        // Prompt the user to enter a custom filename
        const filename = window.prompt("Enter a filename for your JSON file:", "my_resume");
        if(!filename) return;

        // Create a Blob (file-like object) from the JSON string:
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;  // Use the filename entered by the user
        link.click();  // Trigger the download
    };

    const handleJsonInport = (event: React.ChangeEvent<HTMLInputElement>) => {

        const file = event.target.files?.[0]; // Get the selected file
        if (!file) return;

        const name = file.name.split(".json")[0]

        const reader = new FileReader();

        // Read the file as text
        reader.onload = (e) => {
            try {
                const json_str = e.target?.result as string; // File content as string
                const named_cv = { name: name, data: JSON.parse(json_str) }
                set_named_cvs([named_cv, ...named_cvs])   // add it to the list
                set_cur(0)                   // Store parsed JSON in state
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                alert("Invalid .json file")
            }
        };

        reader.readAsText(file); // Trigger file reading
    };

    // ---------------- RENDER ----------------

    const Controls = () => (
        <div id="resume-builder-controls">
            <div>
                <h4>Import</h4>

                <div style={{display: "flex", gap: "10rem"}}>
                    <p>Import Resume:</p>
                    <input type="file" accept=".json" onChange={handleJsonInport}/>
                </div>

                <div style={{display: "flex", gap: "10rem"}}>
                    <p>Selected Resume:</p>
                    <select onChange={(e) => changeCV(e.target.value)}>
                        {named_cvs?.map((cv, i) => (
                            <option key={i} value={cv.name} selected={i===cur}>
                                {cv.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <h4>Export</h4>
                <button onClick={()=>saveAsPDF(named_cvs[cur].name)}>PDF</button>
                <button onClick={saveAsJson}>JSON</button>
            </div>
        </div>
    );

    return (
        <Section id="section-cv" heading="Resume Builder">
            <Controls/>
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        {named_cvs && <CVEditor cv={named_cvs[cur]?.data} ref={cvref} />}
                    </PrintablePage>
                    <InfoPad info={cvInfo} />
                </SplitView>
                </DndProvider>
        </Section>
    );
}

/*

    const save2backend = () => {

        const name = promptFileName();

        // get CV from the cvref:
        const newCV = cvref.current.getCV();

        // Save the named CV to the backend
        BackendAPI.post<{ name: string; cv: CV }, null>("saveCV", {
            name: name,
            cv: newCV,
        });
    };

    const promptFileName = (): string|null => {
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
            } else if (named_cvs?.find((cv) => cv.name === cvName)) {

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
        } else {
            log(`User entered CV name: ${cvName}`);
        }

        return cvName;
    };
*/

export default ResumeBuilder;