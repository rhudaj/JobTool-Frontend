import "./resumebuilder.sass"
import { useEffect, useState, useRef } from "react";
import Section from "../../components/Section/Section";
import { CV, NamedCV } from "job-tool-shared-types";
import BackendAPI from "../../backend_api";
import PrintablePage from "../../components/PagePrint/pageprint";
import useComponent2PDF from "../../hooks/component2pdf";
import InfoPad from "../../components/infoPad/infoPad";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import  useLogger  from "../../hooks/logger";
import SplitView from "../../components/SplitView/splitview";
import CVEditor from "./CVEditor/cveditor";
import * as util from "../../util/fileInOut";
import { joinClassNames } from "../../util/joinClassNames";
import SubSection from "../../components/Section/SubSection";

const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "1";
const SAMPLES_PATH = process.env.PUBLIC_URL + "/samples/"

/* ------------------------------------------------------------------
 *                       CV STATE MANAGER                           *
------------------------------------------------------------------- */

// Manages any state/controls relating to the CV builder
function useCVManager() {

    // ---------------- STATE (internal) ----------------

    const [named_cvs, set_named_cvs] = useState<{ name: string; data: CV }[]>(null);
    const [cvInfo, setCVInfo] = useState<any>([]);
    const [cur, set_cur] = useState<number>(null);

    useEffect(()=>{
        if(!USE_BACKEND) {
            const samps = [
                "sample_resume1.json",
                "sample_resume2.json",
                "sample_resume3.json"
            ];
            const temp = [];
            samps.forEach(name=>{
                fetch(`${SAMPLES_PATH}/CVs/${name}`)
                .then(r => r.json())
                .then(data => temp.push({name, data}))
            })
            set_named_cvs(temp);

            // CV-INFO:
            fetch(SAMPLES_PATH + "cv_info.json")
            .then(r => r.json())
            .then(setCVInfo)
        }
        // USE SAVED FILES FROM BACKEND:
        else {
            // NAMED CVS:
            BackendAPI.get<NamedCV[]>("all_cvs") // getCVs getCVinfo getCLinfo
            .then(cvs => {
                if (!cvs) return;
                // filter any corrupt data (TODO: this should not be necessary)
                cvs = cvs.filter(cv => cv && cv.name && cv.data)
                set_named_cvs(cvs);
            });
            // CV-INFO:
            BackendAPI.get<any>("cv_info").then(setCVInfo);
        }
    }, [])

    useEffect(()=>{
        if(!named_cvs || named_cvs.length === 0) return;
        log(`Got ${named_cvs.length} CVs from backend`);
        set_cur(0)
    }, [named_cvs])

    const log = useLogger("ResumeBuilder");

    // ---------------- CONTROLS (what user sees) ----------------

    // CONTROLS:

    // setters

    const changeCV = (name: string) => {
        const idx = named_cvs.findIndex(cv => cv.name === name);
        log("Changing active_cv to:", named_cvs[idx].name);
        set_cur(idx);
    };

    const save2backend = (cv: CV) => {
        const name = util.promptFileName(cvNames());
        BackendAPI.post<{ name: string; cv: CV }, null>("saveCV", {
            name: name,
            cv: cv,
        });
    };

    const importFromJson = (named_cv: NamedCV)=>{
        set_named_cvs([named_cv, ...named_cvs])
    };

    // GETTERS:

    const curIdx = () => cur;

    const cvNames = () => named_cvs?.map(ncv=>ncv.name);

    const curName = () => named_cvs[cur].name;

    const curData = () => named_cvs[cur]?.data;

    const getCVInfo = () => cvInfo;

    return { curIdx, cvNames, curName, getCVInfo, curData, setCVInfo, importFromJson, changeCV, save2backend };
};

/* ------------------------------------------------------------------
 *                         SUB COMPONENTS                           *
------------------------------------------------------------------- */

function SavedCVs(props: {
    cvNames: string[],
    curIdx: number,
    onChange: (name: string) => void,
    onAdd?: ()=>void;
}) {

    const curName = props.cvNames ? props.cvNames[props.curIdx] : "";

    const CVThumnail = (name: string) => (
        <div className={joinClassNames("cv-thumbnail", name===curName?"active":"")} onClick={e => props.onChange(name)}>
            {name}
        </div>
    );

    return (
        <SubSection id="ss-named-cvs" heading="My Resumes">
            <div className="cv-thumnail-container">
                {props.cvNames?.map(CVThumnail)}
            </div>
        </SubSection>
    )
};

/* ------------------------------------------------------------------
 *                         ROOT COMPONENT                           *
------------------------------------------------------------------- */
function ResumeBuilder() {

    // ---------------- STATE ----------------

    const state = useCVManager();
    const editor_ref = useRef(null);
    const saveAsPDF = useComponent2PDF("cv-page")

    const [log, warn, error] = useLogger("ResumeBuilder");

    // ---------------- CONTROLS ----------------

    // ---------------- RENDER ----------------

    const Controls = () => (
        <div id="resume-builder-controls">
            <SavedCVs cvNames={state.cvNames()} curIdx={state.curIdx()} onChange={state.changeCV}/>
            <SubSection heading="Import">
                <div style={{display: "flex", gap: "10rem"}}>
                    <p>New Resume from JSON:</p>
                    <input type="file" accept=".json" onChange={e=>util.jsonFileImport(e, state.importFromJson)}/>
                </div>
                <div style={{display: "flex", gap: "10rem"}}>
                    <p>New Saved Items from JSON:</p>
                    <input type="file" accept=".json" onChange={ev => util.jsonFileImport(ev, ({name, data})=>state.setCVInfo(data))}/>
                </div>
            </SubSection>
            <SubSection heading="Export" id="ss-export">
                <button onClick={()=>saveAsPDF(state.curName())}>PDF</button>
                <button onClick={()=>util.downloadAsJson(editor_ref.current.getCV())}>JSON</button>
                {USE_BACKEND && <button onClick={()=>state.save2backend(editor_ref.current.getCV())}>Save to Backend</button>}
            </SubSection>
        </div>
    );

    return (
        <Section id="section-cv" heading="Resume Builder">
            <Controls/>
            <DndProvider backend={HTML5Backend}>
                <SplitView>
                    <PrintablePage page_id="cv-page">
                        {state.cvNames() && <CVEditor cv={state.curData()} ref={editor_ref} />}
                    </PrintablePage>
                    <InfoPad info={state.getCVInfo()} />
                </SplitView>
            </DndProvider>
        </Section>
    );
}


export default ResumeBuilder;