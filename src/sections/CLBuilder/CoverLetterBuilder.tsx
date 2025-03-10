import { useEffect, useState } from "react";
import BackendAPI from "../../backend_api";
import Section from "../../components/Section/Section";
import { DndProvider } from "react-dnd";
import SplitView from "../../components/SplitView/splitview";
import PrintablePage from "../../components/PagePrint/pageprint";
import CLEditor from "./CLEditor/cleditor";
import InfoPad from "../../components/infoPad/infoPad";
import { HTML5Backend } from "react-dnd-html5-backend";
import useComponent2PDF from "../../hooks/component2pdf";
import { usePopup } from "../../hooks/Popup/popup";

const JobPopup = (props: {
    onEnter: (result: string[]) => void;
}) => {

    const [jobTxt, setJobTxt] = useState(null);
    const [result, setResult] = useState<string[]>(null);

    const TA_styles: React.CSSProperties = {
        minHeight: "10em",
        width: "100%",
        padding: "5rem",
        fontSize: "16rem",
        fontFamily: "Arial, Helvetica, sans-serif",
        resize: "none",
        outline: "none",
    }

    const onGenerateClicked = () => {
        BackendAPI.request<{ job_info: string }, string[]>({
            method: "POST",
            endpoint: "/AI/genCL",
            body: { job_info: jobTxt }
        })
        .then((data: string[]) => setResult(data))
        .catch(alert)
    };

    const onContinueClicked = () => {
        props.onEnter(result);
    };

    return (
        <div id="job-popup">
            <textarea
                style={TA_styles}
                onBlur={(e) => setJobTxt(e.target.value)}
                placeholder="Enter a Job Description"
            />
            <button disabled={!Boolean(jobTxt)} onClick={onGenerateClicked}>Generate</button>
            <textarea
                disabled={!Boolean(result)}
                style={TA_styles}
                onBlur={(e) => setResult(JSON.parse(e.target.value))}
                placeholder="Result..."
                value={JSON.stringify(result)}
            />
            <button disabled={!Boolean(result)} onClick={onContinueClicked}>Continue</button>
        </div>
    )
};

function CLBuilder(props: {}) {

    // ---------------- MODEL ----------------

    const [paragraphs, setParagraphs] = useState<string[]>([]);
    const jobPopup = usePopup();

    const saveAsPDF = useComponent2PDF("cl-page");

    // ---------------- CONTROLLER ----------------

    const onGenCLEnter = (paragraphs: string[])=> {
        setParagraphs(paragraphs);
        jobPopup.close();
    };

    const onGenerateClicked = () => {
        jobPopup.open(
            <JobPopup onEnter={onGenCLEnter}/>
        );
    };

    // ---------------- VIEW ----------------

    return (
        <Section id="section-cl" heading="Cover Letter">
            {jobPopup.PopupComponent}

            {/* CONTROLS --------------------------- */}

            <div id="cover-letter-controls">
                <button onClick={onGenerateClicked}>Generate</button>
                <button onClick={() => saveAsPDF("cover_letter")}>Download PDF</button>
            </div>

            {/* VIEW ------------------------------- */}

            <DndProvider backend={HTML5Backend}>
                {/* <SplitView> */}
                    <PrintablePage page_id="cl-page">
                        <CLEditor paragraphs={paragraphs}/>
                    </PrintablePage>
                    {/* <InfoPad info={clInfo}/> */}
                {/* </SplitView> */}
            </DndProvider>
        </Section>
    )
};

export default CLBuilder