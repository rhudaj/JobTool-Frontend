import "./index.css";
import ReactDOM from "react-dom/client";
import * as Sections from "./sections";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

const tabs = [
    {
        name: "Resume Builder",
        content: <Sections.ResumeBuilder />,
    },
    // {
    //     name: "Letter",
    //     content: <Sections.CLBuilder/>,
    // },
    {
        name: "Job Analyze",
        content: <Sections.JobAnalyze />,
    },
];

/*

/* .app-root-container {
    width: 100vw;
    height: 100vh;

    overflow-x: hidden;
    overflow-y: hidden;

    display: flex;
    flex-direction: column;
} */

/* #app-content {
    display: flex;
} */

/* #side-menu {
    display: grid;
    grid-template-columns: max-content;  ensures they all have the same width
    grid-auto-rows: min-content;
    row-gap: 40rem;
} */

/* #section-container {
    width: 300%;
    height: 100cqh;          SOMEHOW THIS WORKS!
    overflow-y: scroll;      ONLY THIS IS ALLOWED TO SCROLL!
} */

/* ------------------- STYLES ------------------- */

/* .app-root-container {
    background-color: #282c34;
    color: white;
} */

/* #section-container {
    background-color: rgb(123, 131, 138);
} */
/*
#app-header {
    font-size: 15rem;
    border-bottom: 3px solid black;
    padding: 10rem;
    padding-left: 20rem;
} */


/* #side-menu {
    font-size: 10rem;
    padding-right: 20rem;
} */

/* .menu-item {
    padding: 2em;
    border-bottom: 1px solid grey;
    color: rgb(210, 209, 209);
}

.menu-item:hover {
    transform: scale(1.1);
    color: rgb(255, 255, 255);
}

.menu-item.active {
    color: white;
    font-weight: bold;
}

*/

function App() {
    return (
        // ROOT CONTAINER: flex-col w-screen h-screen overflow-hidden
        <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#282c34] c-white">
            <div id="app-header" className="text-3xl border-b-2 border-black p-4 pl-8">
                <h1 className="">Job Tool</h1>
            </div>
            {/* SIDE-MENU : SECTION CONTAINER */}
            <TabGroup className="flex">
                <TabList id="side-menu" className="grid grid-rows-[min-content] grid-cols-[max-content] text-1.5xl p-4 gap-5">
                    {tabs.map((tab) => (
                        // MENU ITEM
                        <Tab
                            as="div"
                            key={tab.name}
                            className="p-2em border-b border-gray-500 hover:scale-100 hover:text-white active:text-white font-bold"
                        >
                            {tab.name}
                        </Tab>
                    ))}
                </TabList>
                <TabPanels
                    id="section-container"
                    className="h-[100cqh] overflow-y-scroll bg-[#868686]"
                >
                    {tabs.map((tab) => (
                        <TabPanel>{tab.content}</TabPanel>
                    ))}
                </TabPanels>
            </TabGroup>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
