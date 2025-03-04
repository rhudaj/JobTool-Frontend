import "./jobanalyze.sass"
import { NamedCV } from "job-tool-shared-types";
import JIDisplay from "./JIDisplay/JIDisplay";
import { Section, SplitView }  from "../../components";
import BackendAPI from "../../backend_api";
import { useEffect, useRef, useState } from "react";

function JobAnalyze() {

    const JIRef = useRef(null);
    const [initJobText, setInitJobText] = useState<string>("");
    const [jobText, setJobText] = useState<string>("");

    const saveAnnotation = () => {
        BackendAPI.request<{ job_text: string, ncv?: NamedCV, annotations?: any[] }>({
            method: "POST",
            endpoint: "annotations",
            body: {
                job_text: initJobText,
                annotations: JIRef.current.get(),
            }
        })
        .then(() => alert("Success!"))
        .catch(alert)

    };

    useEffect(()=>{
        console.log("initJobText: ", initJobText);
    }, [initJobText])

    return (
        <Section id="section-job-info" heading="Job Info">
            <div id="job-info-controls">
                <button disabled={true}>Extract</button>
                <button onClick={saveAnnotation}>Save Annotation</button>
            </div>
            <SplitView>
                <textarea
                    id="job-info-input"
                    onPaste={(e)=> setInitJobText(e.clipboardData.getData("text/plain"))}
                    onBlur={(e) => setJobText(e.target.value)}
                    placeholder="Paste Job Description Here..."
                />
                <JIDisplay ref={JIRef} />
            </SplitView>
            </Section>
    );
};


export default JobAnalyze;