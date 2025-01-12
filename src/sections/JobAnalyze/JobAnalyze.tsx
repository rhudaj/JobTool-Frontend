import { JobInfo } from "job-tool-shared-types";
import { JIDisplay } from "../../components/JIDisplay/JIDisplay";
import { Section } from "../../components/Section/Section";
import { SplitView } from "../../components/SplitView/splitview";
import { BackendAPI } from "../../backend_api";
import { useLogger } from "../../hooks/logger";
import { useRef, useState } from "react";

function JobAnalyze() {
    const JIRef = useRef(null);
    const [jobText, setJobText] = useState("");
    const [jobInfo, setJobInfo] = useState({} as JobInfo);

    const log = useLogger("JobAnalyze");

    const getJobInfo = () => {
        if (!jobText) {
            log("No job text to extract from.");
            return;
        }

        BackendAPI.post<{ job_text: string }, JobInfo>("getJobInfo", {
            job_text: jobText,
        }).then(
            (jobInfo: JobInfo | null) => jobInfo !== null && setJobInfo(jobInfo)
        );
    };

    return (
        <Section id="section-job-info" heading="Job Info">
            <div id="job-info-controls">
                <button onClick={getJobInfo}>Extract</button>
            </div>
            <SplitView>
                <textarea
                    id="job-info-input"
                    onBlur={(e) => setJobText(e.target.value)}
                    placeholder="Paste job description here..."
                />
                <JIDisplay jobInfo={jobInfo} ref={JIRef} />
            </SplitView>
        </Section>
    );
};

export default JobAnalyze;