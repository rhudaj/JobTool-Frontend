import "./index.sass";
import ReactDOM from "react-dom/client";
import * as Sections from "./sections";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'

const tabs = [
    {
        name: "Resume Builder",
        content: <Sections.ResumeBuilder/>,
    },
    // {
    //     name: "Letter",
    //     content: <Sections.CLBuilder/>,
    // },
    {
        name: "Job Analyze",
        content: <Sections.JobAnalyze/>
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

ReactDOM.createRoot(document.getElementById("root")).render(
    <App />
);
