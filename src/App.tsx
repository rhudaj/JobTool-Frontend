import "./App.sass";
import { useState } from "react";
import  useLogger  from "./hooks/logger";
import ResumeBuilder from "./sections/ResumeBuilder/ResumeBuilder";
import CLBuilder from "./sections/CLBuilder/CoverLetterBuilder";
import JobAnalyze from "./sections/JobAnalyze/JobAnalyze";

function SideMenu(props: {
    labels: string[];
    onSelect: (val: string) => void;
}) {

    const [selected, setSelected] = useState<string>(null)

    const MenuItem = (p: {text: string}) => {
        return (
            <div className={`menu-item ${p.text==selected ? "active": ""}`} onClick={() => {
                setSelected(p.text)
                props.onSelect(p.text)
            }}>
                <p>{p.text}</p>
            </div>
        );
    };

    return <div id="side-menu">{props.labels.map((l,i)=><MenuItem key={i} text={l}/>)}</div>;
}

function TopMenu(props: {}) {
    return (
        <div id="app-header">
            <h1>Job Tool</h1>
        </div>
    )
};

function App() {

    // --------------- STATE ---------------

    const [sec, setSec] = useState<string>(null);

    const log = useLogger("App");

    // RENDERING:

    const labeled_sections = [
        {
            name: "Resume Builder",
            content: <ResumeBuilder/>,
        },
        {
            name: "Letter",
            content: <CLBuilder/>,
        },
        {
            name: "Job Analyze",
            content: <JobAnalyze/>
        },
    ];

    return (
        <div className="app-root-container">
            <TopMenu/>
            <div id="app-content">
                <SideMenu
                    labels={labeled_sections.map(ls => ls.name)}
                    onSelect={setSec}
                />
                <div id="section-container">
                    {labeled_sections.find((ls) => ls.name === sec)?.content}
                </div>
            </div>
        </div>
    );
}

export default App;
