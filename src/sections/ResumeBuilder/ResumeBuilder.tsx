import "./resumebuilder.sass"
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
                set_active_cv(named_cv)
            })
        } else {
            // USE THE BACKEND SERVER:
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
        }
    }, []);

    useEffect(()=>{
        console.log("new cv data: ", active_cv)
    }, [active_cv])

    const log = useLogger("ResumeBuilder");

    // ---------------- CONTROLS ----------------

    const changeCV = (name: string) => {
        const new_cv = named_cvs.find((cv) => cv.name === name);
        log("Changing active_cv to:", new_cv.name);
        set_active_cv(new_cv);
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

    const saveAsPDF = () => {
        printReactComponentAsPdf("cv-page")
    };

    const saveAsJson = () => {

        // get the modified cv:
        const modified_cv = cvref.current.getCV() as CV;
        const jsonString = JSON.stringify(modified_cv);

        console.log("saving modified_cv: ", modified_cv);

        // Prompt the user to enter a custom filename
        // If the user cancels or doesn't enter anything, use the default filename
        const filename = window.prompt("Enter a filename for your JSON file:", "data.json");

        if (filename) {
            // Create a Blob from the JSON string
            const blob = new Blob([jsonString], { type: 'application/json' });
            // Create a download link and trigger it
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;  // Use the filename entered by the user
            link.click();  // Trigger the download
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; // Get the selected file
        if (!file) return;

        const reader = new FileReader();

        // Read the file as text
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string; // File content as string
                const parsedJson = JSON.parse(content);     // Parse JSON
                console.log("parsed json input = ", parsedJson)
                const named_cv = { name: file.name, data: parsedJson.data }
                set_named_cvs([named_cv, ...named_cvs])   // add it to the list
                set_active_cv(named_cv)                   // Store parsed JSON in state
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                alert("Invalid .json file.")
            }
        };

        reader.readAsText(file); // Trigger file reading
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
                <input type="file" accept=".json" onChange={handleFileChange}/>
            </div>
            <div>
                <p>Save as </p>
                <button onClick={saveAsPDF}>PDF</button>
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
                        {<CVEditor cv={active_cv?.data} ref={cvref} />}
                    </PrintablePage>
                    <InfoPad info={cvInfo} />
                </SplitView>
                </DndProvider>
        </Section>
    );
}

export default ResumeBuilder;