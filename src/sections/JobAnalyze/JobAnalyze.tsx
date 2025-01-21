import "./jobanalyze.sass"
import { JobInfo } from "job-tool-shared-types";
import JIDisplay from "./JIDisplay/JIDisplay";
import Section from "../../components/Section/Section";
import SplitView from "../../components/SplitView/splitview";
import BackendAPI from "../../backend_api";
import { useEffect, useRef, useState } from "react";

function JobAnalyze() {

    const JIRef = useRef(null);
    const [initJobText, setInitJobText] = useState("");
    const [jobText, setJobText] = useState("");

    const saveAnnotation = () => {
        BackendAPI.post<{ job_text: string, annotations: any[] }, null>("save_annotation", {
            job_text: initJobText,
            annotations: JIRef.current.get(),
        })
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