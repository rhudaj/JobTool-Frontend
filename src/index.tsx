import "./index.sass";
import ReactDOM from "react-dom/client";
import ResumeBuilder from "./sections/ResumeBuilder/ResumeBuilder";
import CLBuilder from "./sections/CLBuilder/CoverLetterBuilder";
import JobAnalyze from "./sections/JobAnalyze/JobAnalyze";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'

const tabs = [
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

function App() {
    return (
        <div className="app-root-container">
            <div id="app-header">
                <h1>Job Tool</h1>
            </div>
            <TabGroup id="app-content">
                <TabList id="side-menu" style={{width: "min-content"}}>
                    {tabs.map(tab =>
                        <Tab className="menu-item" as="div" key={tab.name}>{tab.name}</Tab>
                    )}
                </TabList>
                <TabPanels id="section-container">
                    {tabs.map(tab =>
                        <TabPanel>{tab.content}</TabPanel>
                    )}
                </TabPanels>
            </TabGroup>
        </div>
    );
}

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <App />
);
