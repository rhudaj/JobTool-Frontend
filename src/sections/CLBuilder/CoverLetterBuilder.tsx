import { useEffect, useState } from "react";
import { BackendAPI } from "../../backend_api";
import  useLogger  from "../../hooks/logger";
import Section from "../../components/Section/Section";
import { DndProvider } from "react-dnd";
import SplitView from "../../components/SplitView/splitview";
import PrintablePage from "../../components/PagePrint/pageprint";
import CLEditor from "../../components/CLEditor/cleditor";
import InfoPad from "../../components/infoPad/infoPad";
import { HTML5Backend } from "react-dnd-html5-backend";
import useComponent2PDF from "../../hooks/component2pdf";

function CLBuilder() {

    // ---------------- MODEL ----------------

    const [CL, setCL] = useState<string[]>(null);
    const [clInfo, setCLInfo] = useState<any>([]);

    const saveAsPDF = useComponent2PDF("cl-page")

    // Load data on mount
    useEffect(() => {
        // Get the cl info
        BackendAPI.get<any>("cl_info").then((cl_info) => {
            if (cl_info) {
                log("Got CL info from backend:");
                setCLInfo(cl_info);
            } else {
                log("No CL info from backend");
            }
        });
    }, []);

    const log = useLogger("CLBuilder")

    // ---------------- CONTROLLER ----------------

    const getCL = (input: string = null) => {
        BackendAPI.post<{ job_info: string }, string[]>("genCL", {
            job_info: input,
        }).then(setCL);
    };

    // ---------------- VIEW ----------------

    return (
        <Section id="section-cl" heading="Cover Letter">
            {/* CONTROLS --------------------------- */}

            <div id="cover-letter-controls">
                <button onClick={() => getCL()}>Get Template</button>
                <button onClick={() => saveAsPDF("cover_letter")}>Download PDF</button>
            </div>

            {/* VIEW ------------------------------- */}

            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cl-page">
                        <CLEditor paragraphs={CL} />
                    </PrintablePage>
                    <InfoPad info={clInfo} />
                </SplitView>
            </DndProvider>
        </Section>
    )
};

export default CLBuilder